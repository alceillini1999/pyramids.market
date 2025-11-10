// backend/src/routes/expenses.js
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auth = require('../middlewares/auth');

// === إعداد رفع الملف (لإيصال المصروف) ===
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
// ========================================

// List
router.get('/', async (req, res) => {
  try {
    const items = await Expense.find().sort({date:-1}).limit(10000).lean();
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create single
router.post('/', async (req, res) => {
  try {
    const e = new Expense(req.body);
    await e.save();
    res.status(201).json(e);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Bulk upsert for Excel JSON import
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
        date: it.date ? new Date(it.date) : new Date(),
        notes: it.notes || "",
      };
      if (it._id) {
        ops.push({ updateOne: { filter: { _id: it._id }, update: { $set: doc }, upsert: true } });
      } else {
        // upsert by (name + day(date))
        ops.push({ updateOne: { filter: { name: doc.name, date: { $gte: new Date(new Date(doc.date).setHours(0,0,0,0)), $lte: new Date(new Date(doc.date).setHours(23,59,59,999)) } }, update: { $set: doc }, upsert: true } });
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

// === رفع إيصال المصروف (الإضافة المطلوبة) ===
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

module.exports = router;
