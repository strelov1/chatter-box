class UserService {
    constructor(
        userRepository,
        transport,
    ) {
        this.userRepository = userRepository;
        this.transport = transport;
    }

    async getAllGroups(userId) {
        const user = this.userRepository.getById(userId);
        return user.groups;
    }

    generateAuthKey() {
        return Math.floor(Math.random() * 1000);
    }
}

module.exports.UserService = UserService;