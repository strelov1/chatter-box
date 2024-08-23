const messageEvents = (socket, container) => {
    /** @type {MessageService} */
    const messageService = container.get('MessageService');

    socket.on('message:create', async (data) => {
        await messageService.create(data);
    });
};

module.exports.messageEvents = messageEvents;
