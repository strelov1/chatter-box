const protobuf = require('protobufjs');

class MessageSerializerProtobuf {

    constructor() {
        this.loadProto();
    }

    loadProto() {
        const root = protobuf.loadSync(__dirname + '/message.proto');
        this.Message = root.lookupType('Message');
    }

    encodeMessage(payload) {
        if (!this.Message) {
            throw new Error('Protobuf message type not loaded');
        }

        const error = this.Message.verify(payload);
        if (error) {
            throw Error(error);
        }

        return this.Message.encode(this.Message.create(payload)).finish();
    }

    decodeMessage(buffer) {
        if (!this.Message) {
            throw new Error('Protobuf message type not loaded');
        }
        return this.Message.decode(buffer);
    }
}

module.exports = {
    MessageSerializerProtobuf
};