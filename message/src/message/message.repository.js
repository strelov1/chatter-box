const MessageModel = require('./message.model');
class MessageRepository {
    async create(groupId, text) {
        const message = new MessageModel({ groupId, text });
        return message.save();
    }

    async getById(id) {
        return MessageModel.findById(id);
    }

    async getAll() {
        return MessageModel.find();
    }

    async update(id, data) {
        return MessageModel.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return MessageModel.findByIdAndDelete(id);
    }
}

module.exports.MessageRepository = MessageRepository;