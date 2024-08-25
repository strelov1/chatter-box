const groupEvents = (socket, container) => {
    /** @type {GroupController} */
    const groupController = container.get('GroupController');

    socket.on('group:create', (data) => groupController.createGroup(socket, data));
    socket.on('group:join', (data) => groupController.joinGroup(socket, data));
    socket.on('group:delete', (data) => groupController.deleteGroup(socket, data));
};

module.exports.groupEvents = groupEvents;
