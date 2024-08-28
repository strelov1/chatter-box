class UserService {
    constructor(userRepository, jwtSecret) {
        this.userRepository = userRepository;
    }
    async getAllGroups(userId) {
        const user = await this.userRepository.getUserById(userId);
        return user.groups;
    }
}

module.exports.UserService = UserService;