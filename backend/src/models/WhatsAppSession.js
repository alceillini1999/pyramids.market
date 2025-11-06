const mongoose = require('mongoose');

const WhatsAppSessionSchema = new mongoose.Schema({
  name: { type: String, default: 'default' },
  data: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WhatsAppSession', WhatsAppSessionSchema);
