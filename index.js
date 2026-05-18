require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const OpenAI = require("openai");
const express = require("express");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let qrCodeData = null;
let clientReady = false;

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
  },
});

client.on("qr", (qr) => {
  console.log("QR RECEIVED", qr);
  qrcode.toDataURL(qr, (err, url) => {
    if (err) {
      console.error("Error generating QR code data URL:", err);
      qrCodeData = "Error generating QR code.";
    } else {
      qrCodeData = url;
    }
  });
});

client.on("ready", () => {
  console.log("Client is ready!");
  clientReady = true;
  qrCodeData = null;
});

client.on("message", async (message) => {
  if (message.from.endsWith("@c.us")) {
    console.log("Received message from private chat:", message.body);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{
          role: "user",
          content: message.body
        }],
      });
      const response = completion.choices[0].message.content;
      message.reply(response);
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      message.reply("Sorry, I could not process your request at the moment.");
    }
  }
});

client.initialize();

app.get("/", (req, res) => {
  if (clientReady) {
    res.send("<h1>Client is ready! No QR needed.</h1>");
  } else if (qrCodeData) {
    res.send('<h1>Scan this QR code with your phone:</h1><img src="' + qrCodeData + '" alt="QR Code" style="width:300px;height:300px;">');
  } else {
    res.send("<h1>Waiting for QR code...</h1><p>Please refresh the page after a few moments.</p>");
  }
});

app.listen(PORT, () => {
  console.log("Server listening on port " + PORT);
});
