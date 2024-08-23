class MessageService {
    constructor(
        messageRepository,
        transport,
    ) {
        this.messageRepository = messageRepository;
        this.transport = transport;
    }

    async create({ groupId, text }) {
        try {
            const message = await this.messageRepository.create(groupId, text);
            this.transport.sendToGroup(groupId, 'message:created', message);
        } catch (error) {
            console.log('message:created:error', error);
        }
    }
}

module.exports.MessageService = MessageService;