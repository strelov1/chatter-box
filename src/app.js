const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const pino = require('pino');
const pretty = require('pino-pretty');
const { Server } = require('socket.io');
// const { createClient } = require('redis');
// const { createAdapter } = require('@socket.io/redis-adapter');

const { IoCContainer } = require('./utils/ioc-container');
const { Logger } = require('./utils/logger');
const { SocketIoTransport } = require('./adapters/socket-io.transport');
const { UserSocketMapping } = require("./adapters/user-socket.mapping");

const { GroupService } = require('./group/group.service');
const { GroupRepository } = require('./group/group.repository');
const { GroupController } = require("./group/group.controller");

const { MessageController } = require('./message/message.controller');
const { MessageService } = require('./message/message.service');
const { MessageRepository } = require('./message/message.repository');

const { UserController } = require('./user/user.controller');
const { UserService } = require('./user/user.service');
const { UserRepository } = require('./user/user.repository');

const { groupEvents } = require("./group/group.events");
const { messageEvents } = require("./message/message.events");
const { userEvents } = require("./user/user.events");
const { userRouter } = require("./user/user.router");

const app = async () => {
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

    mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => {
        logger.info('Connected to MongoDB');
    }).catch(err => {
        logger.error('Failed to connect to MongoDB', err);
    });

    // const pubClient = createClient({ url: process.env.REDIS_URL });
    // const subClient = pubClient.duplicate();
    //
    // await pubClient.connect();
    // await subClient.connect();
    //
    // socket.adapter(createAdapter(pubClient, subClient));

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
        'UserRepository',
        UserRepository
    );

    container.register(
        'GroupRepository',
        GroupRepository
    );

    container.register(
        'MessageRepository',
        MessageRepository
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
        'MessageService',
        MessageService,
        [
            'MessageRepository',
            'Transport',
            'Logger',
        ]
    );

    container.register(
        'UserService',
        (userRepository) => new UserService(
            userRepository,
            "jwtSecret",
        ),
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
            'MessageService',
        ]
    );

    container.register(
        'MessageController',
        MessageController,
        [
            'MessageService',
        ]
    )

    container.register(
        'UserController',
        UserController,
        [
            'UserService',
            'Logger',
        ]
    );

    socket.on('connection', (clientSocket) => {
        logger.info(`Client connected: ${clientSocket.id}`);

        // Register handlers
        [
            groupEvents,
            messageEvents,
            userEvents,
        ].forEach(handler => handler(clientSocket, container));
        // Register handlers

        const userSocketMapping = container.get('UserSocketMapping');

        clientSocket.on('authenticate', async (data) => {
            await userSocketMapping.add(data.userId, clientSocket.id);
            logger.info(`User ${data.userId} is now associated with socket ${clientSocket.id}`);
        });

        clientSocket.on('disconnect', async () => {
            await userSocketMapping.removeBySocketId(clientSocket.id);
            logger.info(`Socket ${clientSocket.id} disconnected and removed from mapping`);
        });
    });

    app.use(express.json());
    app.use('/api', userRouter(
        express.Router(),
        container
    ));

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