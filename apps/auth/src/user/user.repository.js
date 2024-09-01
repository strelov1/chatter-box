const { UserModel } = require("./user.model");

class UserRepository {
	async createUser(username, passwordHash) {
		const user = new UserModel({ username, passwordHash, groups: [] });
		return user.save();
	}

	async getUserByUsername(username) {
		return UserModel.findOne({ username });
	}

	async getUserById(id) {
		return UserModel.findById(id);
	}

	async updateUserGroups(userId, groups) {
		return UserModel.findByIdAndUpdate(userId, { groups }, { new: true });
	}

	async deleteUser(id) {
		return UserModel.findByIdAndDelete(id);
	}

	async getAllUsers() {
		return UserModel.find();
	}
}

module.exports.UserRepository = UserRepository;
