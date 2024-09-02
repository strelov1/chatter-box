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

	info(message, data) {
		if (data) {
			this.logger.info({ data }, message);
		} else {
			this.logger.info(message);
		}
	}

	error(message, error) {
		this.logger.error({ err: error }, message);
	}
}

module.exports = {
	Logger
}