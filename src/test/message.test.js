const test = require('node:test');
const assert = require('assert');
const { io } = require('socket.io-client');
const mongoose = require('mongoose');
const axios = require('axios');
const app = require('../app');

let server;
const socketUrl = 'http://localhost:3030';
const dbUrl = 'mongodb://localhost:27017/e2e_test_db2';
const redisUrl = 'redis://localhost:6379';

test.before(async () => {
    await mongoose.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    process.env.MONGO_URL = dbUrl;
    process.env.PORT = "3030"
    process.env.REDIS_URL = redisUrl;

    server = await app();
});

test.after(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();

    server.close();
});

test('Create users, create group, and send message', async () => {
    // Register user1
    const registerResponse1 = await axios.post(`${socketUrl}/api/register`, {
        username: 'user1',
        password: 'password123'
    });
    assert.strictEqual(registerResponse1.status, 201);

    // Register user2
    const registerResponse2 = await axios.post(`${socketUrl}/api/register`, {
        username: 'user2',
        password: 'password123'
    });
    assert.strictEqual(registerResponse2.status, 201);

    // Login user1 and get authKey
    const loginResponse1 = await axios.post(`${socketUrl}/api/login`, {
        username: 'user1',
        password: 'password123'
    });
    assert.strictEqual(loginResponse1.status, 200);
    const authKey1 = loginResponse1.data.authKey;

    // Login user2 and get authKey
    const loginResponse2 = await axios.post(`${socketUrl}/api/login`, {
        username: 'user2',
        password: 'password123'
    });
    assert.strictEqual(loginResponse2.status, 200);
    const authKey2 = loginResponse2.data.authKey;

    // Connect users via Socket.IO
    const client1 = io(socketUrl, {
        auth: {
            token: authKey1
        }
    });

    const client2 = io(socketUrl, {
        auth: {
            token: authKey2
        }
    });

    await new Promise((resolve) => {
        client1.on('connect', resolve);
    });
    await new Promise((resolve) => {
        client2.on('connect', resolve);
    });

    // Create a group with both users
    await client1.emit('group:create', {
        name: 'Test Group',
        members: [registerResponse1.data.userId, registerResponse2.data.userId]
    });

    const createdGroup = await new Promise((resolve) => {
        client1.on('group:created', resolve);
    });

    // Send a message in the created group
    client1.emit('message:create', {
        groupId: createdGroup._id,
        text: 'Hello World!'
    });

    // Validate that the message was received by both users
    const createdMessage1 = await new Promise((resolve) => {
        client1.on('message:created', resolve);
    });
    assert.strictEqual(createdMessage1.text, 'Hello World!');

    const createdMessage2 = await new Promise((resolve) => {
        client2.on('message:created', resolve);
    });
    assert.strictEqual(createdMessage2.text, 'Hello World!');

    // Close connections
    client1.close();
    client2.close();
});