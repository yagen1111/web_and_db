const { Kafka } = require('kafkajs');

class KafkaService {
    constructor() {
        this.kafka = null;
        this.producer = null;
        this.consumer = null;
        this.isProducerConnected = false;
        this.isConsumerConnected = false;
    }

    async initialize() {
        try {
            const brokersEnv = process.env.KAFKA_BROKER || process.env.KAFKA_BROKERS || 'localhost:9092';
            const brokers = brokersEnv.split(',').map(b => b.trim()).filter(Boolean);

            const useSsl = String(process.env.KAFKA_SSL || '').toLowerCase() === 'true';
            const saslUsername = process.env.KAFKA_SASL_USERNAME || '';
            const saslPassword = process.env.KAFKA_SASL_PASSWORD || '';
            const saslMechanismEnv = (process.env.KAFKA_SASL_MECHANISM || '').toLowerCase();
            const validMechanisms = ['plain', 'scram-sha-256', 'scram-sha-512'];
            const saslMechanism = validMechanisms.includes(saslMechanismEnv) ? saslMechanismEnv : undefined;

            const kafkaConfig = {
                clientId: 'helfy-app',
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

            // Initialize producer
            this.producer = this.kafka.producer({
                maxInFlightRequests: 1,
                idempotent: true,
                transactionTimeout: 30000,
            });

            // Initialize consumer
            this.consumer = this.kafka.consumer({
                groupId: 'helfy-consumer-group',
                sessionTimeout: 30000,
                heartbeatInterval: 3000,
            });

            console.log('Kafka service initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Kafka service:', error.message);
            return false;
        }
    }

    async connectProducer() {
        try {
            if (this.producer && !this.isProducerConnected) {
                await this.producer.connect();
                this.isProducerConnected = true;
                console.log('Kafka producer connected');
            }
        } catch (error) {
            console.error('Failed to connect Kafka producer:', error.message);
            throw error;
        }
    }

    async connectConsumer() {
        try {
            if (this.consumer && !this.isConsumerConnected) {
                await this.consumer.connect();
                this.isConsumerConnected = true;
                console.log('Kafka consumer connected');
            }
        } catch (error) {
            console.error('Failed to connect Kafka consumer:', error.message);
            throw error;
        }
    }

    async publishMessage(topic, message, key = null) {
        try {
            if (!this.isProducerConnected) {
                await this.connectProducer();
            }

            const messagePayload = {
                topic: topic,
                messages: [{
                    key: key,
                    value: JSON.stringify({
                        ...message,
                        timestamp: new Date().toISOString(),
                        source: 'helfy-app'
                    })
                }]
            };

            await this.producer.send(messagePayload);
            console.log(`Message published to topic: ${topic}`);
            return true;
        } catch (error) {
            console.error(`Failed to publish message to topic ${topic}:`, error.message);
            return false;
        }
    }

    async subscribeToTopics(topics, messageHandler) {
        try {
            if (!this.isConsumerConnected) {
                await this.connectConsumer();
            }

            for (const topic of topics) {
                await this.consumer.subscribe({ topic: topic, fromBeginning: false });
                console.log(`Subscribed to topic: ${topic}`);
            }

            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const messageValue = JSON.parse(message.value.toString());
                        console.log(`Received message from topic: ${topic}`, {
                            partition,
                            offset: message.offset,
                            key: message.key?.toString(),
                            value: messageValue
                        });
                        
                        if (messageHandler) {
                            await messageHandler(topic, messageValue, message);
                        }
                    } catch (error) {
                        console.error(`Error processing message from topic ${topic}:`, error.message);
                    }
                }
            });

            return true;
        } catch (error) {
            console.error('Failed to subscribe to topics:', error.message);
            return false;
        }
    }

    async publishUserAction(action, userId, username, data = {}) {
        return await this.publishMessage('user-actions', {
            action,
            userId,
            username,
            data,
            environment: process.env.NODE_ENV || 'development'
        }, `user-${userId}`);
    }

    async publishDataUpdate(operation, recordId, data = {}) {
        return await this.publishMessage('data-updates', {
            operation,
            recordId,
            data,
            environment: process.env.NODE_ENV || 'development'
        }, `record-${recordId}`);
    }

    async publishSystemEvent(event, details = {}) {
        return await this.publishMessage('system-events', {
            event,
            details,
            environment: process.env.NODE_ENV || 'development'
        }, `system-${Date.now()}`);
    }

    async disconnect() {
        try {
            if (this.producer && this.isProducerConnected) {
                await this.producer.disconnect();
                this.isProducerConnected = false;
                console.log('Kafka producer disconnected');
            }

            if (this.consumer && this.isConsumerConnected) {
                await this.consumer.disconnect();
                this.isConsumerConnected = false;
                console.log('Kafka consumer disconnected');
            }
        } catch (error) {
            console.error('Error disconnecting from Kafka:', error.message);
        }
    }
}

// Export singleton instance
const kafkaService = new KafkaService();
module.exports = kafkaService;