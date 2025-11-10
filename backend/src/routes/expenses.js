// backend/src/routes/expenses.js
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

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

    const toKey = (o) => {
      const d = o.date ? new Date(o.date) : null;
      const ds = d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString() : '';
      return `${(o.name||'').trim().toLowerCase()}|${ds}`;
    };

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

module.exports = router;
