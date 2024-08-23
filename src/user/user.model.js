const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    groups: [{ type: Array }],
});

const User = mongoose.model('User', userSchema);

module.exports.UserModel = User;