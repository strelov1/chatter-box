const createRegisterEventHandlers = (container, eventHandlers = []) => (socket) => {
    eventHandlers.forEach(eventHandler => eventHandler(socket, container));
};

module.exports = {
    createRegisterEventHandlers
}