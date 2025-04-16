'use strict';
const PrivateChat = require('whatsapp-web.js');
const GroupChat = require('whatsapp-web.js');


class ChatFactory {
    static create(client, data) {
        if(data.isGroup) {
            return new GroupChat(client, data);
        }

        return new PrivateChat(client, data);
    }
}

module.exports = ChatFactory;
