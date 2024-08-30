const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const pino = require('pino');
const pretty = require('pino-pretty');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const { Kafka } = require('kafkajs');

const { IoCContainer } = require('./utils/ioc-container');
const { Logger } = require('./utils/logger');
const { SocketIoTransport } = require('./adapters/socket-io.transport');
const { UserSocketMapping } = require("./adapters/user-socket.mapping");

const { GroupService } = require('./group/group.service');
const { GroupRepository } = require('./group/group.repository');
const { GroupController } = require("./group/group.controller");

const { MessageController } = require('./message/message.controller');
const { MessageService } = require('./message/message.service');

const { UserController } = require('./user/user.controller');
const { UserService } = require('./user/user.service');
const { UserRepository } = require('./user/user.repository');

const { groupEvents } = require("./group/group.events");
const { messageEvents } = require("./message/message.events");
const { userEvents } = require("./user/user.events");

const { socketAuthMiddleware } = require("./middlewares/socket-auth.middleware");
const { KafkaTransport } = require("./adapters/kafka.transport");
const { KafkaProducer } = require("./adapters/kafka.producer");
const { KafkaConsumer } = require("./adapters/kafka.consumer");
const { MessageHandler } = require("./adapters/message.handler");

const app = async () => {
    const jwtSecret = process.env.JWT_SECRET  || "jwtSecret"

    const container = new IoCContainer();

    const app = express();
    const server = http.createServer(app);
    const socket = new Server(server);

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

    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    const kafka = new Kafka({
        clientId: 'messages',
        brokers: [process.env.KAFKA_URL]
    });

    socket.adapter(createAdapter(pubClient, subClient));

    container.register(
        'Logger',
        () => new Logger(logger),
    );

    container.register(
        'UserSocketMapping',
        UserSocketMapping
    );

    container.register(
        'Transport',
        (userSocketMapping, logger) => new SocketIoTransport(
            socket,
            userSocketMapping,
            logger
        ),
        [
            'UserSocketMapping',
            'Logger'
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
        'KafkaTransport',
        KafkaTransport,
        [
            'KafkaProducer',
            'Logger'
        ]
    );

    container.register(
        'UserRepository',
        UserRepository
    );

    container.register(
        'GroupRepository',
        GroupRepository
    );

    container.register(
        'GroupService',
        GroupService,
        [
            'GroupRepository',
            'Transport',
            'Logger'
        ]
    );

    container.register(
        'MessageInService',
        MessageService,
        [
            'KafkaTransport',
            'Logger',
        ]
    );

    container.register(
        'MessageOutService',
        MessageService,
        [
            'KafkaTransport',
            'Logger',
        ]
    );

    container.register(
        'UserService',
        UserService,
        [
            'UserRepository'
        ]
    );

    container.register(
        'GroupController',
        GroupController,
        [
            'GroupService',
        ]
    );

    container.register(
        'MessageController',
        MessageController,
        [
            'MessageInService',
        ]
    );

    container.register(
        'UserController',
        UserController,
        [
            'UserService',
            'Logger',
        ]
    );

    container.register(
        'MessageHandler',
        MessageHandler,
        [
            'MessageOutService',
        ]
    );

    container.register(
        'KafkaConsumer',
        (messageHandler, logger) => new KafkaConsumer(
            kafka,
            [
                process.env.KAFKA_PROCESSED_MESSAGES_TOPIC
            ],
            messageHandler,
            logger
        ),
        [
            'MessageHandler',
            'Logger',
        ]
    );

    socket.use(socketAuthMiddleware(jwtSecret, logger))

    socket.on('connection', (clientSocket) => {
        logger.info(`User connected: ${clientSocket.userId} by Socket: ${clientSocket.id}`);

        if (!clientSocket.userId) {
            throw new Error("Connection is not authorized");
        }

        const userSocketMapping = container.get('UserSocketMapping');

        logger.info(`User ${clientSocket.userId} is now associated with Socket ${clientSocket.id}`);
        userSocketMapping.add(clientSocket.userId, clientSocket.id);

        // Register handlers
        [
            groupEvents,
            messageEvents,
            userEvents,
        ].forEach(handler => handler(clientSocket, container));
        // Register handlers

        clientSocket.on('disconnect', async () => {
            await userSocketMapping.removeBySocketId(clientSocket.id);
            logger.info(`Socket ${clientSocket.id} disconnected and removed from mapping`);
        });
    });

    /** @type {KafkaConsumer} */
    const kafkaConsumer = container.get('KafkaConsumer');
    await kafkaConsumer.connect();

    /** @type {KafkaProducer} */
    const kafkaProducer = container.get('KafkaProducer');
    await kafkaProducer.connect();

    app.use(express.json());

    const port = process.env.PORT || 3000;

    server.listen(port, () => {
        logger.info(`Server is running on port: ${port}`);
    });

    const gracefulShutdown = () => {
        logger.info('Received shutdown signal, shutting down gracefully...');
        server.close(async () => {
            logger.info('Closed out remaining connections');
            socket.close();
            await mongoose.connection.close(false);
            kafkaProducer.disconnect()
            kafkaConsumer.disconnect()
        });

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

    return server;
}

module.exports = app;