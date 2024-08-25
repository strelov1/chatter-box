class UserSocketMapping {
    constructor() {
        this.userToSocket = new Map();
        this.socketToUser = new Map();
    }

    add(userId, socketId) {
        this.userToSocket.set(userId, socketId);
        this.socketToUser.set(socketId, userId);
    }

    getSocketId(userId) {
        return this.userToSocket.get(userId);
    }
    getUserId(socketId) {
        return this.socketToUser.get(socketId);
    }

    removeBySocketId(socketId) {
        const userId = this.socketToUser.get(socketId);
        this.socketToUser.delete(socketId);
        this.userToSocket.delete(userId);
    }

    removeByUserId(userId) {
        const socketId = this.userToSocket.get(userId);
        this.userToSocket.delete(userId);
        this.socketToUser.delete(socketId);
    }
}

module.exports.UserSocketMapping = UserSocketMapping;