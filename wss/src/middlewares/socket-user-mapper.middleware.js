const socketUserMapperMiddleware = (userSocketMapping, logger) => (clientSocket, next) => {
    if (!clientSocket.userId) {
        logger.error("Connection is not authorized")
        return next(new Error("Connection is not authorized"));
    }
    try {
        logger.info(`User ${clientSocket.userId} is now associated with Socket ${clientSocket.id}`);
        userSocketMapping.add(clientSocket.userId, clientSocket.id);
        next();
    } catch (error) {
        logger.error(error)
        return next(error);
    }
}

module.exports = {
    socketUserMapperMiddleware
}