const {
    default: makeWASocket,
    generateThumbnail,
    getDevice,
    DisconnectReason,
    downloadContentFromMessage,
    delay,
    useSingleFileAuthState,
    generateWAMessage,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    proto,
    generateWAMessageContent,
} = require('@adiwajshing/baileys-md');
const express = require('express');
const { color } = require('./lib/function');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
let session = `./session.json`;
let package = require('./package.json');
const { state, saveState } = useSingleFileAuthState(session);
const { Serialize } = require('./lib/serialize');
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Jakarta').locale('id');

const PORTS = process.env.PORT || 8001;

// const whitelist = ['http://localhost:3000/', 'http://localhost:5000/']
// const corsOptions = {
//   origin: function (origin, callback) {
//       console.log(origin)
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
// }

const run = async () => {

    const start = async () => {

        const client = makeWASocket({
            printQRInTerminal: true,
            auth: state,
            browser: ['wa', 'Safari', '3.0'],
        });

        app.use(cors())
        app.use(helmet());

        const router = require('./router/router')(client);
        app.get('/', (req, res) => {
            res.send('Client Online')
        })
        app.use('/api', router);
    
        client.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            if (connection == 'connecting') {
                console.log(
                    color('[SYS]', '#009FFF'),
                    color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'),
                    color(`${package.name} is Authenticating...`, '#f12711')
                );
            } else if (connection === 'close') {
                console.log(
                    color('[SYS]', '#009FFF'),
                    color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'),
                    color(`Connection Closed, trying to reconnect`, '#f64f59')
                );
                lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                    ? start()
                    : console.log(
                        color('[SYS]', '#009FFF'),
                        color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'),
                        color(`WA Web Logged out`, '#f64f59')
                    );;
            } else if (connection == 'open') {
                console.log(
                    color('[SYS]', '#009FFF'),
                    color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'),
                    color(`${package.name} is now Connected...`, '#38ef7d')
                );
            }
        });
    
        client.ev.on('creds.update', () => saveState)
    
        client.ev.on('messages.upsert', async (msg) => {
            try {
                if (!msg.messages) return
                const m = msg.messages[0]
                if (m.key.fromMe) return
                const from = m.key.remoteJid;
                let type = Object.keys(m.message)[0];
                Serialize(client, m);
                const body = (type === 'conversation' && m.message.conversation) ? m.message.conversation : (type == 'imageMessage') && m.message.imageMessage.caption ? m.message.imageMessage.caption : (type == 'documentMessage') && m.message.documentMessage.caption ? m.message.documentMessage.caption : (type == 'videoMessage') && m.message.videoMessage.caption ? m.message.videoMessage.caption : (type == 'extendedTextMessage') && m.message.extendedTextMessage.text ? m.message.extendedTextMessage.text : (type == 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ? m.message.buttonsResponseMessage.selectedButtonId : (type == 'templateButtonReplyMessage') && m.message.templateButtonReplyMessage.selectedId ? m.message.templateButtonReplyMessage.selectedId : ""
    
                await client.sendReadReceipt(from, m.sender, [m.key.id])
    
                if (body == 'Hi') {
                    client.sendMessage(from, {text: 'Yo'})
                }
    
            } catch (error) {
                console.log(error);
            }
        })
    
    }
    
    start();

        app.listen(PORTS, () => {
            console.log(color('[~>>]'), color(`App Running http://localhost:${PORTS}`, 'green'))
            console.log(color('==================================================================='))
        })
}
run();