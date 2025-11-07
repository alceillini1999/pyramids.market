const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csvtojson');
const { parse } = require('fast-csv');
const fs = require('fs');
const path = require('path');
const upload = multer({ dest: 'uploads/' });

const Client = require('../models/Client');
const { listClients, getClient, createClient, updateClient, deleteClient } = require('../controllers/clientsController');

// CRUD
router.get('/', listClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

// Import CSV: accepts file field 'file' (CSV with headers: name,phone,area,notes,tags)
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const filePath = path.resolve(req.file.path);
    const jsonArray = await csv().fromFile(filePath);
    const created = [];
    for (const row of jsonArray) {
      // normalize row fields
      const name = row.name || row.Name || row.NAME;
      const phone = row.phone || row.Phone || row.PHONE;
      if (!name || !phone) continue;
      const area = row.area || row.Area || '';
      const notes = row.notes || row.Notes || '';
      const tagsRaw = row.tags || row.Tags || '';
      const tags = tagsRaw ? tagsRaw.split('|').map(t=>t.trim()) : [];
      try {
        const c = new Client({ name, phone, area, notes, tags });
        await c.save();
        created.push(c);
      } catch (err) {
        // skip duplicates or errors
        console.warn('skip', err.message);
      }
    }
    // remove uploaded file
    fs.unlinkSync(filePath);
    res.json({ created: created.length, data: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Import failed', error: err.message });
  }
});

// Export CSV
router.get('/export/csv', async (req, res) => {
  try {
    const clients = await Client.find().lean().limit(10000);
    res.setHeader('Content-disposition', 'attachment; filename=clients.csv');
    res.setHeader('Content-Type', 'text/csv');
    const csvStream = parse({ headers: true });
    csvStream.pipe(res);
    csvStream.write(['name','phone','area','notes','tags']);
    for (const c of clients) {
      csvStream.write({ name: c.name, phone: c.phone, area: c.area || '', notes: c.notes || '', tags: (c.tags||[]).join('|') });
    }
    csvStream.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Export failed' });
  }
});

module.exports = router;
