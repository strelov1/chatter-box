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
}

module.exports.UserService = UserService;