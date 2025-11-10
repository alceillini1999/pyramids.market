// backend/src/routes/sales.js
const router = require('express').Router();
const Sale = require('../models/Sale');
const axios = require('axios');
const csvtojson = require('csvtojson');

// ========== Helpers ==========
const canon = (s) => String(s || '').toLowerCase().trim();
const num = (x, def = 0) => {
  const n = Number(String(x ?? '').replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : def;
};
// تاريخ فقط (00:00 UTC)
function toDateOnly(v) {
  if (!v) return null;
  const s = String(v).trim();
  const p = s.split('/');
  let d;
  if (p.length === 3) {
    const [dd, mm, yy] = p;
    d = new Date(`${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`);
  } else {
    d = new Date(s);
  }
  if (isNaN(d.getTime())) return null;
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
const makeKey = (inv, clientName, dateOnly, total) =>
  (inv || '') || `${canon(clientName)}|${dateOnly?.toISOString()?.slice(0, 10) || ''}|${num(total, 0)}`;

// ========== List (paged + search) ==========
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
    const q = String(req.query.q || '').trim();
    const filter = q
      ? { $or: [{ invoiceNumber: new RegExp(q, 'i') }, { clientName: new RegExp(q, 'i') }] }
      : {};
    const [rows, count] = await Promise.all([
      Sale.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Sale.countDocuments(filter),
    ]);
    res.json({ rows, count, page, limit });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== Details ==========
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).lean();
    if (!sale) return res.status(404).json({ message: 'Not found' });
    res.json(sale);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ========== Google CSV Sync (Mirror) ==========
// POST /api/sales/sync/google-csv?mode=mirror
router.post('/sync/google-csv', async (req, res) => {
  try {
    const url = process.env.GSHEET_SALES_CSV_URL;
    if (!url) return res.status(400).json({ error: 'Missing GSHEET_SALES_CSV_URL' });
    const mode = String(req.query.mode || 'mirror').toLowerCase();

    // 1) اقرأ CSV
    const { data: csv } = await axios.get(url);
    const rows = await csvtojson().fromString(csv);

    // 2) طَبِّع الرؤوس
    const normalize = (r) => {
      const m = {};
      for (const k of Object.keys(r)) m[canon(k)] = r[k];

      const invoiceNumber = (m['invoicenumber'] || m['invoice'] || '').toString().trim();
      const clientName = (m['clientname'] || m['client'] || m['customer'] || '').toString().trim();
      const total = num(m['total'] || m['amount'] || m['grandtotal'], 0);
      const profit = num(m['profit'] || m['margin'] || 0, 0);
      const paymentMethod = (m['paymentmethod'] || m['payment'] || 'CASH').toString().trim().toUpperCase();

      const createdAt = toDateOnly(m['date'] || m['createdat'] || m['time'] || '');
      const key = makeKey(invoiceNumber, clientName, createdAt, total);

      return {
        key,
        invoiceNumber: invoiceNumber || undefined,
        clientName,
        total,
        profit,
        paymentMethod,
        createdAt: createdAt || new Date(),
      };
    };

    const normalized = rows.map(normalize).filter((x) => x.key);

    // 3) Upsert
    for (const n of normalized) {
      const { key, ...doc } = n;
      const where = doc.invoiceNumber
        ? { invoiceNumber: doc.invoiceNumber }
        : { clientName: doc.clientName, createdAt: doc.createdAt, total: doc.total };
      await Sale.updateOne(
        where,
        { $set: doc, $setOnInsert: { createdAt: doc.createdAt } },
        { upsert: true }
      );
    }

    // 4) Mirror delete
    let deleted = 0;
    if (mode === 'mirror') {
      const keys = new Set(normalized.map((n) => n.key));
      const all = await Sale.find({}, { _id: 1, invoiceNumber: 1, clientName: 1, createdAt: 1, total: 1 }).lean();
      const toDel = all.filter(
        (s) => !keys.has(makeKey(s.invoiceNumber, s.clientName, toDateOnly(s.createdAt), s.total))
      );
      if (toDel.length) {
        await Sale.deleteMany({ _id: { $in: toDel.map((x) => x._id) } });
        deleted = toDel.length;
      }
    }

    const totalCount = await Sale.countDocuments();
    res.json({ ok: true, mode, upserted: normalized.length, deleted, total: totalCount });
  } catch (e) {
    console.error('Sales CSV Sync Error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
