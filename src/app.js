const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const { IoCContainer } = require('./utils/ioc-container');
const { SocketIoTransport } = require('./adapters/socket-io.transport');
const { UserSocketMapping } = require("./adapters/user-socket.mapping");

const { GroupService } = require('./group/group.service');
const { GroupRepository } = require('./group/group.repository');

const { MessageService } = require('./message/message.service');
const { MessageRepository } = require('./message/message.repository');

const { UserService } = require('./user/user.service');
const { UserRepository } = require('./user/user.repository');

const { groupEvents } = require("./group/group.events");
const { messageEvents } = require("./message/message.events");
const { userEvents } = require("./user/user.events");

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
        () => new UserSocketMapping(),
        []
    ).register(
        'Transport',
        (userSocketMapping) => new SocketIoTransport(
            socket,
            userSocketMapping
        ),
        ['UserSocketMapping']
    ).register(
        'UserRepository',
        () => new UserRepository(),
        []
    ).register(
        'GroupRepository',
        () => new GroupRepository(),
        []
    ).register(
        'MessageRepository',
        () => new MessageRepository(),
        []
    ).register(
        'GroupService',
        (groupRepository, transport) => new GroupService(
            groupRepository,
            transport
        ),
        [
            'GroupRepository',
            'Transport'
        ]
    ).register(
        'MessageService',
        (messageRepository, transport) => new MessageService(
            messageRepository,
            transport
        ),
        [
            'MessageRepository',
            'Transport'
        ]
    ).register(
        'UserService',
        (userRepository, transport) => new UserService(
            userRepository,
            transport
        ),
        [
            'UserRepository',
            'Transport'
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

        clientSocket.on('authenticate', (userId) => {
            userSocketMapping.add(userId, clientSocket.id);
            console.log(`User ${userId} is now associated with socket ${clientSocket.id}`);
        });

        clientSocket.on('disconnect', () => {
            userSocketMapping.removeBySocketId(clientSocket.id);
            console.log(`Socket ${clientSocket.id} disconnected and removed from mapping`);
        });
    });


    app.use(express.json());

    const port = process.env.PORT || 3000;

    server.listen(port, () => {
        console.log('Server is running on port:', port);
    });

    const gracefulShutdown = () => {
        console.log('Received shutdown signal, shutting down gracefully...');
        server.close(async () => {
            console.log('Closed out remaining connections');
            await mongoose.connection.close(false, () => {
                console.log('MongoDB connection closed');
                process.exit(0);
            });
        });

        socket.close(() => {
            console.log('Socket.IO server closed');
        });

        setTimeout(() => {
            console.error('Forcing shutdown');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
        gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        gracefulShutdown();
    });

    return server;
}

module.exports = app;