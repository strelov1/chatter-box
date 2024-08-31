const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/config.service');

class AuthService {
    constructor(configService, userRepository, logger) {
        this.jwtSecret = configService.get(JWT_SECRET);
        this.userRepository = userRepository;
        this.logger = logger;
    }

    async register(username, password) {
        const existingUser = await this.userRepository.getUserByUsername(username);
        if (existingUser) {
            throw new Error('Username is already taken');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user =  await this.userRepository.createUser(username, passwordHash);
        this.logger.info(`User: ${user._id} is created`);
        return user;
    }

    async authenticate(username, password) {
        const user = await this.userRepository.getUserByUsername(username);
        if (!user) {
            throw new Error('Invalid username or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid username or password');
        }

        const token =  jwt.sign({ userId: user._id }, this.jwtSecret, { expiresIn: '1h' });
        this.logger.info(`User: ${user._id} is authenticated`);
        return token;
    }
}

module.exports = { AuthService }