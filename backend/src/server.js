require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// simple health
app.get('/api/healthz', (req, res) => res.json({ status: 'ok', name:'pyramids-mart-backend' }));

// mount routers (skeleton) - require later to avoid crash if DB not ready
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/products', require('./routes/products'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Error handlers to catch synchronous and async errors and log them
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION ➜', err && err.stack ? err.stack : err);
  // Do not exit immediately; log and let Render restart if needed
});
process.on('unhandledRejection', (reason, p) => {
  console.error('UNHANDLED REJECTION at Promise', p, 'reason:', reason);
});

// connect to mongo
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/pyramidsmart';
mongoose.connect(MONGO, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // wait up to 30s to find server
  socketTimeoutMS: 45000           // close sockets after 45s of inactivity
})
  .then(()=>{
    console.log('Mongo connected');
    // Once connected, ensure admin exists
    ensureAdmin().catch(e => console.error('ensureAdmin failed:', e && e.message ? e.message : e));
  })
  .catch(err=>{
    console.error('Mongo connection error:', err && err.message ? err.message : err);
  });

// create initial admin user if ADMIN_EMAIL and ADMIN_PASSWORD are set
const User = require('./models/User');
const bcrypt = require('bcryptjs');
async function ensureAdmin(){
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPass) {
    console.log('ADMIN_EMAIL or ADMIN_PASSWORD not provided — skipping admin bootstrap.');
    return;
  }
  try {
    const exists = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!exists) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(adminPass, salt);
      const u = new User({ name: 'Owner', email: adminEmail.toLowerCase(), passwordHash: hash, role: 'owner' });
      await u.save();
      console.log('Created initial admin user:', adminEmail);
    } else {
      console.log('Admin user already exists.');
    }
  } catch (err) {
    console.error('Admin creation error', err && err.message ? err.message : err);
  }
}

// Start server and bind to the Render-provided port (process.env.PORT)
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
app.listen(PORT, () => {
  console.log(`Server started and listening on port ${PORT}`);
  console.log('NODE_ENV=', process.env.NODE_ENV || 'development');
  
  // تمّت إضافة جزء تهيئة واتساب بعد التشغيل
  setTimeout(async () => {
    try {
      const whatsappService = require('./services/whatsappService');
      await whatsappService.init();
      console.log('WhatsApp init attempted.');
    } catch (err) {
      console.error('WhatsApp init error:', err && err.message ? err.message : err);
    }
  }, 2000);
});