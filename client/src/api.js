import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';

// Uploaded images are served by the API server; seeded ones are absolute URLs.
export const imgUrl = (src) => {
  if (!src) return '';
  // Seeded product images are absolute URLs; leave them unchanged.
  if (/^https?:\/\//i.test(src)) return src;
  // Uploaded images are served by Express, not by the Vite frontend server.
  const assetBase = (import.meta.env.VITE_ASSET_URL || '').replace(/\/$/, '');
  const path = src.startsWith('/') ? src : `/${src}`;
  return assetBase ? `${assetBase}${path}` : path;
};

export const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
export const shortId = (id) => String(id).slice(-8).toUpperCase();
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

export default api;
