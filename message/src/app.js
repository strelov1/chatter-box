const mongoose = require('mongoose');
const pino = require('pino');
const pretty = require('pino-pretty');
const { Kafka } = require('kafkajs');

const { IoCContainer } = require('./utils/ioc-container');
const { Logger } = require('./utils/logger');

const { MessageService } = require('./message/message.service');
const { MessageRepository } = require('./message/message.repository');

const { MessageHandler } = require("./adapters/message.handler");
const { KafkaTransport } = require("./adapters/kafka.transport");
const { KafkaConsumer } = require("./adapters/kafka.consumer");
const { KafkaProducer } = require("./adapters/kafka.producer");

const app = async () => {
    const container = new IoCContainer();

    const logger = pino({
        level: 'info'
    }, pretty({
        colorize: true,
        translateTime: true,
        ignore: 'pid,hostname'
    }));

    mongoose.connect(process.env.MONGO_URL).then(() => {
        logger.info('Connected to MongoDB');
    }).catch(err => {
        logger.error('Failed to connect to MongoDB', err);
    });

    const kafka = new Kafka({
        clientId: 'messages',
        brokers: [process.env.KAFKA_URL]
    });

    container.register(
        'Logger',
        () => new Logger(logger),
    );

    container.register(
        'Transport',
        KafkaTransport,
        [
            'KafkaProducer',
            'Logger',
        ]
    );

    container.register(
        'MessageRepository',
        MessageRepository
    );

    container.register(
        'MessageService',
        MessageService,
        [
            'MessageRepository',
            'Transport',
            'Logger',
        ]
    );

    container.register(
        'MessageHandler',
        MessageHandler,
        [
            'MessageService',
        ]
    );

    container.register(
        'KafkaProducer',
        (logger) => new KafkaProducer(
            kafka,
            logger
        ),
        [
            'Logger'
        ]
    );

    container.register(
        'KafkaConsumer',
        (messageHandler, logger) => new KafkaConsumer(
            kafka,
            [
                process.env.KAFKA_INCOMING_MESSAGES_TOPIC
            ],
            messageHandler,
            logger
        ),
        [
            'MessageHandler',
            'Logger',
        ]
    );

    /** @type {KafkaConsumer} */
    const kafkaConsumer = container.get('KafkaConsumer');
    await kafkaConsumer.connect();

    /** @type {KafkaProducer} */
    const kafkaProducer = container.get('KafkaProducer');
    await kafkaProducer.connect();

    const gracefulShutdown = () => {
        logger.info('Received shutdown signal, shutting down gracefully...');
        logger.info('Closed out remaining connections');
        mongoose.connection.close(false);
        kafkaProducer.disconnect()
        kafkaConsumer.disconnect()

        setTimeout(() => {
            logger.error('Forcing shutdown');
            process.exit(1);
        }, 1000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    process.on('uncaughtException', (err) => {
        logger.error('Uncaught Exception:', err);
        gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        gracefulShutdown();
    });

    return kafkaConsumer;
}

module.exports = app;