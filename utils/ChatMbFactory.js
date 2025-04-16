'use strict';

const PrivateChat = require('whatsapp-web.js');

class ChatMbFactory {
    static create(client, data) {

        // console.log('==>', data)

        if(!data.isGroup) {
            return new PrivateChat(client, data);
        }

    }
}

module.exports = ChatMbFactory;
