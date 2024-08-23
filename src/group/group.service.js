class GroupService {
    constructor(
        groupRepository,
        transport,
    ) {
        /** @type {GroupRepository} */
        this.groupRepository = groupRepository;
        /** @type {SocketIoTransport} */
        this.transport = transport;
    }

    async create({name, members}) {
        try {
            const group = await this.groupRepository.create(name, members);
            const groupId = String(group._id);

            for (const userId of members) {
                this.transport.join(groupId, userId);
            }
            this.transport.sendToGroup(groupId, 'group:created', group);
        } catch (error) {
            console.log('group:created:error', error);
        }
    }

    async join({ groupId, members }) {
        try {
            const group = await this.groupRepository.update(groupId, {
                $addToSet: { members: { $each: members } }
            });

            this.transport.joinMembers(groupId, members);
            this.transport.sendToGroup(groupId, 'group:joined', group);
        } catch (error) {
            this.transport.sendToGroup(groupId, 'group:join:error', error.message);
        }
    }

    async update(groupId, update){
        const group = await this.groupRepository.update(groupId, update);
    }

    async delete(groupId) {
        const group = await this.groupRepository.delete(groupId);
    }

    async getById(id) {
        return this.groupRepository.getById(id);
    }

    async getAll() {
        return this.groupRepository.getAll();
    }
}

module.exports.GroupService = GroupService;