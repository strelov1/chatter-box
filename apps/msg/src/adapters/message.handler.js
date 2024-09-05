class MessageHandler {
	constructor(messageService, serializer) {
		/** @type {MessageService} */
		this.messageService = messageService;
		this.serializer = serializer;
	}

	async handleMessage(message) {
		const parsedMessage = this.serializer.decodeMessage(message.value);
		await this.messageService.create(parsedMessage.data);
	}
}

module.exports = { MessageHandler };
