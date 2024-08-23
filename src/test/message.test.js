const test = require('node:test');
const assert = require('assert');
const { io } = require('socket.io-client');
const mongoose = require('mongoose');
const app = require('../app');

let server;
const socketUrl = 'http://localhost:3030';
const dbUrl = 'mongodb://localhost:27017/e2e_test_db';

test.before(async () => {
    await mongoose.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    process.env.MONGO_URL = dbUrl;
    process.env.PORT = "3030"

    server = app();
});

test.after(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();

    server.close();
});

test('Create group and send message', async () => {
    const userId1 = 1;
    const userId2 = 2;
    const client1 = io(socketUrl);
    const client2 = io(socketUrl);

    await new Promise((resolve) => {
        client1.on('connect', resolve);
    });
    await new Promise((resolve) => {
        client2.on('connect', resolve);
    });

    client1.emit('authenticate', userId1);
    client2.emit('authenticate', userId2);

    await client1.emit('group:create', {
        name: 'Test Group',
        members: [userId1, userId2]
    });

    const createdGroup = await new Promise((resolve) => {
        client1.on('group:created', resolve);
    });

    client1.emit('message:create', {
        groupId: createdGroup._id,
        text: 'Hello World!'
    });

    const createdMessage1 = await new Promise((resolve) => {
        client1.on('message:created', resolve);
    });
    assert.strictEqual(createdMessage1.text, 'Hello World!');


    const createdMessage2 = await new Promise((resolve) => {
        client2.on('message:created', resolve);
    });
    assert.strictEqual(createdMessage2.text, 'Hello World!');


    client1.close();
    client2.close();
});