class KafkaConsumer {
	constructor(kafka, topics, messageHandler, logger) {
		this.kafka = kafka;
		this.topics = topics;
		this.messageHandler = messageHandler;
		this.logger = logger;
		this.consumer = this.kafka.consumer({
			groupId: "wss-group",
		});
	}

	async connect() {
		try {
			await this.consumer.connect();
			this.logger.info("Kafka consumer connected");
			for (const topic of this.topics) {
				await this.consumer.subscribe({ topic });
				this.logger.info(`Kafka consumer subscribed to topic: ${topic}`);
			}

			await this.consumer.run({
				eachMessage: async ({ message }) => {
					try {
						this.logger.info(`Message consumed: ${message.key.toString()}`);
						await this.messageHandler.handleMessage(message);
					} catch (error) {
						this.logger.error("Failed to process message:", error);
					}
				},
			});
		} catch (error) {
			this.logger.error("Failed to connect Kafka consumer", error);
			throw error;
		}
	}

	async disconnect() {
		await this.consumer.disconnect();
	}
}

module.exports.KafkaConsumer = KafkaConsumer;
