const WhatsAppSession = require('../models/WhatsAppSession');

async function saveSessionToDB(sessionObj, name='default') {
  try {
    const filter = { name };
    const update = { data: sessionObj, updatedAt: new Date() };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    await WhatsAppSession.findOneAndUpdate(filter, update, opts);
    console.log('Saved WhatsApp session to MongoDB');
  } catch (err) {
    console.error('Failed to save WA session to DB:', err && err.message ? err.message : err);
  }
}

async function loadSessionFromDB(name='default') {
  try {
    const doc = await WhatsAppSession.findOne({ name });
    if (doc && doc.data) {
      console.log('Loaded WhatsApp session from MongoDB');
      return doc.data;
    }
    return null;
  } catch (err) {
    console.error('Failed to load WA session from DB:', err && err.message ? err.message : err);
    return null;
  }
}

module.exports = { saveSessionToDB, loadSessionFromDB };
