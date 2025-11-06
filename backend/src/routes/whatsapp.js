// whatsapp.js
// Integration with whatsapp-web.js that:
// - tries to load a saved session from MongoDB (preferred) or /tmp (fallback)
// - initializes whatsapp-web.js Client with proper puppeteer flags for Render
// - saves session to MongoDB and /tmp on 'authenticated' event
// - prevents duplicate initialization
//
// Environment variables used (optional):
// - WHATSAPP_SESSION_NAME  : session name key in DB (default: 'default')
// - WHATSAPP_SESSION_PATH  : path to tmp session file (default: /tmp/whatsapp-session/session.json)
// - WHATSAPP_USERDATA_DIR  : path for puppeteer userDataDir if LocalAuth used (default: /tmp/whatsapp-userdata/<name>)
// - CHROME_PATH            : optional path to Chrome executable
//
// NOTE: install dependencies: whatsapp-web.js, puppeteer (or puppeteer-core + chrome), mongoose already used
// Example: npm i whatsapp-web.js puppeteer

const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { loadSessionFromDB, saveSessionToDB } = require('./utils/session-db-utils');
const { loadSessionFromTmp, saveSessionToTmp, TMP_PATH } = require('./utils/session-tmp-utils');

let whatsappInstance = null;
let isInitializing = false;

function sleep(ms){ return new Promise(res=>setTimeout(res, ms)); }

async function initWhatsAppService(options = {}) {
  if (whatsappInstance) {
    console.log('WhatsApp service already initialized.');
    return whatsappInstance;
  }
  if (isInitializing) {
    console.log('WhatsApp init already in progress, waiting...');
    while (isInitializing) await sleep(500);
    return whatsappInstance;
  }
  isInitializing = true;

  const sessionName = options.sessionName || process.env.WHATSAPP_SESSION_NAME || 'default';
  const maxRetries = options.maxRetries ?? 3;
  let attempt = 0;
  let lastErr = null;

  // 1) Try load session from DB first, then tmp file
  let savedSession = null;
  try {
    savedSession = await loadSessionFromDB(sessionName);
  } catch (e) {
    console.warn('loadSessionFromDB failed:', e && e.message ? e.message : e);
  }
  if (!savedSession) {
    try {
      savedSession = loadSessionFromTmp();
    } catch (e) { /* ignore */ }
  }

  while(attempt < maxRetries) {
    attempt++;
    try {
      console.log(`WhatsApp init attempt ${attempt}/${maxRetries} (sessionName=${sessionName})`);

      // Prepare puppeteer options to be safe in Render's container
      const puppeteerOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--single-process',
          '--no-zygote',
          '--disable-gpu'
        ],
        dumpio: true,
        pipe: true
      };
      if (process.env.CHROME_PATH) {
        puppeteerOptions.executablePath = process.env.CHROME_PATH;
      }

      const clientOptions = {
        puppeteer: puppeteerOptions,
        takeoverOnConflict: true,
        authTimeoutMs: 30_000
      };

      // If we have a saved session from DB/tmp and it matches whatsapp-web.js shape, restore it
      if (savedSession && savedSession.clientSession) {
        clientOptions.session = savedSession.clientSession;
        console.log('Restoring WhatsApp session from storage (DB/tmp).');
      } else {
        // No saved session: use LocalAuth with ephemeral userDataDir under /tmp to reduce QR regen during single runtime.
        // LocalAuth stores files on disk (needs persistent disk to survive deploys). We keep it under /tmp to avoid paid disk requirement.
        const userDataDir = process.env.WHATSAPP_USERDATA_DIR || `/tmp/whatsapp-userdata-${sessionName}`;
        clientOptions.authStrategy = new LocalAuth({ clientId: sessionName, dataPath: userDataDir });
        console.log('No saved session found — using LocalAuth (ephemeral userDataDir):', userDataDir);
      }

      // Create the client
      const client = new Client(clientOptions);

      // Attach listeners
      client.on('qr', (qr) => {
        // Note: whatsapp-web.js may emit many qr events; we log it once per event.
        console.log('WhatsApp QR received');
      });

      client.on('authenticated', async (session) => {
        try {
          console.log('WhatsApp authenticated - saving session');
          // Wrap session into object for our DB schema
          const payload = { clientSession: session };
          await saveSessionToDB(payload, sessionName);
          saveSessionToTmp(payload);
        } catch (err) {
          console.error('Error saving WhatsApp session:', err && err.message ? err.message : err);
        }
      });

      client.on('auth_failure', (err) => {
        console.error('WhatsApp auth failure', err && err.message ? err.message : err);
        // Optionally remove saved session document to force fresh login next time
      });

      client.on('ready', () => {
        console.log('WhatsApp service initialized.');
      });

      client.on('disconnected', (reason) => {
        console.warn('WhatsApp client disconnected:', reason);
        // Mark instance null so init can try restart
        whatsappInstance = null;
        // Try restart after short delay
        setTimeout(() => initWhatsAppService({ sessionName, maxRetries }), 2000);
      });

      await client.initialize();
      whatsappInstance = { client };
      isInitializing = false;
      return whatsappInstance;

    } catch (err) {
      lastErr = err;
      console.error('WhatsApp init error:', err && err.message ? err.message : err);
      const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000);
      console.log(`Waiting ${backoffMs}ms before next attempt...`);
      await sleep(backoffMs);
    }
  }

  isInitializing = false;
  console.error('Failed to initialize WhatsApp service after attempts:', maxRetries, 'last error:', lastErr && lastErr.message);
  throw lastErr;
}

module.exports = { initWhatsAppService, getWhatsAppInstance: () => whatsappInstance };
