const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    groupId: { type: String, required: true },
    text: { type: String, required: true },
});

const MessageModel = mongoose.model('Message', messageSchema);

module.exports = MessageModel;