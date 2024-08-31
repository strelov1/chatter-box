const express = require('express');
const http = require('http');

const { createIoCContainer } = require('./utils/ioc-container');
const { Logger } = require('./utils/logger');
const { ConfigService, PORT} = require("./utils/config.service");
const { initializeDatabase, shutdownDatabase } = require("./config/database");

const { authRouter } = require("./user/auth.router");
const { AuthController } = require('./user/auth.controller');
const { AuthService } = require('./user/auth.service');
const { UserRepository } = require('./user/user.repository');

const app = async () => {
    const app = express();
    const server = http.createServer(app);

    const container = createIoCContainer();

    container.registerMultiple([
        { token: 'Logger', useClass: Logger },
        { token: 'ConfigService', useClass: ConfigService },
        {
            token: 'UserRepository',
            useClass: UserRepository
        },
        {
            token: 'AuthService',
            useClass: AuthService,
            dependencies: ['ConfigService', 'UserRepository', 'Logger']
        },
        {
            token: 'AuthController',
            useClass: AuthController,
            dependencies: ['AuthService', 'Logger']
        },
    ]);

    const logger = container.get('Logger');
    const config = container.get('ConfigService');

    await initializeDatabase(logger);

    app.use(express.json());
    app.use('/api/v1/auth', authRouter(
        express.Router(),
        container
    ));

    const port = config.get(PORT);
    server.listen(port, () => {
        logger.info(`Server is running on port: ${port}`);
    });

    const gracefulShutdown = () => {
        logger.info('Received shutdown signal, shutting down gracefully...');
        server.close(async () => {
            logger.info('Closed out remaining connections');
            await shutdownDatabase(logger);
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