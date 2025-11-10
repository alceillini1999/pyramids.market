const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const QRCode = require("qrcode");
const fs = require("fs");

let sock = null;
let qrString = null;
let connected = false;
let starting = false;

async function start() {
  if (starting) return;
  starting = true;

  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    syncFullHistory: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;

    if (qr) {
      qrString = qr;
      console.log("\n🔷 Scan this QR to connect WhatsApp:");
      QRCode.toString(qr, { type: "terminal", small: true }, (err, code) => {
        if (!err) console.log(code);
      });
    }

    if (connection === "open") {
      console.log("✅ WhatsApp connected successfully!");
      qrString = null;
      connected = true;
    }

    if (connection === "close") {
      connected = false;
      qrString = null;
      console.log("❌ Connection closed, restarting in 5s...");
      setTimeout(() => start(), 5000);
    }
  });

  starting = false;
}

async function getStatus() {
  return { connected, hasQR: !!qrString };
}

async function getQrDataUrl() {
  if (!qrString) return null;
  return await QRCode.toDataURL(qrString);
}

// ← إضافة بسيطة: إرجاع النص الخام للـQR ليتوافق مع الواجهة
function getQrString(){
  return qrString || null;
}

module.exports = { start, getStatus, getQrDataUrl, getQrString };
