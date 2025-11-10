// ===== تحميل ملف البيئة .env =====
import 'dotenv/config';

// ===== المكتبات الأساسية =====
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// ===== إصلاح __dirname في ESM =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== Helper: تحميل ESM/CJS بشكل آمن (يرجّع default أو الموديول) =====
const load = async (p) => {
  const m = await import(p);
  return m.default || m;
};

// ===== إنشاء التطبيق =====
const app = express();
app.use(helmet());

// ===== CORS (مرن ويغطي نفس الدومين + الموقع القديم واللوكال) =====
const defaultAllow =
  'https://pyramids-market.onrender.com,https://pyramids-market-site.onrender.com,http://localhost:5173';

const allowlist = (process.env.CORS_ALLOWLIST || defaultAllow)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// اجعل الاستجابة حساسة للاختلاف في Origin
app.use((req, res, next) => { res.setHeader('Vary', 'Origin'); next(); });

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // healthchecks etc.
    try {
      if (allowlist.includes(origin)) return cb(null, true);
      if (/\.onrender\.com$/.test(new URL(origin).hostname)) return cb(null, true);
    } catch {}
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type','Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============ JSON ============
app.use(express.json());

// ============ Health ============
app.get('/api/healthz', (req, res) =>
  res.json({ status: 'ok', name: 'pyramids-mart-backend' })
);

// ============ API Routers ============
app.use('/api/auth', await load('./routes/auth.js'));
app.use('/api/clients', await load('./routes/clients.js'));
app.use('/api/products', await load('./routes/products.js'));
app.use('/api/expenses', await load('./routes/expenses.js'));
app.use('/api/sales', await load('./routes/sales.js'));
app.use('/api/whatsapp', await load('./routes/whatsapp.js'));
app.use('/api/uploads', await load('./routes/uploads.js'));
app.use('/api/stats', await load('./routes/stats.js'));
app.use('/api/pos', await load('./routes/pos.js'));

// ملفات الـuploads العامة (لو لزم الأمر)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ============ تقديم واجهة Vite (Static + SPA fallback) ============
// __dirname يشير إلى backend/src لذلك dist في ../../frontend/dist
const distDir = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

// ============ MongoDB ============
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/pyramidsmart';
mongoose.connect(MONGO)
  .then(() => {
    console.log('Mongo connected');
    ensureAdmin().catch(e =>
      console.error('ensureAdmin failed:', e?.message || e)
    );
  })
  .catch(err => console.error('Mongo connection error:', err?.message || err));

// ============ Bootstrap Admin ============
let User;
try {
  const m = await import('./models/User.js'); // قد يكون CJS أو ESM
  User = m.default || m.User || m;
} catch (e) {
  console.error('Failed to load User model:', e?.message || e);
  throw e;
}

async function ensureAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  console.log('ENV check -> ADMIN_EMAIL:', !!ADMIN_EMAIL, 'ADMIN_PASSWORD:', !!ADMIN_PASSWORD);
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('ADMIN_EMAIL or ADMIN_PASSWORD not provided — skipping admin bootstrap.');
    return;
  }
  try {
    const exists = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (!exists) {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await new User({
        name: 'Owner',
        email: ADMIN_EMAIL.toLowerCase(),
        passwordHash: hash,
        role: 'owner',
      }).save();
      console.log('Created initial admin user:', ADMIN_EMAIL);
    } else {
      console.log('Admin user already exists.');
    }
  } catch (err) {
    console.error('Admin creation error', err?.message || err);
  }
}

// ============ Start ============
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
app.listen(PORT, async () => {
  console.log(`Server started and listening on port ${PORT}`);
  console.log('NODE_ENV=', process.env.NODE_ENV || 'development');

  // تشغيل خدمة الواتساب بعد إقلاع السيرفر
  setTimeout(async () => {
    try {
      const whatsappService = await load('./services/whatsappService.js');
      if (typeof whatsappService.start === 'function') {
        await whatsappService.start();
      }
      console.log('WhatsApp start attempted.');
    } catch (err) {
      console.error('WhatsApp start error:', err?.message || err);
    }
  }, 2000);
});
