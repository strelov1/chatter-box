const jwt = require("jsonwebtoken");

const socketAuthMiddleware = (jwtSecret, logger) => (clientSocket, next) => {
	const token =
		clientSocket.handshake.auth.token ||
		clientSocket.handshake.headers.authorization;

	if (!token) {
		logger.error("Token is not existed", {
			headers: clientSocket.handshake.headers,
		});
		return next(new Error("Authentication error"));
	}

	try {
		const decoded = jwt.verify(token, jwtSecret);
		clientSocket.userId = decoded.userId;
		next();
	} catch (error) {
		logger.error("Token is not valid");
		return next(new Error("Authentication error"));
	}
};

module.exports.socketAuthMiddleware = socketAuthMiddleware;
