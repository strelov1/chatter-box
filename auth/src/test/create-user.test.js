const test = require('node:test');
const assert = require('assert');
const mongoose = require('mongoose');
const axios = require('axios');
const app = require('../app');

let server;
const socketUrl = 'http://localhost:3032';
const dbUrl = 'mongodb://localhost:27017/e2e_test_db3';

test.before(async () => {
    await mongoose.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    process.env.MONGO_URL = dbUrl;
    process.env.PORT = "3032";

    server = await app();
});

test.after(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();

    server.close();
});

test('Register, login, and ensure no duplicate users', async () => {
    console.log("Starting registration for user1...");
    const registerResponse1 = await axios.post(`${socketUrl}/api/register`, {
        username: 'user1',
        password: 'password123'
    });
    assert.strictEqual(registerResponse1.status, 201);
    console.log("User1 registered successfully.");

    console.log("Starting registration for user2...");
    const registerResponse2 = await axios.post(`${socketUrl}/api/register`, {
        username: 'user2',
        password: 'password123'
    });
    assert.strictEqual(registerResponse2.status, 201);
    console.log("User2 registered successfully.");

    console.log("Attempting to register a duplicate user...");
    try {
        await axios.post(`${socketUrl}/api/register`, {
            username: 'user1',
            password: 'password123'
        });
        assert.fail('Expected duplicate user registration to fail.');
    } catch (error) {
        assert.strictEqual(error.response.status, 400);
        console.log("Duplicate user registration correctly failed.");
    }

    console.log("Logging in user1...");
    const loginResponse1 = await axios.post(`${socketUrl}/api/login`, {
        username: 'user1',
        password: 'password123'
    });
    assert.strictEqual(loginResponse1.status, 200);
    assert(loginResponse1.data.authKey, "Expected authKey in login response for user1.");
    console.log("User1 logged in successfully.");

    console.log("Logging in user2...");
    const loginResponse2 = await axios.post(`${socketUrl}/api/login`, {
        username: 'user2',
        password: 'password123'
    });
    assert.strictEqual(loginResponse2.status, 200);
    assert(loginResponse2.data.authKey, "Expected authKey in login response for user2.");
    console.log("User2 logged in successfully.");

    console.log("Testing completed successfully.");
});