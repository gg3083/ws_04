var express = require('express');
var router = express.Router();
var mutipart = require('connect-multiparty');

var mutipartMiddeware = mutipart();
const {Client, LocalAuth, MessageMedia, PrivateChat, GroupChat} = require('whatsapp-web.js');
const ChatFactory = require("../utils/ChatFactory")
const path = require("path");
const puppeteer = require("puppeteer");
const e = require("express");
const fs = require("fs");
var request = require('request');
var requestPromise = require('request-promise');
const user_home = process.env.HOME || process.env.USERPROFILE
let filePath = `${user_home}${path.sep}Documents${path.sep}maibangLib${path.sep}.wwebjs_auth/`


const isPkg = typeof process.pkg !== 'undefined';
let locaPath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
let chromiumExecutablePath = locaPath;
const args = process.argv.slice(2); // 去掉前两个元素

args.forEach(arg => {
    let [key, value] = arg.split('=');
    console.log(`${key}:${value}`);
    if (key === 'chromePath') {
        chromiumExecutablePath = value
    }
});

console.log('chromiumExecutablePath', chromiumExecutablePath)
let client = new Client({
    // puppeteer: {headless: false,      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'},
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        executablePath: chromiumExecutablePath
    },

    // session: sessionCfg
});

console.log('filePath:', filePath)
if (process.platform === 'darwin') {
    client = new Client({
        // puppeteer: {headless: false,      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'},
        authStrategy: new LocalAuth({
            clientId: null,
            dataPath: filePath,
        }),
        puppeteer: {headless: false,},

        // session: sessionCfg
    });
}

const isCrm = false
const isB2b = false


/* GET home page. */
router.get('/', function (req, res, next) {
    let qrCode = "init..."
    client.on('qr', (qr) => {
        // Generate and scan this code with your phone
        console.log('QR RECEIVED', qr);
        qrCode = qr
    });

    client.on('authenticated', async (session) => {
        console.log('AUTHENTICATED', session);
        // sessionCfg = session;
        // fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        //     if (err) {
        //         console.error(err);
        //     }
        // });
        const debugWWebVersion = await client.getWWebVersion();
        console.log(`WWebVersion = ${debugWWebVersion}`);

        client.pupPage.on('pageerror', function (err) {
            console.log('Page error: ' + err.toString());
        });
        client.pupPage.on('error', function (err) {
            console.log('Page error: ' + err.toString());
        });
    });

    client.on('auth_failure', msg => {
        // Fired if session restore was unsuccessfull
        console.error('AUTHENTICATION FAILURE', msg);
    });

    client.on('ready', (session) => {

        console.log('Client is ready!', JSON.stringify(session));
        res.send({state: '200'});
    });

    client.on('message', async msg => {
        console.log('接到消息：', msg)
        if (msg.ack == null || msg.ack === 3) {
            return
        }
        let body = msg.body

        if (msg.hasMedia) {
            body = "[图像文件]:暂不支持查看！"
        }
        let data = {
            body: body,
            timestamp: msg.timestamp,
            from: msg.from,
            to: msg.to,
            hasMedia: msg.hasMedia,
            ack: msg.ack,
        }
        let jsonData = JSON.stringify(data)
        console.log('开始回复1：', jsonData)
        let callbackUrl = "http://127.0.0.1:17771/whatsapp/callback"
        if (isCrm) {
            callbackUrl = "http://127.0.0.1:17770/whatsapp/callback"
        }
        if (isB2b) {
            callbackUrl = "http://127.0.0.1:17772/whatsapp/callback"
        }
        request({
            url: callbackUrl,
            method: "POST",
            json: true,
            headers: {
                "content-type": "application/json",
            },
            body: data
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
            }
        });

    });
    client.on('message_ack', async msg => {
        console.log('message_ack：', msg)
        if (msg.ack !== 3) {
            return
        }
        if (msg.from && msg.from.includes("@g.us")) {
            console.log('群组消息不需要通知已读！')
            return
        }
        let body = msg.body
        if (msg.hasMedia) {
            body = "[图像文件]:暂不支持查看！"
        }
        let data = {
            body: body,
            timestamp: msg.timestamp,
            from: msg.from,
            to: msg.to,
            hasMedia: msg.hasMedia,
            ack: msg.ack,
        }
        let jsonData = JSON.stringify(data)
        console.log('已读消息：', jsonData)
        let callbackUrl = "http://127.0.0.1:17771/whatsapp/callback"
        if (isCrm) {
            callbackUrl = "http://127.0.0.1:17770/whatsapp/callback"
        }
        if (isB2b) {
            callbackUrl = "http://127.0.0.1:17772/whatsapp/callback"
        }
        request({
            url: callbackUrl,
            method: "POST",
            json: true,
            headers: {
                "content-type": "application/json",
            },
            body: data
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
            }
        });
    });

    client.initialize();
    console.log('initialize')
});


