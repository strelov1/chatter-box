class UserRepository {
    async create(name, members) {
        const group = new GroupModel({ name, members });
        return group.save();
    }

    async getById(id) {
        return GroupModel.findById(id);
    }

    async getAll() {
        return GroupModel.find();
    }

    async update(id, data) {
        return GroupModel.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return GroupModel.findByIdAndDelete(id);
    }
}

module.exports.UserRepository = UserRepository;