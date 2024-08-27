const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UserService {
    constructor(userRepository, jwtSecret) {
        this.userRepository = userRepository;
        this.jwtSecret = jwtSecret;
    }

    async register(username, password) {
        const existingUser = await this.userRepository.getUserByUsername(username);
        if (existingUser) {
            throw new Error('Username is already taken');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        return this.userRepository.createUser(username, passwordHash);
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

        return jwt.sign({ userId: user._id }, this.jwtSecret, { expiresIn: '1h' });
    }

    async getAllGroups(userId) {
        const user = await this.userRepository.getUserById(userId);
        return user.groups;
    }
}

module.exports.UserService = UserService;