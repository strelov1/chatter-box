
class MessageSerializerJson {

    encodeMessage(message) {
        return JSON.stringify(message);
    }

    decodeMessage(buffer) {
        return JSON.parse(buffer);
    }
}

module.exports = {
    MessageSerializerJson
};