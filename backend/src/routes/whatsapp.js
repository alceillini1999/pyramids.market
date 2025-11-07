// whatsapp.js (استبدال أو إدراج الدالة التالية)
const path = require('path');

let whatsappInstance = null;
let isInitializing = false;

const DEFAULT_SESSION_PATH = process.env.WHATSAPP_SESSION_PATH || '/tmp/whatsapp-session'; 
// لو ربطت persistent disk استخدم: '/data/whatsapp-session'

// Utility sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initWhatsAppService(options = {}) {
  if (whatsappInstance) {
    console.log('WhatsApp service already initialized.');
    return whatsappInstance;
  }
  if (isInitializing) {
    console.log('WhatsApp init already in progress, skipping duplicate init call.');
    // انتظار حتى تكتمل عملية التهيئة الجارية
    while (isInitializing) await sleep(500);
    return whatsappInstance;
  }

  isInitializing = true;
  const sessionPath = options.sessionPath || DEFAULT_SESSION_PATH;
  const maxRetries = options.maxRetries ?? 5;
  let attempt = 0;
  let lastErr = null;

  // تأكد أن المجلد موجود وصلاحيات آمنة
  const fs = require('fs');
  try {
    fs.mkdirSync(sessionPath, { recursive: true });
    fs.chmodSync(sessionPath, 0o700); // أمان أفضل من 0777
  } catch (e) {
    console.warn('Could not create session dir:', e.message);
  }

  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`WhatsApp init attempt ${attempt}/${maxRetries} (sessionDir=${sessionPath})`);

      // ---- مثال عام: إنشاء متصفح puppeteer مع flags محمية ----
      // إن كانت مكتبتك تسمح بتمرير هذه الخيارات يمكنك تمريرها إليها بدلاً من إنشاء browser يدوياً هنا.
      const puppeteer = require('puppeteer');

      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--single-process',
          '--no-zygote',
          '--disable-gpu',
          // '--disable-extensions'
        ],
        userDataDir: sessionPath,
        // executablePath: process.env.CHROME_PATH || undefined, // لو تحتاج تحديد Chrome مخصص
      });

      browser.on('disconnected', async () => {
        console.warn('Chromium disconnected. Will attempt restart.');
        // Mark instance removed and trigger re-init in background
        whatsappInstance = null;
        // small delay then try re-init (fire-and-forget)
        setTimeout(() => initWhatsAppService({ sessionPath }), 2000);
      });

      // ----- هنا موضع تكوين مكتبة واتساب التي تستخدمها -----
      // كمثال عام: لو كنت تستخدم whatsapp-web.js سيكون الشكل تقريباً:
      // const { Client } = require('whatsapp-web.js');
      // const client = new Client({ puppeteer: { browser } , session: ... });
      // client.on('qr', qr => console.log('WhatsApp QR received'));
      // client.on('ready', () => console.log('WhatsApp service initialized.'));
      //
      // أدخل هنا الكود المناسب لمكتبتك لتهيئة العميل باستخدام الـ browser أو تمرير نفس الخيارات للمكتبة.

      // إذا لا تريد إنشاء browser هنا (لأن المكتبة تفعل ذلك داخليًا)،
      // بدّل المسار أعلاه لتجعل المكتبة تستقبل puppeteer args أو userDataDir.

      // Placeholder: تعيين whatsappInstance على الكائن الذي تملكه مكتبتك (client)
      const whatsappClient = { browser, /* client: actualClient */ };

      // تسجيل حدث QR واحد فقط — استخدم debounce لمنع الطباعة المتكررة
      let lastQr = null;
      function onQr(qr) {
        if (qr && qr === lastQr) return; // لا نطبع نفس الـ QR مرارًا
        lastQr = qr;
        console.log('WhatsApp QR received');
      }

      // مثال: إذا لديك object client من المكتبة قم بربط الأحداث:
      // whatsappClient.client.on('qr', onQr);
      // whatsappClient.client.on('ready', () => console.log('WhatsApp service initialized.'));
      // whatsappClient.client.on('auth_failure', err => console.error('Auth failure:', err));

      // أخيراً، اضبط instance والflags
      whatsappInstance = whatsappClient;
      isInitializing = false;
      console.log('WhatsApp initialized successfully.');
      return whatsappInstance;

    } catch (err) {
      lastErr = err;
      console.error('WhatsApp init error:', err && err.message ? err.message : err);
      // إن كان الخطأ متعلق بالـ Puppeteer/Chromium ممكن نزيد backoff
      const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000);
      console.log(`Waiting ${backoffMs}ms before next attempt...`);
      await sleep(backoffMs);
    }
  }

  isInitializing = false;
  console.error('Failed to initialize WhatsApp service after attempts:', maxRetries, 'last error:', lastErr && lastErr.message);
  // رمي الخطأ أو إعادته أعلى حتى يتم التعامل معه
  throw lastErr;
}

module.exports = { initWhatsAppService, getWhatsAppInstance: () => whatsappInstance };
