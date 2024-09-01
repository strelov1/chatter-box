class KafkaTransport {
	constructor(kafkaProducer, logger) {
		this.kafkaProducer = kafkaProducer;
		this.logger = logger;
	}

	async sendToGroup(groupId, eventName, message) {
		try {
			const msg = {
				key: groupId.toString(),
				value: JSON.stringify({
					event: eventName,
					data: message,
				}),
			};

			const topic = process.env.KAFKA_PROCESSED_MESSAGES_TOPIC;
			await this.kafkaProducer.send(topic, msg);
			this.logger.info(`Message sent to Kafka successfully: ${eventName}`, {
				topic,
				msg,
			});
		} catch (error) {
			this.logger.error("Failed to send message to Kafka", error);
		}
	}

	async disconnect() {
		try {
			await this.kafkaProducer.disconnect();
			this.logger.info("Kafka producer disconnected");
		} catch (error) {
			this.logger.error("Failed to disconnect Kafka producer", error);
		}
	}
}

module.exports.KafkaTransport = KafkaTransport;