router.get('/status', function (req, res, next) {

    client.getState().then(r => {
        console.log("r:", r)
        res.send({status: r, sendState: '200'});
    }).catch(err => {
        console.log('err', e)
        res.send({msg: err, sendState: '501'});
    })
});

router.get('/register/:phone', function (req, res, next) {
    let phone = `${req.params.phone}`;
    console.log(phone)


    client.isRegisteredUser(phone).then((r) => {
        console.log(`${phone} ${r === true ? '已' : '未'}注册`);
        res.send({phone: phone, isReg: r, sendState: '201'});
    }).catch(err => {
        console.log(err)
        res.send({msg: err, sendState: '501'});
    })
});

router.post('/send', function (req, res, next) {
    let phone = `${req.body.phone}`;
    let message = `${req.body.message}`;
    console.log('phone:', phone)
    console.log('message:', message)
    let number = ''
    if (phone.includes("@g.us")) {
        number = phone
    } else {
        number = phone.includes('@c.us') ? phone : `${phone}@c.us`;
    }
    client.sendMessage(number, message, {}).then((r) => {
        console.log(`${phone} 已发送: ${message} !`);
        res.send({phone: phone, sendState: '202'});
    }).catch(err => {
        console.log("err:", err)
        // console.log("err.message:", err.message)
        // console.log("err.fileName:", err.fileName)
        // console.log("err.lineNumber:", err.lineNumber)
        // console.log("err.stack:", err.stack)
        // console.log("err.name:", err.name)
        res.send({msg: err, sendState: '502'});
    });

});

router.post('/sendImg', function (req, res, next) {
    let phone = `${req.body.phone}`;
    let message = `${req.body.message}`;
    let base64 = `${req.body.baseData}`;

    console.log('phone:', phone)
    console.log('message:', message)
    let number = ''
    if (phone.includes("@g.us")) {
        number = phone
    } else {
        number = phone.includes('@c.us') ? phone : `${phone}@c.us`;
    }
    client.sendMessage(number, message, {}).then((r) => {
        console.log(`${phone} 已发送文字: ${message} !`);
        const media = new MessageMedia('image/png', base64);

        client.sendMessage(number, media, {}).then((r) => {
            console.log(`${phone} 已发送图片: ${message} !`);
            res.send({phone: phone, sendState: '202'});
        }).catch(err => {
            console.log(err)
            res.send({msg: err, sendState: '502'});
        });
    }).catch(err => {
        console.log(err)
        res.send({msg: err, sendState: '502'});
    });

});


router.post('/sendImg2', mutipartMiddeware, function (req, res, next) {
    let phone = `${req.body.phone}`;
    let message = `${req.body.message}`;
    let filePathV2 = `${req.body.baseData}`;

    console.log('phone:', phone)
    console.log('message:', message)
    console.log('filePath:', filePathV2)
    const number = phone.includes('@c.us') ? phone : `${phone}@c.us`;

    try {
        const b64data = fs.readFileSync(filePathV2, {encoding: 'base64'});
        console.log('b64data2', b64data)
    } catch (e) {
        console.log('er:', e)
    }

    client.sendMessage(number, message, {}).then((r) => {
        console.log(`${phone} 已发送文字: ${message} !`);
        const media = MessageMedia.fromFilePath(filePathV2);

        client.sendMessage(number, media, {}).then((r) => {
            console.log(`${phone} 已发送图片: ${message} !`);
            res.send({phone: phone, sendState: '202'});
        }).catch(err => {
            console.log(err)
            res.send({msg: err, sendState: '502'});
        });
    }).catch(err => {
        console.log(err)
        res.send({msg: err, sendState: '502'});
    });

});

