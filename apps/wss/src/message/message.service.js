class MessageService {
	constructor(transport, logger) {
		this.transport = transport;
		this.logger = logger;
	}

	async create({ groupId, text }) {
		try {
			await this.transport.sendToGroup(groupId, "message:created", {
				groupId,
				text,
			});
		} catch (error) {
			this.logger.error(error);
		}
	}
}

module.exports.MessageService = MessageService;
