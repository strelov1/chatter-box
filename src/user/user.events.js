const userEvents = (socket, container) => {
    /** @type {UserService} */
    const userService = container.get('UserService');

    socket.on('user:init', async (userId) => {
        try {
            const userGroups = userService.getAllGroups(userId);

            userGroups.forEach(groupId => {
                socket.join(groupId);
                console.log(`User ${userId} (socket ${socket.id}) joined group ${groupId}`);
            });
        } catch (error) {
            console.error('Authentication failed:', error);
        }
    });
};

module.exports.userEvents = userEvents;