router.post('/sendImg3', mutipartMiddeware, function (req, res, next) {
    let phone = `${req.body.phone}`;
    let message = `${req.body.message}`;
    let mediaUrl = `${req.body.media}`;

    console.log('phone:', phone)
    console.log('message:', message)
    console.log('filePath:', mediaUrl)
    const number = phone.includes('@c.us') ? phone : `${phone}@c.us`;

    client.sendMessage(number, message, {}).then(async (r) => {
        console.log(`${phone} 已发送文字: ${message} !`);
        if (!mediaUrl) {
            res.send({phone: phone, sendState: '202'});
            return
        }
        const media = await MessageMedia.fromUrl(mediaUrl);
        client.sendMessage(number, media, {}).then((r) => {
            console.log(`${phone} 已发送图片: ${message} !`);
            res.send({phone: phone, sendState: '202'});
        }).catch(err => {
            console.log(err)
            res.send({msg: err, sendState: '502'});
        });
    }).catch(err => {
        console.log(err)
        res.send({msg: err, sendState: '502'});
    });

});


router.get('/registerBatch/:phones', function (req, res, next) {
    let phones = `${req.params.phones}`;
    let phoneList = []
    if (phones.includes(",")) {
        phoneList = phones.split(",")
    } else {
        phoneList = [phones]
    }
    let resultData = []
    phoneList.forEach(phone => {
        client.isRegisteredUser(phone + '@c.us').then((r) => {
            console.log(`${phone} ${r === true ? '已' : '未'}注册`);
            resultData.push({phone: phone, isReg: r})
        })
        console.log('resultData-: ', resultData)
    })
    console.log('resultData: ', resultData)
    res.send(resultData);
});


router.get('/getAllChatPhone', async function (req, res, next) {

    let chats = await client.pupPage.evaluate(async () => {
        const chats = window.Store.Chat.getModelsArray();

        const chatPromises = chats.map(chat => window.WWebJS.getChatModel(chat));
        return await Promise.all(chatPromises);
    });

    let result = chats.map(item => {
        // console.log('item=>', item)
        return {
            name: item.formattedTitle,
            serialized: item.id._serialized,
            timestamp: item.t,
            unreadCount: item.unreadCount,
        }
    })
    res.send(result);
});

router.get('/getAllChatPhoneV2', function (req, res, next) {
    client.getChats().then(chat => {
        console.log('chat.length', chat.length)
        // if (chat.length > 30){
        //     chat = chat.splice(0, 10)
        // }
        let result = chat.map(item => {
            console.log('item=>', item)
            return {
                name: item.name,
                serialized: item.id._serialized,
                timestamp: item.timestamp,
                unreadCount: item.unreadCount,
                isReadOnly: item.isReadOnly,
                server: item.id.server,
                participants: item.groupMetadata ? item.groupMetadata.participants : [],
            }
        })
        //过滤掉退出群的和广播的
        res.send(result.filter(item => !item.isReadOnly && item.server !== 'broadcast'));
    })
});


router.get('/getAllGroups', async function (req, res, next) {
    let chats = await client.pupPage.evaluate(async () => {
        const chats = window.Store.Chat.getModelsArray();

        const chatPromises = chats.filter(chat => chat.isGroup);
        const groupPromises = chatPromises.map(chat => window.WWebJS.getChatModel(chat));
        return await Promise.all(groupPromises);
    });
    let result = chats.filter(chat => ChatFactory.create(this, chat))
        .map(item => {
            console.log('groupMetadata:=>', item)
            return {
                name: item.formattedTitle,
                serialized: item.id._serialized,
                timestamp: item.t,
                participants: item.groupMetadata ? item.groupMetadata.participants : [],
            }
        });
    res.send(result);
});

router.get('/getChatModel/:id', function (req, res, next) {
    let phones = `${req.params.id}`;
    client.getContactById(phones).then(item => {
        console.log(item)
        let data = {
            phone: item.name,
            id: item.id._serialized,
        }
        res.send(data);
    })
});


