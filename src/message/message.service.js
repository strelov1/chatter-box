class MessageService {
    constructor(
        messageRepository,
        transport,
        logger,
    ) {
        this.messageRepository = messageRepository;
        this.transport = transport;
        this.logger = logger;
    }

    async create({ groupId, text }) {
        try {
            const message = await this.messageRepository.create(groupId, text);
            await this.transport.sendToGroup(groupId, 'message:created', message);
        } catch (error) {
            this.logger.error('message:created:error', error);
        }
    }
}

module.exports.MessageService = MessageService;