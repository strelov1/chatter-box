const test = require("node:test");
const assert = require("node:assert");
const { io } = require("socket.io-client");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../app");
const { UserModel } = require("../user/user.model");

let server;
const socketUrl = "http://localhost:3031";
const dbUrl = "mongodb://localhost:27017/e2e_test_db_1";
const redisUrl = "redis://localhost:6379";

test.before(async () => {
	await mongoose.connect(dbUrl);
	process.env.MONGO_URL = dbUrl;
	process.env.PORT = "3031";
	process.env.REDIS_URL = redisUrl;

	server = await app();

	const user1 = new UserModel({
		username: "user1",
		password: "password123",
		passwordHash: "password123",
	});
	const user2 = new UserModel({
		username: "user2",
		password: "password123",
		passwordHash: "password123",
	});
	const user3 = new UserModel({
		username: "user3",
		password: "password123",
		passwordHash: "password123",
	});

	await user1.save();
	await user2.save();
	await user3.save();
});

test.after(async () => {
	await mongoose.connection.db.dropDatabase();
	await mongoose.disconnect();

	server.close();
});

test("Create group", async () => {
	const user1 = await UserModel.findOne({ username: "user1" });
	const user2 = await UserModel.findOne({ username: "user2" });

	const client = io(socketUrl, {
		auth: { token: jwt.sign({ userId: user1._id }, "jwtSecret") },
	});

	await new Promise((resolve) => {
		client.on("connect", resolve);
	});

	await client.emit("group:create", {
		name: "Test Group",
		members: [user1._id, user2._id],
	});

	const createdGroup = await new Promise((resolve) => {
		client.on("group:created", resolve);
	});

	assert.strictEqual(createdGroup.name, "Test Group");
	assert.strictEqual(createdGroup.members.length, 2);
	assert.strictEqual(createdGroup.members[0], user1._id.toString());
	assert.strictEqual(createdGroup.members[1], user2._id.toString());
	client.close();
});

test("Join new member", async () => {
	const user1 = await UserModel.findOne({ username: "user1" });
	const user2 = await UserModel.findOne({ username: "user2" });
	const user3 = await UserModel.findOne({ username: "user3" });

	const client = io(socketUrl, {
		auth: { token: jwt.sign({ userId: user1._id }, "jwtSecret") },
	});

	await new Promise((resolve) => {
		client.on("connect", resolve);
	});

	await client.emit("group:create", {
		name: "Test Group",
		members: [user1._id, user2._id],
	});

	const createdGroup = await new Promise((resolve) => {
		client.on("group:created", resolve);
	});

	await client.emit("group:join", {
		groupId: createdGroup._id,
		members: [user3._id],
	});

	const joinedGroup = await new Promise((resolve) => {
		client.on("group:joined", resolve);
	});

	assert.strictEqual(joinedGroup.name, "Test Group");
	assert.strictEqual(joinedGroup.members.length, 3);
	assert.strictEqual(joinedGroup.members[0], user1._id.toString());
	assert.strictEqual(joinedGroup.members[1], user2._id.toString());
	assert.strictEqual(joinedGroup.members[2], user3._id.toString());

	client.close();
});
