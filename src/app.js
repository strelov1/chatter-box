const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const { IoCContainer } = require('./utils/ioc-container');
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
const {userRouter} = require("./user/user.router");

const app = () => {
    const container = new IoCContainer();

    const app = express();
    const server = http.createServer(app);
    const socket = new Server(server);

    mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => {
        console.log('Connected to MongoDB');
    }).catch(err => {
        console.error('Failed to connect to MongoDB', err);
    });

    container.register(
        'UserSocketMapping',
        UserSocketMapping
    );

    container.register(
        'Transport',
        (userSocketMapping) => new SocketIoTransport(
            socket,
            userSocketMapping
        ),
        ['UserSocketMapping']
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
            'Transport'
        ]
    );

    container.register(
        'MessageService',
        MessageService,
        [
            'MessageRepository',
            'Transport'
        ]
    );

    container.register(
        'UserService',
        UserService,
        [
            'UserRepository',
            'Transport'
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
        ]
    );

    socket.on('connection', (clientSocket) => {
        console.log('Client connected:', clientSocket.id);

        // Register handlers
        [
            groupEvents,
            messageEvents,
            userEvents,
        ].forEach(handler => handler(clientSocket, container));
        // Register handlers

        const userSocketMapping = container.get('UserSocketMapping');

        clientSocket.on('authenticate', (data) => {
            userSocketMapping.add(data.userId, clientSocket.id);
            console.log(`User ${data.userId} is now associated with socket ${clientSocket.id}`);
        });

        clientSocket.on('disconnect', () => {
            userSocketMapping.removeBySocketId(clientSocket.id);
            console.log(`Socket ${clientSocket.id} disconnected and removed from mapping`);
        });
    });

    app.use(express.json());
    app.use('/api', userRouter(
        express.Router(),
        container
    ));

    const port = process.env.PORT || 3000;

    server.listen(port, () => {
        console.log('Server is running on port:', port);
    });

    const gracefulShutdown = () => {
        console.log('Received shutdown signal, shutting down gracefully...');
        server.close(async () => {
            console.log('Closed out remaining connections');
            await mongoose.connection.close(false);
        });

        socket.close();

        setTimeout(() => {
            console.error('Forcing shutdown');
            process.exit(1);
        }, 1000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
        // gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // gracefulShutdown();
    });

    return server;
}

module.exports = app;