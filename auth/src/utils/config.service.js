
const JWT_SECRET = 'JWT_SECRET';
const PORT = 'PORT';
class ConfigService {
    constructor() {
        this.config = {
            [JWT_SECRET]: process.env.JWT_SECRET || 'jwtSecret',
            [PORT]: process.env.PORT || 3000,
        };
    }

    get(key) {
        return this.config[key];
    }
}


module.exports = {
    ConfigService,
    PORT,
    JWT_SECRET,
};