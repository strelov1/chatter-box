const messageEvents = (socket, container) => {
    /** @type {MessageController} */
    const messageController = container.get('MessageController');

    socket.on('message:create', (data) => messageController.create(socket, data));
};

module.exports = {
    messageEvents
}
