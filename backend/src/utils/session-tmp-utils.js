const fs = require('fs');
const path = require('path');

const TMP_PATH = process.env.WHATSAPP_SESSION_PATH || '/tmp/whatsapp-session/session.json';

function saveSessionToTmp(sessionObj) {
  try {
    const dir = path.dirname(TMP_PATH);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TMP_PATH, JSON.stringify(sessionObj));
    console.log('Saved WhatsApp session to /tmp');
  } catch (e) { console.error('Failed saving session to tmp:', e && e.message ? e.message : e); }
}

function loadSessionFromTmp() {
  try {
    if (fs.existsSync(TMP_PATH)) {
      const txt = fs.readFileSync(TMP_PATH, 'utf8');
      return JSON.parse(txt);
    }
    return null;
  } catch (e) { console.error('Failed loading tmp session:', e && e.message ? e.message : e); return null; }
}

module.exports = { saveSessionToTmp, loadSessionFromTmp, TMP_PATH };
