const { Kafka } = require('kafkajs');
const log4js = require('log4js');
const path = require('path');

// Configure log4js for the consumer
log4js.configure(path.join(__dirname, 'config', 'log4js.json'));
const logger = log4js.getLogger('cdc-consumer');

class CDCConsumer {
    constructor() {
        this.kafka = null;
        this.consumer = null;
        this.isRunning = false;
        this.processedCount = 0;
        this.errorCount = 0;
    }

    async initialize() {
        try {
            const brokersEnv = process.env.KAFKA_BROKERS || 'localhost:9092';
            const brokers = brokersEnv.split(',').map(b => b.trim()).filter(Boolean);

            const useSsl = String(process.env.KAFKA_SSL || '').toLowerCase() === 'true';
            const saslUsername = process.env.KAFKA_SASL_USERNAME || '';
            const saslPassword = process.env.KAFKA_SASL_PASSWORD || '';
            const saslMechanismEnv = (process.env.KAFKA_SASL_MECHANISM || '').toLowerCase();
            const validMechanisms = ['plain', 'scram-sha-256', 'scram-sha-512'];
            const saslMechanism = validMechanisms.includes(saslMechanismEnv) ? saslMechanismEnv : undefined;

            const kafkaConfig = {
                clientId: 'helfy-cdc-consumer',
                brokers,
                retry: {
                    initialRetryTime: 100,
                    retries: 8
                }
            };

            if (useSsl) {
                kafkaConfig.ssl = true;
            }

            if (saslMechanism && saslUsername && saslPassword) {
                kafkaConfig.sasl = {
                    mechanism: saslMechanism,
                    username: saslUsername,
                    password: saslPassword
                };
            }

            this.kafka = new Kafka(kafkaConfig);
            this.consumer = this.kafka.consumer({
                groupId: 'helfy-cdc-consumer-group',
                sessionTimeout: 30000,
                heartbeatInterval: 3000,
            });

            logger.info('CDC Consumer initialized successfully', {
                brokers: brokers,
                ssl: useSsl,
                sasl: saslMechanism || 'none'
            });

            return true;
        } catch (error) {
            logger.error('Failed to initialize CDC Consumer:', error);
            return false;
        }
    }

    async connect() {
        try {
            await this.consumer.connect();
            logger.info('CDC Consumer connected to Kafka');
            return true;
        } catch (error) {
            logger.error('Failed to connect CDC Consumer:', error);
            return false;
        }
    }

    async subscribeToTopics(topics) {
        try {
            for (const topic of topics) {
                await this.consumer.subscribe({ topic: topic, fromBeginning: false });
                logger.info(`Subscribed to topic: ${topic}`);
            }
            return true;
        } catch (error) {
            logger.error('Failed to subscribe to topics:', error);
            return false;
        }
    }

