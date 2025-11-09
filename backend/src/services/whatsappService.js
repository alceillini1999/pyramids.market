// backend/src/services/whatsappService.js
const QRCode = require('qrcode');
const axios = require('axios');
const {
  default: makeWASocket,
  fetchLatestBaileysVersion,
  Browsers,
  jidNormalizedUser
} = require('@whiskeysockets/baileys');
const { useMongoAuthState, clearAuth } = require('./mongoAuthState');

let sock = null;
let qrString = null;
let connected = false;
let initPromise = null;

// المتصفحات البديلة لتفادي الخطأ 515
const BROWSERS = [
  ['Ubuntu', 'Chrome', '122.0.0'],
  ['Ubuntu', 'Edge', '120.0.0'],
  ['Ubuntu', 'Firefox', '119.0.1']
];
let strategyIndex = 0;

async function _startWithStrategy(index) {
  const auth = await useMongoAuthState();
  const { state, saveCreds, _replaceCredsRef } = auth;
  const { version } = await fetchLatestBaileysVersion();

  const browserTuple = BROWSERS[index % BROWSERS.length];
  console.log('🚀 Initializing WhatsApp connection with browser:', browserTuple.join(' / '));

  const instance = makeWASocket({
    version,
    auth: state,
    browser: Browsers.appropriate(browserTuple.join(' / ')),
    syncFullHistory: false,
  });

  // حفظ التحديثات على بيانات الجلسة
  instance.ev.on('creds.update', async (newCreds) => {
    _replaceCredsRef(newCreds);
    await saveCreds();
  });

  // ✅ التعامل مع QR عبر الحدث الرسمي
  instance.ev.on('connection.update', async (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      qrString = qr;
      connected = false;
      console.log('\n🟢 New WhatsApp QR generated — scan it quickly:\n');
      QRCode.toString(qr, { type: 'terminal', small: true }, (err, url) => {
        if (!err) console.log(url);
      });
    }

    if (connection === 'open') {
      connected = true;
      qrString = null;
      console.log('✅ WhatsApp connected successfully!');
    } else if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      connected = false;
      qrString = null;
      console.log('❌ WhatsApp closed with code', code);

      if (code === 515) {
        strategyIndex = (strategyIndex + 1) % BROWSERS.length;
        console.log('🔁 Retrying with next browser strategy...');
        setTimeout(() => start(true), 4000);
      } else if (code !== 401) {
        setTimeout(() => start(false), 5000);
      } else {
        console.log('🧹 Session expired, clearing...');
        await clearAuth();
      }
    }
  });

  return instance;
}

async function start(forceFresh = false) {
  if (forceFresh) {
    initPromise = null;
    sock = null;
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      sock = await _startWithStrategy(strategyIndex);
    } catch (e) {
      console.error('Start error:', e);
      strategyIndex = (strategyIndex + 1) % BROWSERS.length;
      sock = await _startWithStrategy(strategyIndex);
    }
    return sock;
  })();

  return initPromise;
}

async function getStatus() {
  return { connected, hasQR: !!qrString };
}

async function getQrDataUrl() {
  if (!qrString) return null;
  return await QRCode.toDataURL(qrString);
}

function normalizeMsisdn(raw) {
  const r = String(raw || '').replace(/[^\d]/g, '');
  if (!r) return null;
  if (r.startsWith('00')) return r.slice(2);
  return r;
}

async function sendBulk({ to = [], message = '', mediaUrl = '' }) {
  await start();
  const results = [];
  for (const raw of to) {
    try {
      const msisdn = normalizeMsisdn(raw);
      if (!msisdn) throw new Error('invalid number');
      const jid = jidNormalizedUser(msisdn + '@s.whatsapp.net');

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

async function requestPairingCode(phoneE164) {
  await start();
  if (!sock || !sock.requestPairingCode) {
    throw new Error('Pairing code not supported by this Baileys version/account');
  }
  const p = String(phoneE164 || '').replace(/[^\d]/g, '');
  if (!p) throw new Error('Invalid phone');
  const code = await sock.requestPairingCode(p);
  return code;
}

async function resetSession() {
  await clearAuth();
  connected = false;
  qrString = null;
  sock = null;
  await start(true);
}

module.exports = {
  start,
  init: start,
  getStatus,
  getQrDataUrl,
  sendBulk,
  requestPairingCode,
  resetSession,
  SESSION_DIR: 'MONGODB'
};
