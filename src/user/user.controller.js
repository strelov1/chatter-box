class UserController {
    constructor(userService) {
        /** @type {UserService} */
        this.userService = userService;
    }

    async init(socket, data) {
        try {
            const { userId } = data;
            const userGroups = this.userService.getAllGroups(userId);

            userGroups.forEach(groupId => {
                socket.join(groupId);
                console.log(`User ${userId} (socket ${socket.id}) joined group ${groupId}`);
            });
        } catch (error) {
            console.error('Authentication failed:', error);
            socket.emit('error', error.message);
        }
    }
}

module.exports.UserController = UserController;