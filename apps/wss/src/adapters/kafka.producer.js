const { withTimeout } = require("@chatter-box/utils");

class KafkaProducer {
	constructor(kafka, logger) {
		this.producer = kafka.producer();
		this.logger = logger;
	}

	async send(topic, message) {
		try {
			await withTimeout(
				this.producer.send({
					topic,
					messages: [message],
				}),
				15000,
			);
		} catch (error) {
			this.logger.error("Failed to send message to Kafka", error);
			throw error;
		}
	}

	async connect() {
		try {
			await this.producer.connect();
			this.logger.info("Kafka producer connected");
		} catch (error) {
			this.logger.error("Failed to connect Kafka producer", error);
			throw error;
		}
	}

	async disconnect() {
		try {
			await this.producer.disconnect();
			this.logger.info("Kafka producer disconnected");
		} catch (error) {
			this.logger.error("Failed to disconnect Kafka producer", error);
		}
	}
}

module.exports = {
	KafkaProducer,
};
