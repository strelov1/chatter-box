class MessageController {
	constructor(messageService) {
		/** @type {MessageService} */
		this.messageService = messageService;
	}

	async create(socket, data) {
		try {
			await this.messageService.create(data);
		} catch (error) {
			socket.emit("error", error.message);
		}
	}
}

module.exports.MessageController = MessageController;
