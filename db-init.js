const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
    console.log('Starting database initialization...');
    
    // Wait a bit for other services to be ready
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    let connection;
    let retries = 5;
    
    while (retries > 0) {
        try {
            connection = await mysql.createConnection({
                host: process.env.TIDB_HOST,
                port: process.env.TIDB_PORT || 4000,
                user: process.env.TIDB_USER,
                password: process.env.TIDB_PASSWORD,
                database: process.env.TIDB_DATABASE,
                ssl: { rejectUnauthorized: false }
            });
            
            console.log('Connected to TiDB successfully');
            console.log(`📍 Region: ${process.env.TIDB_REGION || 'unknown'}`);
            break;
        } catch (error) {
            retries--;
            console.log(`Database connection failed. Retries left: ${retries}`);
            console.log(`Error: ${error.message}`);
            
            if (retries === 0) {
                console.error('Failed to connect to database after all retries');
                process.exit(1);
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    try {
        // Set character encoding
        await connection.execute('SET NAMES utf8mb4');
        console.log('Character encoding set');
        
        // Create users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id int NOT NULL AUTO_INCREMENT,
                username varchar(50) UNIQUE NOT NULL,
                password varchar(255) NOT NULL,
                created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            )
        `);
        console.log('Users table created');
        
        // Create user_data table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_data (
                id int NOT NULL AUTO_INCREMENT,
                field1 varchar(255) NOT NULL,
                field2 varchar(255) NOT NULL,
                field3 varchar(255) NOT NULL,
                created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            )
        `);
        console.log('User_data table created');
        
        // Create default admin user
        const defaultUsername = process.env.DEFAULT_USERNAME || 'admin';
        const defaultPassword = process.env.DEFAULT_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Check if default user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE username = ?',
            [defaultUsername]
        );
        
        if (existingUsers.length === 0) {
            await connection.execute(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                [defaultUsername, hashedPassword]
            );
            console.log(`Default user created: ${defaultUsername}/${defaultPassword}`);
        } else {
            console.log(`Default user '${defaultUsername}' already exists`);
        }
        
        // Insert sample data
        const [existingData] = await connection.execute('SELECT COUNT(*) as count FROM user_data');
        if (existingData[0].count === 0) {
            await connection.execute(`
                INSERT INTO user_data (field1, field2, field3) VALUES
                ('Sample Data 1', 'Initial Value', 'Docker Setup'),
                ('Sample Data 2', 'Test Entry', 'Kafka Integration'),
                ('Sample Data 3', 'Demo Record', 'TiDB Connection')
            `);
            console.log('Sample data inserted');
        } else {
            console.log('Sample data already exists');
        }
        
        console.log('Database initialization completed successfully!');
        
    } catch (error) {
        console.error('Database initialization failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run initialization
initializeDatabase();