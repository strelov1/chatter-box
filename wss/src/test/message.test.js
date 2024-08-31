const test = require('node:test');
const assert = require('assert');
const { io } = require('socket.io-client');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../app');
const {UserModel} = require("../user/user.model");

let server;
const socketUrl = 'http://localhost:3030';
const dbUrl = 'mongodb://localhost:27017/e2e_test_db2';

test.before(async () => {
    await mongoose.connect(dbUrl);
    process.env.MONGO_URL = dbUrl;
    process.env.PORT = "3030"

    server = await app();

    const user1 = new UserModel({ username: 'user1', password: '*****', passwordHash: '*****' });
    const user2 = new UserModel({ username: 'user2', password: '*****', passwordHash: '*****' });

    await user1.save();
    await user2.save();
});

test.after(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();

    server.close();
});

const createUser = async (userName) => {
    const user = await UserModel.findOne({ username: userName });

    return {
        user,
        token: jwt.sign({ userId: user._id }, 'jwtSecret')
    }
};

test('Create users, create group, and send message', async () => {
    const { token: authKey1} = await createUser('user1');
    const { token: authKey2} = await createUser('user');

    const client1 = io(socketUrl, {
        auth: { token: authKey1 }
    });

    const client2 = io(socketUrl, {
        auth: { token: authKey2 }
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
        members: [user1._id, user2._id]
    });

    const createdGroup = await new Promise((resolve) => {
        client1.on('group:created', resolve);
    });

    // Send a message in the created group
    await client1.emit('message:create', {
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