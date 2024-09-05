class KafkaTransport {
	constructor(kafkaProducer, configService, serializer, logger) {
		this.kafkaProducer = kafkaProducer;
		this.topic = configService.get("KAFKA_PROCESSED_MESSAGES_TOPIC");
		this.serializer = serializer;
		this.logger = logger;
	}

	async sendToGroup(groupId, eventName, message) {
		try {
			if (!groupId) {
				throw new Error("Group id is not passed");
			}
			const msg = {
				key: groupId.toString(),
				value: this.serializer.encodeMessage({
					event: eventName,
					data: {
						groupId: message.groupId,
						text: message.text,
					},
				}),
			};
			await this.kafkaProducer.send(this.topic, msg);
			this.logger.info(`Message sent to Kafka successfully: ${eventName}`, {
				topic: this.topic,
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
