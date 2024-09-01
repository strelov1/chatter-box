const mongoose = require("mongoose");

const initializeDatabase = async (logger) => {
	try {
		await mongoose.connect(process.env.MONGO_URL);
		logger.info("Connected to MongoDB");
	} catch (err) {
		logger.error("Failed to connect to MongoDB", err);
		throw err;
	}
};
const shutdownDatabase = async (logger) => {
	try {
		await mongoose.connection.close(false);
		logger.info("MongoDB shutdown successfully");
	} catch (err) {
		logger.error("Failed to shutdown MongoDB", err);
		throw err;
	}
};

module.exports = {
	initializeDatabase,
	shutdownDatabase,
};
