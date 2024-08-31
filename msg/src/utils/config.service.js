
const KAFKA_URL = 'KAFKA_URL';
const KAFKA_PROCESSED_MESSAGES_TOPIC = 'KAFKA_PROCESSED_MESSAGES_TOPIC';
const KAFKA_INCOMING_MESSAGES_TOPIC = 'KAFKA_INCOMING_MESSAGES_TOPIC';
const REDIS_URL = 'REDIS_URL';
const PORT = 'PORT';
class ConfigService {
    constructor() {
        this.config = {
            KAFKA_URL: process.env.KAFKA_URL,
            KAFKA_PROCESSED_MESSAGES_TOPIC: process.env.KAFKA_PROCESSED_MESSAGES_TOPIC,
            KAFKA_INCOMING_MESSAGES_TOPIC: process.env.KAFKA_INCOMING_MESSAGES_TOPIC,
            REDIS_URL: process.env.REDIS_URL,
            PORT: process.env.PORT || 3000,
        };
    }

    get(key) {
        return this.config[key];
    }
}


module.exports = {
    ConfigService,
    KAFKA_INCOMING_MESSAGES_TOPIC,
    KAFKA_URL,
    KAFKA_PROCESSED_MESSAGES_TOPIC,
    REDIS_URL,
    PORT,
};