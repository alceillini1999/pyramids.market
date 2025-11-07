const Client = require('../models/Client');

async function listClients(req, res) {
  const { search, area, tag, page = 1, limit = 50 } = req.query;
  const query = {};
  if (search) query.name = { $regex: search, $options: 'i' };
  if (area) query.area = area;
  if (tag) query.tags = tag;
  const skip = (parseInt(page)-1) * parseInt(limit);
  const clients = await Client.find(query).sort({createdAt:-1}).skip(skip).limit(parseInt(limit));
  const total = await Client.countDocuments(query);
  res.json({ data: clients, total });
}

async function getClient(req, res) {
  const c = await Client.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Client not found' });
  res.json(c);
}

async function createClient(req, res) {
  const payload = req.body;
  try {
    const c = new Client(payload);
    await c.save();
    res.status(201).json(c);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
}

async function updateClient(req, res) {
  try {
    const c = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(c);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Update failed' });
  }
}

async function deleteClient(req, res) {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ ok:true });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
}

module.exports = { listClients, getClient, createClient, updateClient, deleteClient };
