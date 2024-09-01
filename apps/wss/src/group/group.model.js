const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
	name: { type: String, required: true },
	members: [{ type: String, required: true }],
});

const GroupModel = mongoose.model("Group", groupSchema);

module.exports = GroupModel;
