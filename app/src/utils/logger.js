class Logger {
    constructor(logger) {
        this.logger = logger
    }

    info(message, ...args) {
        this.logger.info(message, ...args);
    }

    error(message, ...args) {
        this.logger.error(message, ...args);
    }
}

module.exports.Logger = Logger;