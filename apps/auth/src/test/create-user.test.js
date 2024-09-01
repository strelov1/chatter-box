const test = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const axios = require("axios");
const app = require("../app");

let server;
const apiUrl = "http://localhost:3032/api/v1";
const dbUrl = "mongodb://localhost:27017/e2e_test_db3";

test.before(async () => {
	await mongoose.connect(dbUrl);
	process.env.MONGO_URL = dbUrl;
	process.env.PORT = "3032";

	server = await app();
});

test.after(async () => {
	await mongoose.connection.db.dropDatabase();
	await mongoose.disconnect();

	server.close();
});

test("Register, login, and ensure no duplicate users", async () => {
	const registerResponse1 = await axios.post(`${apiUrl}/auth/register`, {
		username: "user1",
		password: "password123",
	});
	assert.strictEqual(registerResponse1.status, 201);
	const registerResponse2 = await axios.post(`${apiUrl}/auth/register`, {
		username: "user2",
		password: "password123",
	});
	assert.strictEqual(registerResponse2.status, 201);

	try {
		await axios.post(`${apiUrl}/auth/register`, {
			username: "user1",
			password: "password123",
		});
		assert.fail("Expected duplicate user registration to fail.");
	} catch (error) {
		assert.strictEqual(error.response.status, 400);
	}

	const loginResponse1 = await axios.post(`${apiUrl}/auth/login`, {
		username: "user1",
		password: "password123",
	});
	assert.strictEqual(loginResponse1.status, 200);
	assert(
		loginResponse1.data.authKey,
		"Expected authKey in login response for user1.",
	);

	const loginResponse2 = await axios.post(`${apiUrl}/auth/login`, {
		username: "user2",
		password: "password123",
	});
	assert.strictEqual(loginResponse2.status, 200);
	assert(
		loginResponse2.data.authKey,
		"Expected authKey in login response for user2.",
	);
});
