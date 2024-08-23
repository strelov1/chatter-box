const groupEvents = (socket, container) => {
    /** @type {GroupService} */
    const groupService = container.get('GroupService');

    socket.on('group:create', async (data) => {
        await groupService.create(data);
    });

    socket.on('group:join', async (data) => {
        await groupService.join(data);
    });

    socket.on('group:delete', async (data) => {
        await groupService.delete(data);
    });
};

module.exports.groupEvents = groupEvents;
