import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// an expired / revoked session signs the user out everywhere instead of failing silently
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && localStorage.getItem('token') && !/\/auth\/(login|register|reset-password|forgot-password)/.test(url)) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';

// Uploaded images are served by the API server; seeded ones are absolute URLs.
export const imgUrl = (src) => {
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  const assetBase = (import.meta.env.VITE_ASSET_URL || '').replace(/\/$/, '');
  const path = src.startsWith('/') ? src : `/${src}`;
  return assetBase ? `${assetBase}${path}` : path;
};

// currency comes from store settings (see SettingsContext)
let currency = 'USD';
let locale = 'en-US';
const make = () => {
  try { return new Intl.NumberFormat(locale, { style: 'currency', currency }); } catch { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }); }
};
let nf = make();
export const configureMoney = (c, l) => { currency = c || 'USD'; locale = l || 'en-US'; nf = make(); };
export const money = (n) => nf.format(n || 0);

export const shortId = (id) => String(id).slice(-8).toUpperCase();
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

// downloads a file from an authenticated endpoint (CSV exports)
export const downloadFile = async (path, filename, params) => {
  const r = await api.get(path, { params, responseType: 'blob' });
  const url = URL.createObjectURL(r.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const discountPct = (p) => (p.comparePrice > p.price ? Math.round((1 - p.price / p.comparePrice) * 100) : 0);

export default api;
