const userEvents = (socket, container) => {
    /** @type {UserController} */
    const userController = container.get('UserController');

    socket.on('user:init', (data) => userController.init(socket, data));
};

module.exports.userEvents = userEvents;
