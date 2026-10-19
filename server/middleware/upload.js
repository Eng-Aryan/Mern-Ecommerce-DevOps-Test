import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: dir,
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname).toLowerCase()}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(jpe?g|png|webp|gif)$/i.test(file.originalname) && file.mimetype.startsWith('image/');
    cb(ok ? null : new Error('Only JPG, PNG, WEBP or GIF images are allowed'), ok);
  },
});

export default upload;