router.get('/setRead/:id', function (req, res, next) {
    let phones = `${req.params.id}`;
    let limit = `${req.query.limit}`;
    let num = 10
    if (!isNaN(limit)) {
        num = Number(limit)
    }
    client.markChatUnread(phones).then(item => {
        console.log("res", item)
        res.send("200");
    })

});

router.get('/getChatMsgById/:id', function (req, res, next) {
    let phones = `${req.params.id}`;
    let limit = `${req.query.limit}`;
    let num = 100
    if (!isNaN(limit)) {
        num = Number(limit)
    }
    console.log('phone, num', phones, num)
    client.getChatById(phones).then(item => {
        console.log('item.unreadCount', item.unreadCount)
        if (item.unreadCount > 0) {
            client.markChatRead(phones).then(item => {
                console.log("res", item)
            })
        }
        let data = []
        item.fetchMessages({limit: num}).then(msgs => {
            msgs.forEach(msg => {
                // console.log('msg:', msg)
                let body = msg.body
                if (msg.hasMedia) {
                    body = "[图像文件]:暂不支持查看！"
                }
                let result = {
                    body: body,
                    timestamp: msg.timestamp,
                    from: msg.from,
                    to: msg.to,
                    isSend: msg.fromMe,
                    ack: msg.ack,
                }
                data.push(result)
            })
            res.send(data);
        })
    })
});

router.get('/getMeUser/:userId', function (req, res, next) {
    let userId = `${req.params.userId}`;

    getMeInfo(userId).then(item => {
        console.log('item:', item)
        let data = {
            login_name: item.pushname,
            phone: item.wid.user,
            ws_phone: item.wid._serialized,
            preview_url: item.preview_url,
            base64_url: item.base64_url,
        }
        res.send(data);
    }).catch(err => {
        res.send({msg: err, sendState: '503'});
    })
})

async function getLogoUrl(userId) {
    let resItem =  await client.pupPage.evaluate(async id => {
        try {
            function convertUrlToBase64(url) {
                return new Promise(function (resolve, reject) {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.responseType = 'blob';
                    xhr.onload = function () {
                        if (this.status == 200) {
                            var reader = new FileReader();
                            reader.onload = function (e) {
                                resolve(e.target.result);
                            };
                            reader.onerror = function (e) {
                                reject(e.target.error);
                            };
                            reader.readAsDataURL(this.response);
                        } else {
                            reject(new Error('Image load error'));
                        }
                    };
                    xhr.onerror = function () {
                        reject(new Error('Image request error'));
                    };
                    xhr.send();
                });
            }

            function getContactModel(contact) {
                let res = contact.serialize();
                res.isBusiness = contact.isBusiness === undefined ? false : contact.isBusiness;

                if (contact.businessProfile) {
                    res.businessProfile = contact.businessProfile.serialize();
                }

                // TODO: remove useOldImplementation and its checks once all clients are updated to >= v2.2327.4
                const useOldImplementation
                    = window.compareWwebVersions(window.Debug.VERSION, '<', '2.2327.4');

                res.isMe = useOldImplementation
                    ? contact.isMe
                    : window.Store.ContactMethods.getIsMe(contact);
                res.isUser = useOldImplementation
                    ? contact.isUser
                    : window.Store.ContactMethods.getIsUser(contact);
                res.isGroup = useOldImplementation
                    ? contact.isGroup
                    : window.Store.ContactMethods.getIsGroup(contact);
                res.isWAContact = useOldImplementation
                    ? contact.isWAContact
                    : window.Store.ContactMethods.getIsWAContact(contact);
                res.isMyContact = useOldImplementation
                    ? contact.isMyContact
                    : window.Store.ContactMethods.getIsMyContact(contact);
                res.isBlocked = contact.isContactBlocked;
                res.userid = useOldImplementation
                    ? contact.userid
                    : window.Store.ContactMethods.getUserid(contact);
                res.isEnterprise = useOldImplementation
                    ? contact.isEnterprise
                    : window.Store.ContactMethods.getIsEnterprise(contact);
                res.verifiedName = useOldImplementation
                    ? contact.verifiedName
                    : window.Store.ContactMethods.getVerifiedName(contact);
                res.verifiedLevel = useOldImplementation
                    ? contact.verifiedLevel
                    : window.Store.ContactMethods.getVerifiedLevel(contact);
                res.statusMute = useOldImplementation
                    ? contact.statusMute
                    : window.Store.ContactMethods.getStatusMute(contact);
                res.name = useOldImplementation
                    ? contact.name
                    : window.Store.ContactMethods.getName(contact);
                res.shortName = useOldImplementation
                    ? contact.shortName
                    : window.Store.ContactMethods.getShortName(contact);
                res.pushname = useOldImplementation
                    ? contact.pushname
                    : window.Store.ContactMethods.getPushname(contact);
                delete res.id

                return res;
            };

            const chatWid = window.Store.WidFactory.createWid(id);
            const data = await window.Store.ProfilePic.requestProfilePicFromServer(chatWid)
            const preview_url = data.previewEurl
            const base64_url = preview_url ? await convertUrlToBase64(preview_url) : ""
            console.log('头像获取完成！')
            const contact = await window.Store.Contact.find(chatWid);
            // console.log('chatWid', chatWid)
            const bizProfile = await window.Store.BusinessProfile.fetchBizProfile(chatWid);
            bizProfile.profileOptions && (contact.businessProfile = bizProfile);
            console.log('信息获取完成！')

            let item = getContactModel(contact);
            item.name = item ? item.shortName ? item.shortName : item.pushname ?
                item.pushname : item.username ? item.username : item.verifiedName ? item.verifiedName : item.userid: item.userid;
            item.email = item ? item.businessProfile ? item.businessProfile.email : '' : '';
            item.address = item ? item.businessProfile ? item.businessProfile.address : '' : '';
            item.description = item ? item.businessProfile ? item.businessProfile.description : '' : '';
            item.website = item ? item.businessProfile ? item.businessProfile.website ? item.businessProfile.website.map(item => item.url)
                .join(',') : '' : '' : '';
            // item.logo_url= item.preview_url;
            // item.base64_url= item.base64_url;
            // let item = {}


            let res = {...item, preview_url: preview_url, base64_url: base64_url}
            console.log('res', res)
            return res;

        } catch (err) {
            if (err.name === 'ServerStatusCodeError') return undefined;
            return err
        }
    }, userId);
    console.log('resItem', resItem)
    return resItem
}

