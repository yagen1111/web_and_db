const { Kafka } = require('kafkajs');
require('dotenv').config();

async function sendTestCDCMessages() {
    try {
        // Initialize Kafka producer
        const brokersEnv = process.env.KAFKA_BROKERS || 'localhost:9092';
        const brokers = brokersEnv.split(',').map(b => b.trim()).filter(Boolean);

        const useSsl = String(process.env.KAFKA_SSL || '').toLowerCase() === 'true';
        const saslUsername = process.env.KAFKA_SASL_USERNAME || '';
        const saslPassword = process.env.KAFKA_SASL_PASSWORD || '';
        const saslMechanismEnv = (process.env.KAFKA_SASL_MECHANISM || '').toLowerCase();
        const validMechanisms = ['plain', 'scram-sha-256', 'scram-sha-512'];
        const saslMechanism = validMechanisms.includes(saslMechanismEnv) ? saslMechanismEnv : undefined;

        const kafkaConfig = {
            clientId: 'test-cdc-producer',
            brokers,
            retry: {
                initialRetryTime: 100,
                retries: 3
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

        const kafka = new Kafka(kafkaConfig);
        const producer = kafka.producer();

        await producer.connect();
        console.log('Connected to Kafka');

        const topic = process.env.CDC_TOPICS || 'tidb-cdc';
        console.log(`📤 Sending test messages to topic: ${topic}`);

        // Test INSERT message
        const insertMessage = {
            type: 'insert',
            database: 'test',
            table: 'user_data',
            ts: Date.now(),
            data: [
                {
                    id: 999,
                    field1: 'Test Insert',
                    field2: 'CDC Test',
                    field3: 'Simulated',
                    created_at: new Date().toISOString()
                }
            ]
        };

        await producer.send({
            topic,
            messages: [
                {
                    key: 'test-insert-999',
                    value: JSON.stringify(insertMessage)
                }
            ]
        });
        console.log('Sent INSERT message');

        // Test UPDATE message
        const updateMessage = {
            type: 'update',
            database: 'test',
            table: 'user_data',
            ts: Date.now(),
            old: [
                {
                    id: 999,
                    field1: 'Test Insert',
                    field2: 'CDC Test',
                    field3: 'Simulated'
                }
            ],
            new: [
                {
                    id: 999,
                    field1: 'Test Update',
                    field2: 'CDC Test Updated',
                    field3: 'Modified'
                }
            ]
        };

        await producer.send({
            topic,
            messages: [
                {
                    key: 'test-update-999',
                    value: JSON.stringify(updateMessage)
                }
            ]
        });
        console.log('Sent UPDATE message');

        // Test DELETE message
        const deleteMessage = {
            type: 'delete',
            database: 'test',
            table: 'user_data',
            ts: Date.now(),
            old: [
                {
                    id: 999,
                    field1: 'Test Update',
                    field2: 'CDC Test Updated',
                    field3: 'Modified'
                }
            ]
        };

        await producer.send({
            topic,
            messages: [
                {
                    key: 'test-delete-999',
                    value: JSON.stringify(deleteMessage)
                }
            ]
        });
        console.log('Sent DELETE message');

        await producer.disconnect();
        console.log('Test messages sent successfully!');
        console.log('Check your CDC consumer console for real-time processing output');

    } catch (error) {
        console.error('Error sending test messages:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    sendTestCDCMessages().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = { sendTestCDCMessages };
