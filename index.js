
require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process'
    ],
  },
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message', async (message) => {
  if (message.from.endsWith('@c.us')) {
    console.log('Received message from private chat:', message.body);
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [{
          role: 'user',
          content: message.body
        }],
      });
      const response = completion.choices[0].message.content;
      message.reply(response);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      message.reply('Sorry, I could not process your request at the moment.');
    }
  }
});

client.initialize()
