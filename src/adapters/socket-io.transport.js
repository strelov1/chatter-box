class SocketIoTransport {
    constructor(socket, userSocketMapping, logger) {
        this.socket = socket;
        /** @type {UserSocketMapping} */
        this.userSocketMapping = userSocketMapping;
        this.logger = logger;
    }
    sendToGroup(groupId, event, message) {
        this.socket.in(groupId).emit(event, message);
    }

    joinMembers(groupId, members) {
        for (const userId of members) {
            this.join(groupId, userId);
        }
    }
    join(groupId, userId) {
        const socketId = this.userSocketMapping.getSocketId(userId);
        if (!socketId) {
            this.logger.error(`Socket for user ${userId} not found`);
            return;
        }
        const socket = this.socket.sockets.sockets.get(socketId);
        if (socket) {
            socket.join(groupId);
        } else {
            this.logger.error(`Socket ${socketId} not found`);
        }
    }
}

module.exports.SocketIoTransport = SocketIoTransport;