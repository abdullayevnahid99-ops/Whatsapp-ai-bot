const { Client, LocalAuth } = require('whatsapp-web.js');
const OpenAI = require('openai');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in the .env file.');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'],
    },
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (msg) => {
    if (msg.from.endsWith('@c.us')) {
        console.log('Received message:', msg.body);
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4.1-mini',
                messages: [{ role: 'user', content: msg.body }],
            });
            const reply = completion.choices[0].message.content;
            msg.reply(reply);
            console.log('Replied with:', reply);
        } catch (error) {
            console.error('Error generating AI response:', error);
            msg.reply('Sorry, I could not generate a response at this moment.');
        }
    }
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected', reason);
});

client.on('auth_failure', (msg) => {
    console.error('Authentication failure', msg);
});

client.initialize();
