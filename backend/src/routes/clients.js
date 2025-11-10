const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const axios = require('axios');
const csvtojson = require('csvtojson');

const upload = multer({ dest: 'uploads/' });

const Client = require('../models/Client');
const { listClients, createClient, updateClient, deleteClient, bulkUpsert } = require('../controllers/clientsController');

// ===== Helpers
const canon = s => String(s||'').toLowerCase().trim();
const onlyDigits = s => String(s||'').replace(/[^0-9]/g,'');
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

// ===== Existing routes (keep)
router.get('/', listClients);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

// Excel upload -> bulkUpsert (keep)
router.post('/import/excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const filePath = path.resolve(req.file.path);
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const items = rows.map(r => ({
      name: r.name || r.Name || "",
      phone: String(r.phone || r.Phone || ""),
      countryCode: onlyDigits(r.countryCode || r.CountryCode || r.CC || ""),
      area: r.area || r.Area || "",
      notes: r.notes || r.Notes || "",
      tags: r.tags || r.Tags || "",
      lastMessageAt: r.lastMessageAt || r['Last Message At'] || "",
      lastPurchaseAt: r.lastPurchaseAt || r['Last Purchase At'] || "",
    }));

    req.body.items = items;
    await bulkUpsert(req, res);
    fs.unlink(filePath, () => {});
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Excel import failed', error: e.message });
  }
});

// Excel export (keep)
router.get('/export/excel', async (req, res) => {
  try {
    const clients = await Client.find().lean().limit(50000);
    const header = ['name','phone','countryCode','area','notes','tags','lastMessageAt','lastPurchaseAt'];
    const data = [header];
    for (const c of clients) {
      data.push([
        c.name || '',
        c.phone || '',
        c.countryCode || '',
        c.area || '',
        c.notes || '',
        (c.tags || []).join('|'),
        c.lastMessageAt ? new Date(c.lastMessageAt).toISOString().slice(0,10) : '',
        c.lastPurchaseAt ? new Date(c.lastPurchaseAt).toISOString().slice(0,10) : '',
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="clients.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Excel export failed' });
  }
});

// JSON bulk upsert (keep)
router.post('/bulk-upsert', bulkUpsert);

// ======= Google CSV Mirror Sync =======
router.post('/sync/google-csv', async (req, res) => {
  try {
    const url = process.env.GSHEET_CLIENTS_CSV_URL;
    if (!url) return res.status(400).json({ error: 'Missing GSHEET_CLIENTS_CSV_URL' });
    const mode = String(req.query.mode || 'mirror').toLowerCase();

    const { data: csv } = await axios.get(url);
    const rows = await csvtojson().fromString(csv);

    const normalize = (r) => {
      const m = {};
      for (const k of Object.keys(r)) m[canon(k)] = r[k];

      const name  = String(m['name'] || m['client'] || m['customer'] || '').trim();
      const phone = onlyDigits(m['phone'] || m['mobile'] || m['msisdn'] || m['tel'] || '');
      const cc    = onlyDigits(m['countrycode'] || m['cc'] || '');
      const area  = m['area'] || '';
      const notes = m['notes'] || '';
      const tags  = (m['tags'] || '').toString().split(/[|,;]/).map(s=>s.trim()).filter(Boolean);
      const orders = num(m['orders'] || m['ordercount'] || m['totalorders'], 0);
      const lastOrder = toDateOnly(m['lastorder'] || m['last order'] || m['lastorderdate'] || '');
      const lastMessageAt = toDateOnly(m['lastmessageat'] || m['last message at'] || '');
      const points = num(m['points'] || m['loyalty'] || m['score'], 0);

      const key = phone || name;
      return { key, name, phone, countryCode: cc, area, notes, tags, orders, lastOrder, lastMessageAt, points };
    };

    const normalized = rows.map(normalize).filter(x => x.key);

    // Upsert
    for (const n of normalized) {
      const { key, ...doc } = n;
      const where = doc.phone ? { phone: doc.phone } : { name: doc.name };
      await Client.updateOne(
        where,
        { $set: { ...doc }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
    }

    // Mirror delete
    let deleted = 0;
    if (mode === 'mirror') {
      const keys = new Set(normalized.map(n => n.key));
      const all = await Client.find({}, { _id:1, name:1, phone:1 }).lean();
      const toDel = all.filter(c => {
        const key = (onlyDigits(c.phone)||'') || (c.name||'').trim();
        return key && !keys.has(key);
      });
      if (toDel.length) {
        await Client.deleteMany({ _id: { $in: toDel.map(x=>x._id) } });
        deleted = toDel.length;
      }
    }

    const total = await Client.countDocuments();
    res.json({ ok:true, mode, upserted: normalized.length, deleted, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
