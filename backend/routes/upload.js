/**
 * File upload API - property images, floor plans, unit images
 * Stores files in backend/uploads (create folder if missing)
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = (req.query.type || 'property').toLowerCase();
    const dir = path.join(UPLOAD_DIR, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').replace(/^\./, '') || 'jpg';
    const name = `${(req.query.type || 'file').toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype) || /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(file.originalname);
    if (allowed) cb(null, true);
    else cb(new Error('Only images (JPEG, PNG, GIF, WebP) or PDF allowed'));
  }
});

router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const type = (req.query.type || 'property').toLowerCase();
    const url = `/uploads/${type}/${req.file.filename}`;
    res.json({ success: true, data: { url, path: req.file.path, filename: req.file.filename } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
