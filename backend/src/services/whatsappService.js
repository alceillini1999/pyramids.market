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

// تدوير إستراتيجيات الهوية (user-agent) لتجاوز 515
const BROWSERS = [
  ['Ubuntu', 'Chrome',  '122.0.0'],
  ['Ubuntu', 'Edge',    '120.0.0'],
  ['Ubuntu', 'Firefox', '119.0.1'],
];

let strategyIndex = 0;

// مسار حفظ الجلسة
const SESSION_DIR =
  process.env.WHATSAPP_SESSION_PATH ||
  path.join(__dirname, '../../..', 'whatsapp-session');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function wipeSession() {
  try {
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    }
  } catch {}
}

async function _startWithStrategy(index) {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const browserTuple = BROWSERS[index % BROWSERS.length];

  sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: state,
    browser: browserTuple,
    connectTimeoutMs: 45_000,
    defaultQueryTimeoutMs: 60_000,
    markOnlineOnConnect: false,
    // لا نمرر legacy لتوافق جميع الإصدارات
    // syncFullHistory: false, // (افتراضيًا false في كثير من الإصدارات)
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
      console.log('✅ WhatsApp connected with browser:', browserTuple.join(' / '));
    } else if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      connected = false;
      qrString = null;
      console.log('❌ WhatsApp closed', code, 'on browser', browserTuple.join(' / '));

      // في حالة 515: بدّل الاستراتيجية وأعد المحاولة بجلسة جديدة
      if (code === 515) {
        try {
          wipeSession();
        } catch {}
        strategyIndex = (strategyIndex + 1) % BROWSERS.length;
        setTimeout(() => start(true), 4000);
      } else {
        setTimeout(() => start(false), 5000);
      }
    }
  });
}

async function start(forceFresh = false) {
  if (forceFresh) {
    initPromise = null;
    sock = null;
  }
  if (initPromise) return initPromise;
  ensureDir(SESSION_DIR);

  initPromise = (async () => {
    await _startWithStrategy(strategyIndex);
  })();

  return initPromise;
}

async function getStatus() {
  await start();
  return { connected, hasQR: !!qrString, strategy: BROWSERS[strategyIndex] };
}

async function getQrDataUrl() {
  await start();
  if (!qrString) return null;
  return await QRCode.toDataURL(qrString);
}

// إرسال جماعي (نص/صورة)
async function sendBulk({ to = [], message, mediaUrl }) {
  await start();
  if (!connected) throw new Error('WhatsApp not connected');
  if (!Array.isArray(to) || to.length === 0)
    throw new Error('to must be an array');

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
  wipeSession();
  initPromise = null;
  sock = null;
  qrString = null;
  connected = false;
  // نعيد التشغيل مع نفس الإستراتيجية الحالية
  await start(true);
}

module.exports = {
  start,
  init: start,                // alias للتوافق
  getStatus,
  getQrDataUrl,
  sendBulk,
  resetSession,
  SESSION_DIR,
};
