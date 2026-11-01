import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import routes from './routes/index.js';
import Product from './models/Product.js';
import sanitize from './utils/sanitize.js';
import { webhook } from './controllers/paymentController.js';
import { notFound, errorHandler } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const isProd = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}
if (isProd && process.env.JWT_SECRET.length < 24) console.warn('WARNING: JWT_SECRET is short. Use a long random string in production.');

app.set('trust proxy', 1); // correct client IPs behind nginx / a load balancer (needed for rate limits)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(compression());
if (!isProd) app.use(morgan('dev'));

// Stripe needs the untouched request body to verify its signature, so this comes before express.json().
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), webhook);

app.use(express.json({ limit: '1mb' }));
app.use(sanitize);

// brute-force protection on login / register, and a generous ceiling on everything else
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { message: 'Too many attempts. Try again in a few minutes' } }));
app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: { message: 'Too many sign-ups from this address' } }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 2000, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many requests. Slow down a little' } }));

// health check for Docker / Jenkins / load balancers
app.get('/api/health', (req, res) => {
  const db = mongoose.connection.readyState === 1;
  res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db, uptime: Math.round(process.uptime()) });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }));

// SEO helpers
const siteUrl = (req) => (process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /account\nDisallow: /checkout\nSitemap: ${siteUrl(req)}/sitemap.xml\n`);
});
app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const base = siteUrl(req);
    const products = await Product.find({ isActive: { $ne: false } }).select('updatedAt').lean();
    const pages = ['', '/shop', '/about', '/contact', '/faq', '/shipping-returns', '/privacy', '/terms'];
    const urls = [
      ...pages.map((p) => `<url><loc>${base}${p}</loc></url>`),
      ...products.map((p) => `<url><loc>${base}/product/${p._id}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod></url>`),
    ];
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`);
  } catch (err) {
    next(err);
  }
});

app.use('/api', routes);

// In production, serve the built React app from the same server.
const dist = path.join(__dirname, '..', 'client', 'dist');
if (isProd && fs.existsSync(dist)) {
  app.use(
    express.static(dist, {
      maxAge: '1y',
      setHeaders: (res, file) => {
        // the shell, service worker and manifest must always be re-checked; hashed assets can be cached for a year
        if (/(index\.html|sw\.js|manifest\.webmanifest|offline\.html)$/.test(file)) res.setHeader('Cache-Control', 'no-cache');
      },
    })
  );
  app.get(/^\/(?!api|uploads).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)));
