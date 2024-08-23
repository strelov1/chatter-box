const test = require('node:test');
const assert = require('assert');
const { io } = require('socket.io-client');
const mongoose = require('mongoose');
const app = require('../app');

let server;
const socketUrl = 'http://localhost:3000';
const dbUrl = 'mongodb://localhost:27017/e2e_test_db';

test.before(async () => {
    await mongoose.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    process.env.MONGO_URL = dbUrl;

    server = app();
});

test.after(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();

    server.close();
});

test('Create group', async () => {
    const userId1 = 1;
    const userId2 = 2;
    const client = io(socketUrl);

    await new Promise((resolve) => {
        client.on('connect', resolve);
    });

    client.emit('authenticate', userId1);

    await client.emit('group:create', {
        name: 'Test Group',
        members: [userId1, userId2]
    });

    const createdGroup = await new Promise((resolve) => {
        client.on('group:created', resolve);
    });

    assert.strictEqual(createdGroup.name, 'Test Group');
    assert.strictEqual(createdGroup.members.length, 2);
    assert.strictEqual(createdGroup.members[0], userId1);
    assert.strictEqual(createdGroup.members[1], userId2);
    client.close();
});


test('Join new member', async () => {
    const userId1 = 1;
    const userId2 = 2;
    const userId3 = 3;
    const client = io(socketUrl);

    await new Promise((resolve) => {
        client.on('connect', resolve);
    });

    client.emit('authenticate', userId1);

    await client.emit('group:create', {
        name: 'Test Group',
        members: [userId1, userId2]
    });

    const createdGroup = await new Promise((resolve) => {
        client.on('group:created', resolve);
    });

    await client.emit('group:join', {
        groupId: createdGroup._id,
        members: [userId3]
    });

    const joinedGroup = await new Promise((resolve) => {
        client.on('group:joined', resolve);
    });

    assert.strictEqual(joinedGroup.name, 'Test Group');
    assert.strictEqual(joinedGroup.members.length, 3);
    assert.strictEqual(joinedGroup.members[0], userId1);
    assert.strictEqual(joinedGroup.members[1], userId2);
    assert.strictEqual(joinedGroup.members[2], userId3);

    client.close();
});