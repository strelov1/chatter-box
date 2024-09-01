class UserSocketMapping {
	constructor() {
		this.userToSocket = new Map();
		this.socketToUser = new Map();
	}

	async add(userId, socketId) {
		this.userToSocket.set(userId, socketId);
		this.socketToUser.set(socketId, userId);
	}

	async getSocketId(userId) {
		return this.userToSocket.get(userId);
	}
	async getUserId(socketId) {
		return this.socketToUser.get(socketId);
	}

	async removeBySocketId(socketId) {
		const userId = this.socketToUser.get(socketId);
		this.socketToUser.delete(socketId);
		this.userToSocket.delete(userId);
	}

	async removeByUserId(userId) {
		const socketId = this.userToSocket.get(userId);
		this.userToSocket.delete(userId);
		this.socketToUser.delete(socketId);
	}
}

module.exports.UserSocketMapping = UserSocketMapping;
