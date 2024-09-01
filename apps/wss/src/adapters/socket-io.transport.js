class SocketIoTransport {
	constructor(socket, userSocketMapping, logger) {
		this.socket = socket;
		/** @type {UserSocketMapping} */
		this.userSocketMapping = userSocketMapping;
		this.logger = logger;
	}
	sendToGroup(groupId, event, message) {
		this.logger.info(
			`event: ${event}, groupId: ${groupId}, message: ${JSON.stringify(message)}`,
		);
		this.socket.in(groupId).emit(event, message);
	}

	async joinMembers(groupId, members) {
		await Promise.all(
			members.map((userId) => {
				return this.join(groupId, userId);
			}),
		);
	}
	async join(groupId, userId) {
		const socketId = await this.userSocketMapping.getSocketId(userId);
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
