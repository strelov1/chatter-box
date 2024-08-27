class GroupService {
    constructor(
        groupRepository,
        transport,
        logger,
    ) {
        /** @type {GroupRepository} */
        this.groupRepository = groupRepository;
        /** @type {SocketIoTransport} */
        this.transport = transport;
        this.logger = logger
    }

    async create({name, members}) {
        try {
            const group = await this.groupRepository.create(name, members);
            const groupId = String(group._id);
            for (const userId of members) {
                this.transport.join(groupId, userId);
            }
            await this.transport.sendToGroup(groupId, 'group:created', group);
        } catch (error) {
            this.logger.error('group:created:error', error);
        }
    }

    async join({ groupId, members }) {
        try {
            const group = await this.groupRepository.update(groupId, {
                $addToSet: { members: { $each: members } }
            });

            this.transport.joinMembers(groupId, members);
            await this.transport.sendToGroup(groupId, 'group:joined', group);
        } catch (error) {
            await this.transport.sendToGroup(groupId, 'group:join:error', error.message);
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