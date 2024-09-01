const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true },
	passwordHash: { type: String, required: true },
	groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
});

const User = mongoose.model("User", userSchema);

module.exports.UserModel = User;
