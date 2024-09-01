const pino = require("pino");
const pretty = require("pino-pretty");

class Logger {
	constructor() {
		this.logger = pino(
			{
				level: "info",
			},
			pretty({
				colorize: true,
				translateTime: true,
				ignore: "pid,hostname",
			}),
		);
	}

	info(message, ...args) {
		this.logger.info(message, ...args);
	}

	error(message, ...args) {
		this.logger.error(message, ...args);
	}
}

module.exports.Logger = Logger;
