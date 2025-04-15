var express = require('express');
var router = express.Router();

const {Client, LocalAuth} = require('whatsapp-web.js');
const path = require("path");
const puppeteer = require("puppeteer");

const user_home = process.env.HOME || process.env.USERPROFILE
let filePath = `${user_home}${path.sep}Documents${path.sep}maibangLib${path.sep}.wwebjs_auth/`


const isPkg = typeof process.pkg !== 'undefined';
let locaPath = "C:"
// let locaPath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
// chromiumExecutablePath = locaPath
let chromiumExecutablePath = locaPath;
// app.js
const args = process.argv.slice(2); // 去掉前两个元素

args.forEach(arg => {
  let [key, value] = arg.split('=');
  console.log(`${key}:${value}`);
  if (key === 'chromePath'){
    chromiumExecutablePath = value
  }
});

// 输出：a: 1

//
// let chromiumExecutablePath = (isPkg ?
//         puppeteer.executablePath().replace(
//             /^.*?\/node_modules\/puppeteer\/\.local-chromium/,
//             path.join(path.dirname(process.execPath), 'chromium')
//         ) :
//         locaPath
//         // puppeteer.executablePath()
// );
//
// console.log(process.platform)
// //check win32
// if (process.platform === 'win32') {
//   chromiumExecutablePath = (isPkg ?
//           puppeteer.executablePath().replace(
//               /^.*?\\node_modules\\puppeteer\\\.local-chromium/,
//               path.join(path.dirname(process.execPath), 'chromium')
//           ) :
//           // puppeteer.executablePath()
//           locaPath
//
//   );
// }
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
if (process.platform === 'darwin'){
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




/* GET home page. */
router.get('/', function(req, res, next) {
  client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED', qr);
  });

  client.on('ready', () => {
    console.log('Client is ready!');
  });

  client.on('message', msg => {
    if (msg.body == '!ping') {
      msg.reply('pong');
    }
  });

  client.initialize();
  res.send({msg: "succsss", sendState: '501'});
});

/* GET home page. */
router.get('/get', function(req, res, next) {
  client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED', qr);
  });

  client.on('ready', () => {
    console.log('Client is ready!');
  });

  client.on('message', msg => {
    if (msg.body == '!ping') {
      msg.reply('pong');
    }
  });

  client.initialize();
  res.send({msg: "succsss", sendState: '501'});
});

module.exports = router;
