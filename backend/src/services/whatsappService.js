// backend/src/services/whatsappService.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const WhatsAppLog = require('../models/WhatsAppLog');
const ClientModel = require('../models/Client');

let clientInstance = null;
let latestQR = null;
let connected = false;
let initialized = false;

function createClientInstance() {
  const puppeteerOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    puppeteerOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-session'
    }),
    puppeteer: puppeteerOpts
  });

  client.on('qr', async (qr) => {
    try {
      latestQR = await qrcode.toDataURL(qr);
    } catch (err) {
      latestQR = null;
      console.warn('QR to dataURL failed', err && err.message);
    }
    console.log('WhatsApp QR received');
  });

  client.on('ready', () => {
    connected = true;
    console.log('WhatsApp client ready');
  });

  client.on('authenticated', () => {
    connected = true;
    console.log('WhatsApp authenticated');
  });

  client.on('auth_failure', msg => {
    connected = false;
    console.error('WhatsApp auth failure', msg);
  });

  client.on('disconnected', (reason) => {
    connected = false;
    console.log('WhatsApp disconnected', reason);
    // try to reinitialize later
    setTimeout(async () => {
      try { await client.initialize(); }
      catch (e) { console.warn('reinit failed', e && e.message); }
    }, 5000);
  });

  return client;
}

async function init() {
  if (initialized) return;
  if (process.env.SKIP_WHATSAPP_INIT === 'true') {
    console.log('SKIP_WHATSAPP_INIT set — skipping whatsapp init.');
    initialized = true;
    return;
  }

  try {
    clientInstance = createClientInstance();
    await clientInstance.initialize();
    initialized = true;
    console.log('WhatsApp service initialized.');
  } catch (err) {
    // Do NOT throw — only log and allow server to continue running
    console.error('WhatsApp init error', err && err.message ? err.message : err);
    // keep latestQR as-is (could be null)
    initialized = false;
  }
}

function getStatus() {
  return { connected, hasQR: !!latestQR };
}

async function getQRCode() {
  return latestQR;
}

async function sendMessage(phone, text, attachments=[]) {
  if (!clientInstance) {
    return { ok:false, error: 'WhatsApp client not initialized' };
  }
  const normalized = phone.replace(/\D/g,'');
  const id = normalized + "@c.us";
  try {
    const log = new WhatsAppLog({ phone: normalized, messageText: text, attachments, status:'pending' });
    await log.save();

    if (attachments && attachments.length) {
      const { MessageMedia } = require('whatsapp-web.js');
      for (const url of attachments) {
        try {
          const media = await MessageMedia.fromUrl(url);
          await clientInstance.sendMessage(id, media, { caption: text });
        } catch (err) { console.warn('media send failed', err && err.message); }
      }
    } else {
      await clientInstance.sendMessage(id, text);
    }

    log.status = 'sent';
    log.sentAt = new Date();
    await log.save();
    return { ok:true };
  } catch (err) {
    const log = new WhatsAppLog({ phone: phone, messageText: text, attachments, status:'failed' });
    await log.save();
    return { ok:false, error: err && err.message ? err.message : 'send failed' };
  }
}

async function sendBulk(clientIds = [], text='', attachments = [], progressCb = null) {
  const results = [];
  for (let i = 0; i < clientIds.length; i++) {
    const clientId = clientIds[i];
    try {
      const client = await ClientModel.findById(clientId);
      if (!client) {
        results.push({ clientId, ok:false, error:'Client not found' });
        if (progressCb) progressCb(i+1, clientIds.length);
        continue;
      }
      const res = await sendMessage(client.phone, text, attachments);
      results.push({ clientId, phone: client.phone, res });
    } catch (err) {
      results.push({ clientId, ok:false, error: err && err.message ? err.message : 'error' });
    }
    if (progressCb) progressCb(i+1, clientIds.length);
    await new Promise(r => setTimeout(r, 500));
  }
  return results;
}

module.exports = { init, getStatus, getQRCode, sendMessage, sendBulk };
