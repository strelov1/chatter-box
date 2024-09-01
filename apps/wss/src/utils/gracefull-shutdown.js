const setupGracefulShutdown = (shutdownFunction, logger) => {
	const gracefulShutdown = async () => {
		logger.info("Received shutdown signal, shutting down gracefully...");

		await shutdownFunction();

		setTimeout(() => {
			logger.error("Forcing shutdown");
			process.exit(1);
		}, 1000);
	};

	process.on("SIGTERM", gracefulShutdown);
	process.on("SIGINT", gracefulShutdown);

	process.on("uncaughtException", (err) => {
		logger.error("Uncaught Exception:", err);
		gracefulShutdown();
	});

	process.on("unhandledRejection", (reason, promise) => {
		logger.error("Unhandled Rejection at:", promise, "reason:", reason);
		gracefulShutdown();
	});
};

module.exports = {
	setupGracefulShutdown,
};
