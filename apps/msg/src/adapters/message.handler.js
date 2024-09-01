class MessageHandler {
	constructor(messageService) {
		/** @type {MessageService} */
		this.messageService = messageService;
	}

	async handleMessage(message) {
		const parsedMessage = JSON.parse(message.value.toString());
		await this.messageService.create(parsedMessage.data);
	}
}

module.exports = { MessageHandler };