//        //        this.name = data.contact?data.contact.shortName?data.contact.shortName:data.contact.pushname?
//         //             data.contact.pushname:data.contact.username?data.contact.username:data.contact.verifiedName?data.contact.verifiedName: data.formattedTitle: data.formattedTitle;
//         //        this.email = data.contact ?data.contact.businessProfile ? data.contact.businessProfile.email: '': '';
//         //         this.address = data.contact ?data.contact.businessProfile ?  data.contact.businessProfile.address: '': '';
//         //         this.description = data.contact ? data.contact.businessProfile ? data.contact.businessProfile.description:'': '';
//         //         this.website = data.contact ?data.contact.businessProfile ?  data.contact.businessProfile.website ?data.contact.businessProfile.website.map(item=>item.url)
//         //             .join(','):'': '': '';


async function getMeInfo(userId) {
    return await client.pupPage.evaluate(async (userId) => {
        try {
            function convertUrlToBase64(url) {
                return new Promise(function (resolve, reject) {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.responseType = 'blob';
                    xhr.onload = function () {
                        if (this.status == 200) {
                            var reader = new FileReader();
                            reader.onload = function (e) {
                                resolve(e.target.result);
                            };
                            reader.onerror = function (e) {
                                reject(e.target.error);
                            };
                            reader.readAsDataURL(this.response);
                        } else {
                            reject(new Error('Image load error'));
                        }
                    };
                    xhr.onerror = function () {
                        reject(new Error('Image request error'));
                    };
                    xhr.send();
                });
            }

            const userInfo = window.Store.User.getMeUser()
            const chatWid = window.Store.WidFactory.createWid(userInfo._serialized);
            if (userId && userId > 0) {
                const data = await window.Store.ProfilePic.requestProfilePicFromServer(chatWid)
                const preview_url = data.previewEurl
                const base64_url = preview_url ? await convertUrlToBase64(preview_url) : ""
                return {
                    ...window.Store.Conn.serialize(),
                    preview_url: preview_url,
                    base64_url: base64_url,
                    wid: userInfo
                }
            } else {
                return {...window.Store.Conn.serialize(), wid: userInfo}
            }

        } catch (err) {
            if (err.name === 'ServerStatusCodeError') return undefined;
            return err
        }
    }, userId);
}

