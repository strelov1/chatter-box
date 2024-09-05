const { Kafka } = require("kafkajs");
const {
	createIoCContainer,
	setupGracefulShutdown,
	Logger,
	ConfigService,
	MessageSerializerProtobuf,
} = require("@chatter-box/utils");
const { MessageService } = require("./message/message.service");
const { MessageRepository } = require("./message/message.repository");
const { MessageHandler } = require("./adapters/message.handler");
const { KafkaTransport } = require("./adapters/kafka.transport");
const { KafkaConsumer } = require("./adapters/kafka.consumer");
const { KafkaProducer } = require("./adapters/kafka.producer");
const { initializeDatabase, shutdownDatabase } = require("./config/database");
const { initializeServices, shutdownServices } = require("./config/services");

const app = async () => {
	const container = createIoCContainer();

	container.registerMultiple([
		{ token: "Logger", useClass: Logger },
		{ token: "ConfigService", useClass: ConfigService },
		{
			token: "Kafka",
			useFactory: (config) =>
				new Kafka({
					clientId: "msg",
					brokers: [config.get("KAFKA_URL")],
				}),
			dependencies: ["ConfigService"],
		},
		{
			token: "KafkaProducer",
			useClass: KafkaProducer,
			dependencies: ["Kafka", "Logger"],
		},
		{
			token: "KafkaTransport",
			useClass: KafkaTransport,
			dependencies: [
				"KafkaProducer",
				"ConfigService",
				"MessageSerializerProtobuf",
				"Logger",
			],
		},
		{
			token: "KafkaConsumer",
			useFactory: (config, kafka, messageHandler, logger) =>
				new KafkaConsumer(
					kafka,
					[config.get("KAFKA_INCOMING_MESSAGES_TOPIC")],
					messageHandler,
					logger,
				),
			dependencies: ["ConfigService", "Kafka", "MessageHandler", "Logger"],
		},
		{
			token: "MessageRepository",
			useClass: MessageRepository,
		},
		{
			token: "MessageService",
			useClass: MessageService,
			dependencies: ["MessageRepository", "KafkaTransport", "Logger"],
		},
		{
			token: "MessageSerializerProtobuf",
			useClass: MessageSerializerProtobuf,
		},
		{
			token: "MessageHandler",
			useClass: MessageHandler,
			dependencies: ["MessageService", "MessageSerializerProtobuf"],
		},
	]);

	const logger = container.get("Logger");
	const kafkaConsumer = container.get("KafkaConsumer");

	await initializeDatabase(logger);
	await initializeServices(container, logger);

	setupGracefulShutdown(async () => {
		await shutdownDatabase(logger);
		await shutdownServices(container, logger);
	}, logger);

	return kafkaConsumer;
};

module.exports = app;
