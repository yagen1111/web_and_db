const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const session = require('express-session');
require('dotenv').config();
const app = express();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const kafkaService = require('./kafka-service');
const { 
    getUserContext, 
    logAccess, 
    logAuth, 
    logUserAction, 
    logDatabase, 
    logKafka, 
    logError, 
    logSecurity, 
    logSystem 
} = require('./logger');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware settings
// Enhanced HTTP logging middleware with user context
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const responseTime = Date.now() - start;
        logAccess(req, res, responseTime);
    });
    
    next();
});

// הגדרת session עבור flash messages
app.use(session({
    secret: process.env.SECRET_KEY || 'default_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Middleware עבור flash messages
app.use((req, res, next) => {
    res.locals.messages = req.session.messages || {};
    req.session.messages = {};
    next();
});

async function createConnection() {
    const maxAttempts = 10;
    let attempt = 0;
    
    while (attempt < maxAttempts) {
        try {
            const connection = await mysql.createConnection({
                host: process.env.TIDB_HOST,
                port: process.env.TIDB_PORT || 4000,
                user: process.env.TIDB_USER,
                password: process.env.TIDB_PASSWORD,
                database: process.env.TIDB_DATABASE,
                ssl: { rejectUnauthorized: false }
            });
            
            logDatabase('connection_success', {}, {
                host: process.env.TIDB_HOST,
                database: process.env.TIDB_DATABASE,
                attempt: attempt + 1,
                region: process.env.TIDB_REGION || 'unknown'
            });
            return connection;
        } catch (error) {
            attempt++;
            logDatabase('connection_failed', {}, {
                host: process.env.TIDB_HOST,
                database: process.env.TIDB_DATABASE,
                attempt: attempt,
                errorMessage: error.message,
                region: process.env.TIDB_REGION || 'unknown'
            });
            
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
                logError('database_connection_exhausted', error, {}, {
                    host: process.env.TIDB_HOST,
                    database: process.env.TIDB_DATABASE,
                    totalAttempts: maxAttempts,
                    region: process.env.TIDB_REGION || 'unknown'
                });
                return null;
            }
        }
    }
}

// Execute DB query with structured logging
async function executeDbQuery(req, action, sql, params = []) {
    const startTimeMs = Date.now();
    const connection = await createConnection();
    if (!connection) {
        throw new Error('Cannot establish database connection');
    }

    // Basic parameter redaction for sensitive queries
    function redactParamsIfNeeded(sqlText, originalParams) {
        try {
            if (!Array.isArray(originalParams)) return [];
            if (/password/i.test(sqlText)) {
                return originalParams.map((value, index) => index === 1 ? 'REDACTED' : value);
            }
            return originalParams;
        } catch (_) {
            return [];
        }
    }

    const userContext = getUserContext(req);
    const safeParams = redactParamsIfNeeded(sql, params);

    try {
        const [rowsOrResult] = await connection.execute(sql, params);
        const durationMs = Date.now() - startTimeMs;
        logDatabase(`${action}_success`, userContext, {
            query: sql,
            params: safeParams,
            durationMs,
            rowsAffected: typeof rowsOrResult?.affectedRows === 'number' ? rowsOrResult.affectedRows : undefined,
            rowsReturned: Array.isArray(rowsOrResult) ? rowsOrResult.length : undefined
        });
        return rowsOrResult;
    } catch (error) {
        const durationMs = Date.now() - startTimeMs;
        logError('database_query_error', error, userContext, {
            action,
            query: sql,
            params: safeParams,
            durationMs
        });
        throw error;
    } finally {
        await connection.end();
    }
}

// Flash message helper
function flash(req, type, message) {
    if (!req.session.messages) {
        req.session.messages = {};
    }
    req.session.messages[type] = message;
}

// Register route
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await executeDbQuery(
            req,
            'insert_user',
            "INSERT INTO users (username, password) VALUES (?, ?)",
            [username, hashedPassword]
        );

        // Publish user registration event to Kafka (if available)
        try {
            await kafkaService.publishUserAction('user_registered', result.insertId, username, {
                registration_method: 'web_form',
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        } catch (kafkaError) {
            console.warn('Kafka publish failed:', kafkaError.message);
        }
        
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const users = await executeDbQuery(
            req,
            'select_user_by_username',
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (users.length > 0 && await bcrypt.compare(password, users[0].password)) {
            const token = jwt.sign(
                { id: users[0].id, username: users[0].username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            // Publish user login event to Kafka (if available)
            try {
                await kafkaService.publishUserAction('user_logged_in', users[0].id, users[0].username, {
                    login_method: 'web_form',
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent'),
                    login_time: new Date().toISOString()
                });
            } catch (kafkaError) {
                console.warn('Kafka publish failed:', kafkaError.message);
            }
            
            res.json({ token, user: { id: users[0].id, username: users[0].username } });
        } else {
            // Publish failed login attempt to Kafka
            await kafkaService.publishSystemEvent('failed_login_attempt', {
                username: username,
                ip_address: req.ip,
                user_agent: req.get('User-Agent'),
                reason: 'invalid_credentials'
            });
            
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to login page
app.get('/login', (req, res) => {
    res.render('login');
});

// Route to register page
app.get('/register', (req, res) => {
    res.render('register');
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'helfy-api' 
    });
});

// Route to home page - redirect to login if no token
app.get('/', (req, res) => {
    res.render('index');
});

// Route to save data
app.post('/submit', authenticateToken, async (req, res) => {
    const { input1, input2, input3 } = req.body;
    
    try {
        const query = "INSERT INTO user_data (field1, field2, field3) VALUES (?, ?, ?)";
        const values = [input1, input2, input3];
        const result = await executeDbQuery(req, 'insert_user_data', query, values);

        // Publish data creation event to Kafka
        await kafkaService.publishDataUpdate('data_created', result.insertId, {
            user_id: req.user.id,
            username: req.user.username,
            field1: input1,
            field2: input2,
            field3: input3,
            ip_address: req.ip
        });
        
        flash(req, 'success', 'Data saved successfully!');
    } catch (error) {
        // Publish data creation error to Kafka
        await kafkaService.publishSystemEvent('data_creation_error', {
            user_id: req.user.id,
            username: req.user.username,
            error_message: error.message,
            attempted_data: { input1, input2, input3 }
        });
        
        flash(req, 'danger', `Error saving data: ${error.message}`);
    }
    
    res.redirect('/');
});

// Route to display all data (page)
app.get('/view_data', (req, res) => {
    res.render('view_data');
});

// API route to get data
app.get('/api/data', authenticateToken, async (req, res) => {
    try {
        const rows = await executeDbQuery(req, 'select_user_data', "SELECT * FROM user_data");
        res.json({ data: rows });
    } catch (error) {
        res.status(500).json({ error: `Error loading data: ${error.message}` });
    }
});

// Initialize Kafka and start server
async function startServer() {
    try {
        // Try to initialize Kafka service (optional)
        let kafkaInitialized = false;
        try {
            kafkaInitialized = await kafkaService.initialize();
            if (kafkaInitialized) {
                console.log('📡 Kafka service ready');
                
                // Subscribe to topics for processing events
                const enableAppTopics = String(process.env.ENABLE_APP_TOPICS || 'true').toLowerCase() === 'true';
                const baseTopics = enableAppTopics ? ['user-actions', 'data-updates', 'system-events'] : [];
                const cdcTopicsEnv = process.env.CDC_TOPICS || '';
                const cdcTopics = cdcTopicsEnv
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t.length > 0);
                const topics = [...new Set([...baseTopics, ...cdcTopics])];
                const cdcTopicSet = new Set(cdcTopics);

                await kafkaService.subscribeToTopics(topics, async (topic, message, rawMessage) => {
                    // Handle incoming messages (logging, processing, etc.)
                    try {
                        if (cdcTopicSet.has(topic)) {
                            // TiCDC common payloads (canal-json/open-protocol like)
                            const eventType = (message.type || message.op || 'unknown').toString().toLowerCase();
                            const database = message.database || message.db || undefined;
                            const table = message.table || message.tbl || undefined;
                            const rows = Array.isArray(message.data) ? message.data.length : (message.after || message.before ? 1 : undefined);
                            logDatabase('cdc_event', {}, {
                                topic,
                                eventType,
                                database,
                                table,
                                rows
                            });
                        } else {
                            // Non-CDC events: keep console output minimal
                            console.log(`Processing message from ${topic}:`, message);
                        }
                    } catch (handlerError) {
                        logError('kafka_message_handler_error', handlerError, {}, { topic });
                    }
                });
                
                // Publish system startup event (only if app topics enabled)
                const enableAppTopicsForPublish = String(process.env.ENABLE_APP_TOPICS || 'true').toLowerCase() === 'true';
                if (enableAppTopicsForPublish) {
                    await kafkaService.publishSystemEvent('service_started', {
                        service: 'helfy-api',
                        version: '1.0.0',
                        environment: process.env.NODE_ENV || 'development',
                        port: process.env.PORT || 3000
                    });
                }
            }
        } catch (kafkaError) {
            console.warn('Kafka service failed to initialize, continuing without it:', kafkaError.message);
        }

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, '0.0.0.0', () => {
                console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
            if (kafkaInitialized) {
                console.log(`📡 Kafka events enabled`);
            } else {
                console.log(`📡 Kafka events disabled (running in standalone mode)`);
            }
        });

    } catch (error) {
        console.error('💥 Failed to start server:', error.message);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    const enableAppTopicsForPublish = String(process.env.ENABLE_APP_TOPICS || 'true').toLowerCase() === 'true';
    if (enableAppTopicsForPublish) {
        await kafkaService.publishSystemEvent('service_stopping', {
            service: 'helfy-api',
            reason: 'SIGTERM'
        });
    }
    await kafkaService.disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 Received SIGINT, shutting down gracefully');
    const enableAppTopicsForPublish = String(process.env.ENABLE_APP_TOPICS || 'true').toLowerCase() === 'true';
    if (enableAppTopicsForPublish) {
        await kafkaService.publishSystemEvent('service_stopping', {
            service: 'helfy-api',
            reason: 'SIGINT'
        });
    }
    await kafkaService.disconnect();
    process.exit(0);
});

// Start the server
startServer();