router.get('/getAllChatPhoneV3', async function (req, res, next) {
    let chats = await client.pupPage.evaluate(async () => {
        const chats = window.Store.Chat.getModelsArray();

        const chatPromises = chats.map(chat => window.WWebJS.getChatModel(chat));
        return await Promise.all(chatPromises);
    });

    let result = chats.filter(item => !item.isReadOnly && item.server !== 'broadcast' && !item.isGroup).map(item => {
        // console.log('item=>', item)
        console.log('item', item)
        return {
            phone: item.id.user,
            ws_phone: item.id._serialized,
            timestamp: item.t,
            unreadCount: item.unreadCount,
            isReadOnly: item.isReadOnly,
            isGroup: item.isGroup,
            server: item.id.server,
            last_message: item.lastMessage?item.lastMessage.body: '',
            // logo_url: item.preview_url,
            // base64_url: item.base64_url,


        }
        //        this.name = data.contact?data.contact.shortName?data.contact.shortName:data.contact.pushname?
        //             data.contact.pushname:data.contact.username?data.contact.username:data.contact.verifiedName?data.contact.verifiedName: data.formattedTitle: data.formattedTitle;
        //        this.email = data.contact ?data.contact.businessProfile ? data.contact.businessProfile.email: '': '';
        //         this.address = data.contact ?data.contact.businessProfile ?  data.contact.businessProfile.address: '': '';
        //         this.description = data.contact ? data.contact.businessProfile ? data.contact.businessProfile.description:'': '';
        //         this.website = data.contact ?data.contact.businessProfile ?  data.contact.businessProfile.website ?data.contact.businessProfile.website.map(item=>item.url)
        //             .join(','):'': '': '';
    })
    res.send(result);
});
router.get('/getLogoUrl/:id', async function (req, res, next) {
    let phone = `${req.params.id}`;
    if (!phone || phone.length < 10) {
        res.send({
            preview_url: '', base64_url: ''
        });
        return
    }
    //     name: item.name,
    //             email: item.email,
    //             address: item.address,
    //             description: item.description,
    //             website: item.website


    let item = await getLogoUrl(phone)
    res.send(item);

});

const convertUrlToBase64 = function (url) {
    return new Promise(function (resolve, reject) {
        requestPromise.get(url)
            .then(response => {
                resolve(response.toString("base64"))
            })
            .catch(error => {
                reject(error);
            });


    });
}

// 使用示例

router.get('/getChatMsgByIdV2/:id', function (req, res, next) {
    let phones = `${req.params.id}`;
    let limit = `${req.query.limit}`;
    let num = 200
    if (!isNaN(limit)) {
        num = Number(limit)
    }
    console.log('phone, num', phones, num)
    client.getChatById(phones).then(item => {
        let data = []
        item.fetchMessages({limit: num}).then(msgs => {
            msgs.forEach(msg => {
                let result = {
                    id: msg.id.id,
                    body: msg.body,
                    body_v2: msg.body_v2,
                    timestamp: msg.timestamp,
                    from: msg.from,
                    to: msg.to,
                    is_send: msg.fromMe,
                    // ack: msg.ack,
                    has_media: msg.hasMedia,
                    type: msg.type,
                    device_type: msg.deviceType,
                }
                if (msg.type === 'chat' || msg.type === 'image' || msg.type === 'video') {
                    data.push(result)
                }
            })
            res.send(data);
        }).catch(err => {
            res.send({msg: err, sendState: '503'});
        })
    }).catch(err => {
        res.send({msg: err, sendState: '503'});
    })
});

router.post('/joinGroup', function (req, res, next) {
    let groupId = `${req.body.groupId}`;
    console.log('groupId:', groupId)
    client.acceptInvite(groupId).then(result => {
        console.log('res', result)
        res.send({msg: result, group: groupId, sendState: '203'});
    }).catch(err => {
        console.log(err)
        res.send({msg: err, group: groupId, sendState: '503'});
    })

});


module.exports = router;
