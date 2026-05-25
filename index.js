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
let statusMsg = "Starting...";

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-extensions",
    ],
  },
});

client.on("qr", (qr) => {
  console.log("QR RECEIVED");
  qrcode.toDataURL(qr, (err, url) => {
    if (!err) qrCodeData = url;
  });
});

client.on("authenticated", () => {
  console.log("AUTHENTICATED");
  statusMsg = "Authenticated, loading...";
});

client.on("ready", () => {
  console.log("Client is ready!");
  clientReady = true;
  qrCodeData = null;
  statusMsg = "Client is ready!";
});

client.on("message_create", async (message) => {
  console.log("message_create:", message.from, "->", message.to, "fromMe:", message.fromMe, "body:", message.body.substring(0, 50));

  if (message.fromMe) return;
  if (message.isStatus) return;
  if (message.from.includes("@g.us")) return;
  if (message.from.includes("@broadcast")) return;

  console.log("Processing message from:", message.from, "body:", message.body);
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: message.body }],
    });
    const response = completion.choices[0].message.content;
    await message.reply(response);
    console.log("Reply sent successfully to:", message.from);
  } catch (error) {
    console.error("OpenAI Error:", error.message);
    await message.reply("Sorry, I could not process your request.");
  }
});

client.on("disconnected", (reason) => {
  console.log("Client disconnected:", reason);
  clientReady = false;
  statusMsg = "Disconnected: " + reason;
});

client.initialize();

app.get("/", (req, res) => {
  if (clientReady) {
    res.send("<h1>Bot is connected and running!</h1><p>Status: " + statusMsg + "</p>");
  } else if (qrCodeData) {
    res.send('<h1>Scan QR Code:</h1><img src="' + qrCodeData + '" /><p>Refresh if expired</p>');
  } else {
    res.send("<h1>Loading...</h1><p>Status: " + statusMsg + "</p><p>Refresh in 10 seconds</p>");
  }
});

app.listen(PORT, () => {
  console.log("Server listening on port " + PORT);
});