    async startConsuming() {
        if (this.isRunning) {
            logger.warn('Consumer is already running');
            return;
        }

        try {
            this.isRunning = true;
            logger.info('Starting CDC message consumption...');

            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const messageValue = JSON.parse(message.value.toString());
                        this.processedCount++;
                        
                        // Process the CDC message
                        await this.processCDCMessage(topic, messageValue, {
                            partition,
                            offset: message.offset,
                            key: message.key?.toString(),
                            timestamp: message.timestamp
                        });

                        // Log every 100th message for performance monitoring
                        if (this.processedCount % 100 === 0) {
                            logger.info(`Processed ${this.processedCount} messages`, {
                                topic,
                                partition,
                                lastOffset: message.offset
                            });
                        }

                    } catch (error) {
                        this.errorCount++;
                        logger.error('Error processing CDC message:', error, {
                            topic,
                            partition,
                            offset: message.offset,
                            errorCount: this.errorCount
                        });
                    }
                }
            });

            logger.info('CDC Consumer started successfully');
        } catch (error) {
            this.isRunning = false;
            logger.error('Failed to start CDC Consumer:', error);
            throw error;
        }
    }

    async processCDCMessage(topic, message, metadata) {
        try {
            // Extract CDC event information
            const eventType = (message.type || message.op || 'unknown').toString().toLowerCase();
            const database = message.database || message.db || 'unknown';
            const table = message.table || message.tbl || 'unknown';
            const timestamp = message.ts || message.timestamp || new Date().toISOString();
            
            // Process different event types
            switch (eventType) {
                case 'insert':
                    await this.handleInsertEvent(database, table, message, metadata);
                    break;
                case 'update':
                    await this.handleUpdateEvent(database, table, message, metadata);
                    break;
                case 'delete':
                    await this.handleDeleteEvent(database, table, message, metadata);
                    break;
                default:
                    logger.warn(`Unknown event type: ${eventType}`, { message, metadata });
            }

                    // Log event details
        console.log(`\nCDC Event: ${eventType.toUpperCase()} on ${database}.${table}`);
        console.log(`Topic: ${topic}, Partition: ${metadata.partition}, Offset: ${metadata.offset}`);
        console.log(`Timestamp: ${timestamp}`);
        
        if (message.data) {
            console.log(`Data: ${JSON.stringify(message.data, null, 2)}`);
        }
        if (message.old && message.new) {
            console.log(`Old: ${JSON.stringify(message.old, null, 2)}`);
            console.log(`New: ${JSON.stringify(message.new, null, 2)}`);
        }
        console.log(`Stats: ${this.processedCount} processed, ${this.errorCount} errors\n`);

        } catch (error) {
            logger.error('Error in processCDCMessage:', error, { message, metadata });
            throw error;
        }
    }

    async handleInsertEvent(database, table, message, metadata) {
        logger.info('Processing INSERT event', { database, table, metadata });
        
        // TODO: Add custom insert processing logic here
        // - Send notifications
        // - Update caches  
        // - Trigger workflows
    }

    async handleUpdateEvent(database, table, message, metadata) {
        logger.info('Processing UPDATE event', { database, table, metadata });
        
        // TODO: Add custom update processing logic here
        // - Track changes
        // - Update search indexes
    }

    async handleDeleteEvent(database, table, message, metadata) {
        logger.info('Processing DELETE event', { database, table, metadata });
        
        // TODO: Add custom delete processing logic here
        // - Cleanup related data
        // - Archive records
    }

    async stop() {
        try {
            this.isRunning = false;
            if (this.consumer) {
                await this.consumer.disconnect();
                logger.info('CDC Consumer stopped and disconnected');
            }
        } catch (error) {
            logger.error('Error stopping CDC Consumer:', error);
        }
    }

    getStats() {
        return {
            isRunning: this.isRunning,
            processedCount: this.processedCount,
            errorCount: this.errorCount,
            timestamp: new Date().toISOString()
        };
    }
}

// Main execution
async function main() {
    const consumer = new CDCConsumer();
    
    try {
        // Setup consumer
        if (!await consumer.initialize()) {
            logger.error('Failed to initialize CDC Consumer');
            process.exit(1);
        }

        if (!await consumer.connect()) {
            logger.error('Failed to connect CDC Consumer');
            process.exit(1);
        }

        // Subscribe to topics
        const topics = (process.env.CDC_TOPICS || 'tidb-cdc').split(',').map(t => t.trim()).filter(Boolean);
        if (!await consumer.subscribeToTopics(topics)) {
            logger.error('Failed to subscribe to CDC topics');
            process.exit(1);
        }

        // Start consuming messages
        await consumer.startConsuming();

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM, shutting down gracefully');
            await consumer.stop();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            logger.info('Received SIGINT, shutting down gracefully');
            await consumer.stop();
            process.exit(0);
        });

        // Health check endpoint (optional)
        if (process.env.ENABLE_HEALTH_CHECK === 'true') {
            const http = require('http');
            const server = http.createServer((req, res) => {
                if (req.url === '/health') {
                    const stats = consumer.getStats();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(stats, null, 2));
                } else {
                    res.writeHead(404);
                    res.end('Not Found');
                }
            });
            
            const port = process.env.HEALTH_CHECK_PORT || 3001;
            server.listen(port, () => {
                logger.info(`Health check server listening on port ${port}`);
            });
        }

    } catch (error) {
        logger.error('Fatal error in CDC Consumer:', error);
        await consumer.stop();
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = CDCConsumer;
