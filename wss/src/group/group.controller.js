class GroupController {
    constructor(groupService) {
        /** @type {GroupService} */
        this.groupService = groupService;
    }

    async createGroup(socket, data) {
        try {
            await this.groupService.create(data);
        } catch (error) {
            socket.emit('error', error.message);
        }
    }
    async joinGroup(socket, data) {
        try {
            await this.groupService.join(data);
        } catch (error) {
            socket.emit('error', error.message);
        }
    }

    async deleteGroup(socket, data) {
        try {
            await this.groupService.delete(data);
        } catch (error) {
            socket.emit('error', error.message);
        }
    }
}

module.exports.GroupController = GroupController;