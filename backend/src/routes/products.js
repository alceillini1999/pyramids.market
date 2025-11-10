const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

const axios = require('axios');
const csvtojson = require('csvtojson');

// ===== Helpers =====
const num = (x, def = 0) => {
  const n = Number(String(x).toString().replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : def;
};
const canon = (s = '') => String(s).toLowerCase().replace(/\s+/g, '').trim();

// ========= CRUD =========
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ updatedAt: -1 }).lean();
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const p = new Product(req.body);
    await p.save();
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const del = await Product.findByIdAndDelete(req.params.id).lean();
    if (!del) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ========= Import from Excel (JSON payload from frontend) =========
router.post('/import/excel', async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : null;
    if (!items) return res.status(400).json({ error: 'Body must be { items: [...] }' });

    let upserted = 0;
    for (const r of items) {
      const name = String(r.name || '').trim();
      const barcode = String(r.barcode || '').trim();
      if (!name && !barcode) continue;

      // ——— expiry: date-only (00:00:00 UTC) ———
      let expiry = null;
      if (r.expiry) {
        const parsed = new Date(String(r.expiry));
        if (!isNaN(parsed.getTime())) {
          parsed.setUTCHours(0, 0, 0, 0);
          expiry = parsed;
        }
      }

      const update = {
        name,
        barcode: barcode || undefined,
        salePrice: num(r.salePrice, 0),
        costPrice: num(r.cost ?? r.costPrice, 0),
        quantity: num(r.quantity ?? r.qty ?? r.stock, 0),
        category: r.category || '',
        expiry,
        updatedAt: new Date(),
      };

      const where = barcode ? { barcode } : { name };
      const resMongo = await Product.updateOne(
        where,
        { $set: update, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      if (resMongo.upsertedCount || resMongo.modifiedCount) upserted++;
    }

    res.json({ ok: true, upserted, count: items.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========= Google CSV Sync (Mirror) =========
// POST /api/products/sync/google-csv?mode=mirror
// - GSHEET_CSV_URL: رابط CSV العام (مثل الذي أرسلته).
router.post('/sync/google-csv', async (req, res) => {
  try {
    const url = process.env.GSHEET_CSV_URL;
    if (!url) return res.status(400).json({ error: 'Missing GSHEET_CSV_URL' });

    const mode = String(req.query.mode || 'mirror').toLowerCase(); // mirror | upsert
    const { data: csv } = await axios.get(url);
    const rows = await csvtojson().fromString(csv);

    // تطبيع رؤوس الأعمدة + تحويل القيم
    const normalize = (r) => {
      const m = Object.fromEntries(Object.keys(r).map((k) => [canon(k), r[k]]));

      const name = (m['name'] || m['product'] || m['productname'] || '').toString().trim();
      const barcode = (m['barcode'] || m['code'] || m['sku'] || '').toString().trim();
      const sale = m['saleprice'] || m['price'] || m['sellingprice'] || m['unitprice'];
      const cost = m['cost'] || m['costprice'] || m['purchaseprice'] || m['buyprice'];
      const qty = m['quantity'] || m['qty'] || m['stock'];
      const category = m['category'] || m['cat'];

      // ===== Expiry: يدعم DD/MM/YYYY أو DD-MM-YYYY ويُخزَّن كتاريخ فقط (00:00:00 UTC)
      let expiryRaw = m['expiry'] || m['expirydate'] || m['exp'] || '';
      let expiry = null;
      if (expiryRaw) {
        let s = String(expiryRaw).trim().replace(/-/g, '/'); // وحّد الفاصل
        const parts = s.split('/');
        let parsed = null;
        if (parts.length === 3) {
          const [d, mth, y] = parts;
          const iso = `${y}-${String(mth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          parsed = new Date(iso);
        } else {
          parsed = new Date(s);
        }
        if (!isNaN(parsed?.getTime())) {
          parsed.setUTCHours(0, 0, 0, 0); // <-- إزالة الوقت
          expiry = parsed;
        }
      }

      // مفتاح المقارنة للشيت (لا نكتبه في الـDB)
      const key = barcode || name;

      return {
        key,
        name,
        barcode: barcode || undefined,
        salePrice: num(sale, 0),
        costPrice: num(cost, 0),
        quantity: num(qty, 0),
        category: category || '',
        expiry, // تاريخ فقط
      };
    };

    const normalized = rows.map(normalize).filter((x) => x.key);

    // 1) Upsert الكل
    for (const n of normalized) {
      const { key, ...doc } = n; // لا تُدخل key في الـDB
      const where = doc.barcode ? { barcode: doc.barcode } : { name: doc.name };
      await Product.updateOne(
        where,
        { $set: { ...doc, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
    }

    // 2) حذف العناصر غير الموجودة في الشيت (mirror)
    let deleted = 0;
    if (mode === 'mirror') {
      const keysInSheet = new Set(normalized.map((n) => n.key));
      const all = await Product.find({}, { _id: 1, name: 1, barcode: 1 }).lean();
      const toDelete = all.filter((p) => {
        const key = (p.barcode && p.barcode.trim()) || (p.name && p.name.trim());
        return key && !keysInSheet.has(key);
      });
      if (toDelete.length) {
        await Product.deleteMany({ _id: { $in: toDelete.map((x) => x._id) } });
        deleted = toDelete.length;
      }
    }

    const finalCount = await Product.countDocuments();
    res.json({ ok: true, mode, upserted: normalized.length, deleted, total: finalCount });
  } catch (e) {
    console.error('Google Sheet Sync Error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
