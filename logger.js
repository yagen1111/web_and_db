const log4js = require('log4js');
const path = require('path');

// Configure log4js from config file
log4js.configure(path.join(__dirname, 'config', 'log4js.json'));

// Create loggers for different categories
const appLogger = log4js.getLogger('app');
const accessLogger = log4js.getLogger('access');
const kafkaLogger = log4js.getLogger('kafka');
const databaseLogger = log4js.getLogger('database');
const errorLogger = log4js.getLogger('error');
const securityLogger = log4js.getLogger('security');

/**
 * Create a structured log message with user context
 * Format: timestamp, user ID, action, IP address, additional data
 */
function createLogMessage(action, userContext = {}, additionalData = {}) {
    const logData = {
        action: action,
        userId: userContext.userId || 'anonymous',
        username: userContext.username || 'unknown',
        ipAddress: userContext.ipAddress || 'unknown',
        userAgent: userContext.userAgent || 'unknown',
        sessionId: userContext.sessionId || null,
        ...additionalData
    };
    
    return JSON.stringify(logData);
}

/**
 * Enhanced logger class with user context support
 */
class ContextLogger {
    constructor(logger, category) {
        this.logger = logger;
        this.category = category;
    }

    info(action, userContext = {}, additionalData = {}) {
        const message = createLogMessage(action, userContext, additionalData);
        this.logger.info(message);
    }

    warn(action, userContext = {}, additionalData = {}) {
        const message = createLogMessage(action, userContext, additionalData);
        this.logger.warn(message);
    }

    error(action, userContext = {}, additionalData = {}, errorObj = null) {
        const logData = {
            action: action,
            userId: userContext.userId || 'anonymous',
            username: userContext.username || 'unknown',
            ipAddress: userContext.ipAddress || 'unknown',
            userAgent: userContext.userAgent || 'unknown',
            sessionId: userContext.sessionId || null,
            error: errorObj ? {
                message: errorObj.message,
                stack: errorObj.stack,
                name: errorObj.name
            } : null,
            ...additionalData
        };
        
        this.logger.error(JSON.stringify(logData));
    }

    debug(action, userContext = {}, additionalData = {}) {
        const message = createLogMessage(action, userContext, additionalData);
        this.logger.debug(message);
    }

    // Simple logging without user context for system messages
    system(level, message, data = {}) {
        const logMessage = JSON.stringify({
            action: 'system',
            message: message,
            ...data
        });
        
        this.logger[level](logMessage);
    }
}

// Create enhanced loggers
const Logger = {
    app: new ContextLogger(appLogger, 'app'),
    access: new ContextLogger(accessLogger, 'access'),
    kafka: new ContextLogger(kafkaLogger, 'kafka'),
    database: new ContextLogger(databaseLogger, 'database'),
    error: new ContextLogger(errorLogger, 'error'),
    security: new ContextLogger(securityLogger, 'security')
};

/**
 * Extract user context from Express request object
 */
function getUserContext(req) {
    return {
        userId: req.user ? req.user.id : null,
        username: req.user ? req.user.username : null,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        sessionId: req.sessionID || null,
        method: req.method,
        url: req.url,
        origin: req.get('Origin') || null
    };
}

/**
 * Log HTTP access with user context
 */
function logAccess(req, res, responseTime) {
    const userContext = getUserContext(req);
    const additionalData = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: responseTime,
        contentLength: res.get('Content-Length') || 0,
        referrer: req.get('Referrer') || null
    };
    
    Logger.access.info('http_request', userContext, additionalData);
}

/**
 * Log authentication events
 */
function logAuth(action, userContext, additionalData = {}) {
    Logger.security.info(action, userContext, {
        category: 'authentication',
        ...additionalData
    });
}

/**
 * Log user actions
 */
function logUserAction(action, userContext, additionalData = {}) {
    Logger.app.info(action, userContext, {
        category: 'user_action',
        ...additionalData
    });
}

/**
 * Log database operations
 */
function logDatabase(action, userContext = {}, additionalData = {}) {
    Logger.database.info(action, userContext, {
        category: 'database',
        ...additionalData
    });
}

/**
 * Log Kafka events
 */
function logKafka(action, userContext = {}, additionalData = {}) {
    Logger.kafka.info(action, userContext, {
        category: 'kafka',
        ...additionalData
    });
}

/**
 * Log errors with full context
 */
function logError(action, error, userContext = {}, additionalData = {}) {
    Logger.error.error(action, userContext, {
        category: 'error',
        ...additionalData
    }, error);
}

/**
 * Log security events
 */
function logSecurity(action, userContext = {}, additionalData = {}) {
    Logger.security.warn(action, userContext, {
        category: 'security',
        ...additionalData
    });
}

/**
 * System startup/shutdown logs
 */
function logSystem(level, message, data = {}) {
    Logger.app.system(level, message, {
        category: 'system',
        ...data
    });
}

module.exports = {
    Logger,
    getUserContext,
    logAccess,
    logAuth,
    logUserAction,
    logDatabase,
    logKafka,
    logError,
    logSecurity,
    logSystem,
    createLogMessage
};