
class KafkaConsumer {
    constructor(kafka, topics, messageHandler, logger) {
        this.kafka = kafka;
        this.topics = topics;
        this.messageHandler = messageHandler;
        this.logger = logger;
        this.consumer = this.kafka.consumer({ groupId: 'test-group2' });
    }

    async connect() {
        try {
            await this.consumer.connect();
            this.logger.info('Kafka consumer connected');
            for (const topic of this.topics) {
                await this.consumer.subscribe({ topic, fromBeginning: true });
                this.logger.info(`Kafka consumer subscribed to topic: ${topic}`);
            }

            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        this.logger.info(`Consuming message from topic: ${topic}, partition: ${partition}, offset: ${message.offset}`);
                        this.logger.info(`Message key: ${message.key.toString()}, value: ${message.value.toString()}`);
                        await this.messageHandler.handleMessage(message);
                        this.logger.info(`Successfully processed message from ${topic} - offset: ${message.offset}`);
                    } catch (error) {
                        this.logger.error('Failed to process message:', error);
                    }
                },
            });
            this.logger.info(`Kafka consumer Done`);
        } catch (error) {
            this.logger.error('Failed to connect Kafka consumer', error);
            throw error;
        }
    }

    async disconnect() {
        await this.consumer.disconnect();
    }
}

module.exports.KafkaConsumer = KafkaConsumer;