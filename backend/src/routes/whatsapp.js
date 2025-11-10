const express = require('express');
const router = express.Router();
const wa = require('../services/whatsappService');

// Health
router.get('/', (_req, res) => res.json({ ok: true, service: 'whatsapp-web' }));

// Init
router.post('/init', async (_req, res) => { try { await wa.start(); res.json({ ok: true }); } catch (e) { res.status(500).json({ ok: false, error: String(e) }); } });
router.get('/init',  async (_req, res) => { try { await wa.start(); res.json({ ok: true }); } catch (e) { res.status(500).json({ ok: false, error: String(e) }); } });

// Status
router.get('/status', async (_req, res) => {
  try { res.json(await wa.getStatus()); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

// QR  — يعيد كلا الشكلين لتوافق الواجهة
router.get('/qr', async (_req, res) => {
  try {
    const qr = wa.getQrString();
    const dataUrl = await wa.getQrDataUrl();
    if (!qr && !dataUrl) return res.status(204).end();
    res.json({ qr, dataUrl });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/qr-image', async (_req, res) => {
  try {
    const dataUrl = await wa.getQrDataUrl();
    if (!dataUrl) return res.status(404).send('No QR yet');
    const base64 = String(dataUrl).split(',')[1];
    const buf = Buffer.from(base64, 'base64');
    res.set('Content-Type', 'image/png');
    res.send(buf);
  } catch (e) { res.status(500).send(String(e)); }
});

// (باقي المسارات كما هي؛ لن نلمس send-bulk / pairing / reset لتفادي أي تعطل غير مطلوب)
module.exports = router;
