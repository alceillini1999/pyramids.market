const express = require('express');
const router = express.Router();
const wa = require('../services/whatsappService');

// Health/Init/Status كما لديك
router.get('/', (_req, res) => res.json({ ok: true, service: 'whatsapp-web' }));
router.post('/init', async (_req, res) => { try { await wa.start(); res.json({ ok: true }); } catch (e) { res.status(500).json({ ok: false, error: String(e) }); } });
router.get('/init',  async (_req, res) => { try { await wa.start(); res.json({ ok: true }); } catch (e) { res.status(500).json({ ok: false, error: String(e) }); } });
router.get('/status', async (_req, res) => { try { res.json(await wa.getStatus()); } catch (e) { res.status(500).json({ error: String(e) }); } });

// QR
router.get('/qr', async (_req, res) => {
  try {
    const qr = wa.getQrString();
    const dataUrl = await wa.getQrDataUrl();
    if (!qr && !dataUrl) return res.status(204).end();
    res.json({ qr, dataUrl });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ⬇️ جديد: إرسال مفرد
router.post('/send', async (req, res) => {
  try {
    const { to, message, mediaUrl } = req.body || {};
    const out = await wa.sendText(to, message, mediaUrl);
    res.json(out);
  } catch (e) {
    res.status(400).json({ ok:false, error: String(e.message || e) });
  }
});

// ⬇️ جديد: إرسال متعدد
router.post('/send-bulk', async (req, res) => {
  try {
    const { to = [], message, mediaUrl } = req.body || {};
    if (!Array.isArray(to) || !to.length) throw new Error("No recipients");

    const results = [];
    for (const phone of to) {
      try {
        const r = await wa.sendText(phone, message, mediaUrl);
        results.push({ phone, ok: true, id: r.id || null });
      } catch (err) {
        results.push({ phone, ok: false, error: String(err.message || err) });
      }
    }
    res.json({ ok: true, count: results.length, results });
  } catch (e) {
    res.status(400).json({ ok:false, error: String(e.message || e) });
  }
});

module.exports = router;
