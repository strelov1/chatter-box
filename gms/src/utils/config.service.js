
const KAFKA_URL = 'KAFKA_URL';
const KAFKA_INCOMING_GROUPS_TOPIC = 'KAFKA_INCOMING_GROUPS_TOPIC';
const KAFKA_PROCESSED_GROUPS_TOPIC = 'KAFKA_PROCESSED_GROUPS_TOPIC';
const PORT = 'PORT';
class ConfigService {
    constructor() {
        this.config = {
            KAFKA_URL: process.env.KAFKA_URL,
            [KAFKA_INCOMING_GROUPS_TOPIC]: process.env.KAFKA_INCOMING_GROUPS_TOPIC,
            [KAFKA_PROCESSED_GROUPS_TOPIC]: process.env.KAFKA_PROCESSED_GROUPS_TOPIC,
            PORT: process.env.PORT || 3000,
        };
    }

    get(key) {
        return this.config[key];
    }
}


module.exports = {
    ConfigService,
    KAFKA_URL,
    KAFKA_PROCESSED_GROUPS_TOPIC,
    KAFKA_INCOMING_GROUPS_TOPIC,
    PORT,
};