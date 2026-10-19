import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// brute-force protection on login / register
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { message: 'Too many attempts. Try again in a few minutes' } }));
app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: { message: 'Too many sign-ups from this address' } }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', routes);

// In production, serve the built React app from the same server.
const dist = path.join(__dirname, '..', 'client', 'dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api|uploads).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)));
