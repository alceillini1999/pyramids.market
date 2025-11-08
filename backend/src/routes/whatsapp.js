const express = require('express');
const router = express.Router();
const wa = require('../services/whatsappService');

router.post('/init', async (_req, res) => {
  try { await wa.start(); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
});

router.get('/status', async (_req, res) => {
  try { res.json(await wa.getStatus()); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get('/qr', async (_req, res) => {
  try { res.json({ dataUrl: await wa.getQrDataUrl() }); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post('/send-bulk', async (req, res) => {
  try {
    const { to, message, mediaUrl } = req.body;
    const results = await wa.sendBulk({ to, message, mediaUrl });
    res.json({ ok: true, results });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

router.post('/reset-session', async (_req, res) => {
  try { await wa.resetSession(); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
});

router.get('/debug-session-path', (_req, res) => {
  res.json({ path: wa.SESSION_DIR });
});

module.exports = router;
