// backend/src/server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(helmet());

// ===== CORS (ثابت ومسموح للأصول الصحيحة فقط) =====
/*
  لو حاب تغيّر قائمة الأصول المسموح بها بدون تعديل الكود،
  عيّن متغير البيئة CORS_ALLOWLIST بفواصل:
    CORS_ALLOWLIST=https://pyramids-market-site.onrender.com,http://localhost:5173
*/
const allowlist = (process.env.CORS_ALLOWLIST || 'https://pyramids-market-site.onrender.com,http://localhost:5173')
  .split(',').map(s => s.trim()).filter(Boolean);

// كي لا تختلط الاستجابات في الكاش عند تعدد Origins
app.use((req, res, next) => { res.setHeader('Vary', 'Origin'); next(); });

const corsOptions = {
  origin(origin, cb) {
    // اسمح بطلبات بدون Origin (مثل healthchecks)
    if (!origin) return cb(null, true);
    if (allowlist.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true, // مهم مع fetch(..., { credentials: "include" })
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type','Authorization'],
};

app.use(cors(corsOptions));
// دعم طلبات الـ preflight
app.options('*', cors(corsOptions));
// ================================================

app.use(express.json());

// simple health
app.get('/api/healthz', (req, res) => res.json({ status: 'ok', name:'pyramids-mart-backend' }));

// mount routers (مركّبة ومؤكَّدة من ملفك)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/products', require('./routes/products'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/stats', require('./routes/stats')); // ← الإضافة الوحيدة المطلوبة (توصيل راوتر الإحصائيات)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION ➜', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, p) => {
  console.error('UNHANDLED REJECTION at Promise', p, 'reason:', reason);
});

// connect to mongo
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/pyramidsmart';
mongoose.connect(MONGO, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000
})
  .then(()=>{
    console.log('Mongo connected');
    ensureAdmin().catch(e => console.error('ensureAdmin failed:', e && e.message ? e.message : e));
  })
  .catch(err=>{
    console.error('Mongo connection error:', err && err.message ? err.message : err);
  });

// create initial admin user
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

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
app.listen(PORT, () => {
  console.log(`Server started and listening on port ${PORT}`);
  console.log('NODE_ENV=', process.env.NODE_ENV || 'development');
  
  setTimeout(async () => {
    try {
      const whatsappService = require('./services/whatsappService');
      await whatsappService.start();
      console.log('WhatsApp start attempted.');
    } catch (err) {
      console.error('WhatsApp start error:', err && err.message ? err.message : err);
    }
  }, 2000);
});
