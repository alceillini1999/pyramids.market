// backend/src/services/whatsappService.js
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const axios = require('axios');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

let sock = null;
let qrString = null;
let connected = false;
let initPromise = null;

// مسار حفظ الجلسة (يبقى بين إعادة التشغيل، لكنه يُمسح عند نشر نسخة جديدة)
const SESSION_DIR =
  process.env.WHATSAPP_SESSION_PATH ||
  path.join(__dirname, '../../..', 'whatsapp-session');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function start() {
  if (initPromise) return initPromise;
  ensureDir(SESSION_DIR);

  initPromise = (async () => {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        qrString = qr;
        connected = false;
      }
      if (connection === 'open') {
        connected = true;
        qrString = null;
        console.log('✅ WhatsApp connected');
      } else if (connection === 'close') {
        connected = false;
        qrString = null;
        const code = lastDisconnect?.error?.output?.statusCode;
        console.log('❌ WhatsApp closed', code);
        setTimeout(() => start(), 3000);
      }
    });
  })();

  return initPromise;
}

async function getStatus() {
  await start();
  return { connected, hasQR: !!qrString };
}

async function getQrDataUrl() {
  await start();
  if (!qrString) return null;
  return await QRCode.toDataURL(qrString);
}

async function sendBulk({ to = [], message, mediaUrl }) {
  await start();
  if (!connected) throw new Error('WhatsApp not connected');
  if (!Array.isArray(to) || to.length === 0) throw new Error('to must be an array');

  const results = [];
  for (const raw of to) {
    const phone = String(raw).replace(/\s+/g, '').replace(/^\+/, '');
    const jid = `${phone}@s.whatsapp.net`;
    try {
      if (mediaUrl) {
        const { data } = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        await sock.sendMessage(jid, { image: Buffer.from(data), caption: message || '' });
      } else {
        await sock.sendMessage(jid, { text: message });
      }
      results.push({ to: raw, ok: true });
    } catch (e) {
      results.push({ to: raw, ok: false, error: String(e) });
    }
  }
  return results;
}

async function resetSession() {
  try {
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    }
  } catch {}
  initPromise = null;
  sock = null;
  qrString = null;
  connected = false;
  await start();
}

module.exports = {
  start,
  getStatus,
  getQrDataUrl,
  sendBulk,
  resetSession,
  SESSION_DIR
};
