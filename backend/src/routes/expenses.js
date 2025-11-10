const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auth = require('../middlewares/auth');

const axios = require('axios');
const csvtojson = require('csvtojson');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req,file,cb)=> cb(null, uploadsDir),
  filename: (_req,file,cb)=>{
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `receipt_${Date.now()}${ext || '.png'}`);
  }
});
const upload = multer({ storage });

// ===== Helpers
const canon = s => String(s||'').toLowerCase().trim();
const num = (x, def=0) => {
  const n = Number(String(x||'').replace(/[, ]/g,''));
  return Number.isFinite(n) ? n : def;
};
const toDateOnly = v => {
  if (!v) return null;
  let s = String(v).trim().replace(/-/g,'/');
  const p = s.split('/');
  let d = null;
  if (p.length === 3) {
    const [dd, mm, yy] = p; d = new Date(`${yy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`);
  } else {
    d = new Date(s);
  }
  if (isNaN(d?.getTime())) return null;
  d.setUTCHours(0,0,0,0);
  return d;
};
const makeKey = (name, dateOnly, amount) => `${canon(name)}|${dateOnly?.toISOString()?.slice(0,10)||''}|${num(amount,0)}`;

// ===== List
router.get('/', async (req, res) => {
  try {
    const items = await Expense.find().sort({date:-1}).limit(10000).lean();
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== Create single
router.post('/', async (req, res) => {
  try {
    const e = new Expense(req.body);
    await e.save();
    res.status(201).json(e);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===== Bulk upsert for Excel JSON import (keep)
router.post('/bulk-upsert', async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.json({ ok: true, upserted: 0 });

    const ops = [];
    for (const it of items) {
      const doc = {
        name: it.name || "",
        category: it.category || "",
        amount: Number(it.amount || 0),
        date: it.date ? toDateOnly(it.date) : toDateOnly(new Date()),
        notes: it.notes || "",
      };
      if (it._id) {
        ops.push({ updateOne: { filter: { _id: it._id }, update: { $set: doc }, upsert: true } });
      } else {
        ops.push({ updateOne: { filter: { name: doc.name, date: doc.date, amount: doc.amount }, update: { $set: doc }, upsert: true } });
      }
    }

    const result = await Expense.bulkWrite(ops, { ordered: false });
    res.json({
      ok: true,
      matched: result.matchedCount ?? 0,
      modified: result.modifiedCount ?? 0,
      upserted: result.upsertedCount ?? 0,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ===== Upload receipt (keep)
router.post('/:id/receipt', auth, upload.single('file'), async (req,res)=>{
  try {
    if (!req.file) return res.status(400).json({ message:'No file' });
    const fileUrl = `/uploads/${req.file.filename}`;
    await Expense.findByIdAndUpdate(req.params.id, { receiptUrl: fileUrl });
    res.json({ ok:true, receiptUrl: fileUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== NEW: Google CSV Mirror Sync
router.post('/sync/google-csv', async (req, res) => {
  try {
    const url = process.env.GSHEET_EXPENSES_CSV_URL;
    if (!url) return res.status(400).json({ error: 'Missing GSHEET_EXPENSES_CSV_URL' });
    const mode = String(req.query.mode || 'mirror').toLowerCase();

    const { data: csv } = await axios.get(url);
    const rows = await csvtojson().fromString(csv);

    const normalize = (r) => {
      const m = {};
      for (const k of Object.keys(r)) m[canon(k)] = r[k];
      const name = (m['name'] || m['expense'] || '').toString().trim();
      const date = toDateOnly(m['date'] || m['txdate'] || m['expensedate'] || '');
      const amount = num(m['amount'] || m['value'] || m['cost'], 0);
      const category = (m['category'] || m['type'] || m['kind'] || '').toString().trim();
      const notes = (m['notes'] || m['note'] || m['description'] || m['details'] || '').toString().trim();
      const key = makeKey(name, date, amount);
      return { key, name, date, amount, category, notes };
    };

    const normalized = rows.map(normalize).filter(x => x.key);
    // Upsert
    for (const n of normalized) {
      const { key, ...doc } = n;
      await Expense.updateOne(
        { name: doc.name, date: doc.date, amount: doc.amount },
        { $set: doc, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
    }

    // Mirror delete
    let deleted = 0;
    if (mode === 'mirror') {
      const keys = new Set(normalized.map(n => n.key));
      const all = await Expense.find({}, { _id:1, name:1, date:1, amount:1 }).lean();
      const toDel = all.filter(e => !keys.has(makeKey(e.name, toDateOnly(e.date), e.amount)));
      if (toDel.length) {
        await Expense.deleteMany({ _id: { $in: toDel.map(x=>x._id) } });
        deleted = toDel.length;
      }
    }

    const total = await Expense.countDocuments();
    res.json({ ok:true, mode, upserted: normalized.length, deleted, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
