const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const pino = require('pino');
const pretty = require('pino-pretty');

const { IoCContainer } = require('./utils/ioc-container');
const { Logger } = require('./utils/logger');
const { UserController } = require('./user/user.controller');
const { UserService } = require('./user/user.service');
const { UserRepository } = require('./user/user.repository');

const { userRouter } = require("./user/user.router");

const app = async () => {
    const jwtSecret = process.env.JWT_SECRET  || "jwtSecret"

    const container = new IoCContainer();

    const app = express();
    const server = http.createServer(app);

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

    container.register(
        'Logger',
        () => new Logger(logger),
    );

    container.register(
        'UserRepository',
        UserRepository
    );

    container.register(
        'UserService',
        (userRepository) => new UserService(
            userRepository,
            jwtSecret,
        ),
        [
            'UserRepository'
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

    app.use(express.json());
    app.use('/api', userRouter(
        express.Router(),
        container
    ));

    const port = process.env.PORT || 3030;

    server.listen(port, () => {
        logger.info(`Server is running on port: ${port}`);
    });

    const gracefulShutdown = () => {
        logger.info('Received shutdown signal, shutting down gracefully...');
        server.close(async () => {
            logger.info('Closed out remaining connections');
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