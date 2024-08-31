const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const { Kafka } = require('kafkajs');

const { createIoCContainer} = require('./utils/ioc-container');
const { Logger } = require('./utils/logger');
const { SocketIoTransport } = require('./adapters/socket-io.transport');
const { UserSocketMapping } = require("./adapters/user-socket.mapping");

const { KafkaTransport } = require("./adapters/kafka.transport");
const { KafkaProducer } = require("./adapters/kafka.producer");
const { KafkaConsumer } = require("./adapters/kafka.consumer");
const { MessageHandler } = require("./adapters/message.handler");

const { GroupService } = require('./group/group.service');
const { GroupRepository } = require('./group/group.repository');
const { GroupController } = require("./group/group.controller");

const { MessageController } = require('./message/message.controller');
const { MessageService } = require('./message/message.service');

const { groupEvents } = require("./group/group.events");
const { messageEvents } = require("./message/message.events");

const { socketAuthMiddleware } = require("./middlewares/socket-auth.middleware");
const { initializeDatabase, shutdownDatabase } = require("./config/database");
const { initializeServices, shutdownServices} = require("./config/services");
const { createRegisterEventHandlers } = require("./adapters/socket-event.hanlder");
const { socketUserMapperMiddleware } = require("./middlewares/socket-user-mapper.middleware");
const {ConfigService, KAFKA_PROCESSED_MESSAGES_TOPIC, REDIS_URL, PORT, JWT_SECRET} = require("./utils/config.service");

const app = async () => {
    const server = http.createServer();
    const socket = new Server(server);

    const container = createIoCContainer();

    container.registerMultiple([
        { token: 'Logger', useClass: Logger },
        { token: 'ConfigService', useClass: ConfigService },
        {
            token: 'Kafka',
            useFactory: (config) => new Kafka({
                clientId: 'websocket-service',
                brokers: [config.get('KAFKA_URL')]
            }),
            dependencies: ['ConfigService']
        },
        { token: 'KafkaProducer', useClass: KafkaProducer, dependencies: ['Kafka', 'Logger'] },
        { token: 'KafkaTransport', useClass: KafkaTransport, dependencies: ['KafkaProducer', 'Logger'] },
        {
            token: 'KafkaConsumer',
            useFactory: (config, kafka, messageHandler, logger) => new KafkaConsumer(
                kafka,
                [config.get(KAFKA_PROCESSED_MESSAGES_TOPIC)],
                messageHandler,
                logger
            ),
            dependencies: ['ConfigService', 'Kafka', 'MessageHandler', 'Logger']
        },
        {
            token: 'RedisPublisher',
            useFactory: (config) => createClient({ url: config.get(REDIS_URL) }),
            dependencies: ['ConfigService']
        },
        {
            token: 'RedisSubscriber',
            useFactory: (config) => createClient({ url: config.get(REDIS_URL) }),
            dependencies: ['ConfigService']
        },
        { token: 'UserSocketMapping', useClass: UserSocketMapping },
        {
            token: 'SocketTransport',
            useFactory: (userSocketMapping, logger) => new SocketIoTransport(
                socket, userSocketMapping, logger
            ),
            dependencies: ['UserSocketMapping', 'Logger']
        },
        { token: 'GroupRepository', useClass: GroupRepository },
        {
            token: 'GroupService',
            useClass: GroupService,
            dependencies: ['GroupRepository', 'SocketTransport', 'Logger']
        },
        {
            token: 'GroupController',
            useClass: GroupController,
            dependencies: ['GroupService']
        },
        {
            token: 'MessageInService',
            useClass: MessageService,
            dependencies: ['KafkaTransport', 'Logger']
        },
        {
            token: 'MessageController',
            useClass: MessageController,
            dependencies: ['MessageInService']
        },
        {
            token: 'MessageOutService',
            useClass: MessageService,
            dependencies: ['SocketTransport', 'Logger']
        },
        {
            token: 'MessageHandler',
            useClass: MessageHandler,
            dependencies: ['MessageOutService']
        },
    ]);

    const logger = container.get('Logger');
    const config = container.get('ConfigService');

    const redisPublisher = container.get('RedisPublisher');
    const redisSubscriber = container.get('RedisSubscriber');
    const userSocketMapping = container.get('UserSocketMapping');

    socket.adapter(createAdapter(redisPublisher, redisSubscriber));
    socket.use(socketAuthMiddleware(config.get(JWT_SECRET), logger));
    socket.use(socketUserMapperMiddleware(userSocketMapping, logger));

    const disconnectEvent = (clientSocket) => {
        clientSocket.on('disconnect', async () => {
            await userSocketMapping.removeBySocketId(clientSocket.id);
            logger.info(`Socket ${clientSocket.id} disconnected and removed from mapping`);
        });
    };

    const registerEventHandlers = createRegisterEventHandlers(container, [
        groupEvents,
        messageEvents,
        disconnectEvent
    ]);

    socket.on('connection', (clientSocket) => {
        registerEventHandlers(clientSocket);
    });

    await initializeDatabase(logger);
    await initializeServices(container, logger);

    const gracefulShutdown = () => {
        logger.info('Received shutdown signal, shutting down gracefully...');
        server.close(async () => {
            logger.info('Closed out remaining connections');
            socket.close();
            await shutdownDatabase(logger)
            await shutdownServices(container, logger);
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

    const port = config.get(PORT);
    server.listen(port, () => {
        logger.info(`Server is running on port: ${port}`);
    });
    return server;
}

module.exports = app;