import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// مكان الحفظ: /uploads/whatsapp
const uploadDir = path.join(process.cwd(), "uploads", "whatsapp");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path.basename(file.originalname || "image", ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${base}${ext || ".jpg"}`);
  },
});
const upload = multer({ storage });

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "http");
  const host = req.headers["x-forwarded-host"] || req.get("host");
  const publicPath = `/uploads/whatsapp/${req.file.filename}`;
  const url = `${proto}://${host}${publicPath}`;

  return res.json({ ok: true, url, filename: req.file.filename });
});

export default router;
