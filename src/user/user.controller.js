class UserController {
    constructor(userService, logger) {
        /** @type {UserService} */
        this.userService = userService;
        this.logger = logger;
    }

    async init(socket, data) {
        try {
            const { userId } = data;
            const userGroups = this.userService.getAllGroups(userId);

            userGroups.forEach(groupId => {
                socket.join(groupId);
                this.logger.info(`User ${userId} (socket ${socket.id}) joined group ${groupId}`);
            });
        } catch (error) {
            this.logger.error('Authentication failed:', error);
            socket.emit('error', error.message);
        }
    }
}

module.exports.UserController = UserController;