const createRegisterEventHandlers =
	(container, eventHandlers = []) =>
	(socket) => {
		for (const eventHandler of eventHandlers) {
			eventHandler(socket, container);
		}
	};

module.exports = {
	createRegisterEventHandlers,
};
