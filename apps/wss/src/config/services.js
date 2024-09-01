const initializeServices = async (container, logger) => {
	/** @type {KafkaConsumer} */
	const kafkaConsumer = container.get("KafkaConsumer");
	await kafkaConsumer.connect();

	/** @type {KafkaProducer} */
	const kafkaProducer = container.get("KafkaProducer");
	await kafkaProducer.connect();

	const redisPublisher = container.get("RedisPublisher");
	const redisSubscriber = container.get("RedisSubscriber");

	await redisPublisher.connect();
	await redisSubscriber.connect();

	logger.info("Services initialize successfully");
};

const shutdownServices = async (container, logger) => {
	const kafkaProducer = container.get("KafkaProducer");
	const kafkaConsumer = container.get("KafkaConsumer");

	await kafkaProducer.disconnect();
	await kafkaConsumer.disconnect();

	const redisPublisher = container.get("RedisPublisher");
	const redisSubscriber = container.get("RedisSubscriber");

	await redisPublisher.disconnect();
	await redisSubscriber.disconnect();

	logger.info("Services shutdown successfully");
};

module.exports = {
	initializeServices,
	shutdownServices,
};
