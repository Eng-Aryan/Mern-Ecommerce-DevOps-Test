import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { Loader } from '../../components/Loader.jsx';
import { PageHeader, Card } from './ui.jsx';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'IQD', 'AED', 'SAR', 'TRY', 'EGP', 'CAD', 'AUD', 'INR', 'JPY'];

export default function AdminSettings() {
  const { reload } = useSettings();
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get('/admin/settings').then((r) => setF(r.data)).catch((e) => toast.error(errMsg(e))); }, []);
  if (!f) return <Loader />;

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const nested = (g, k, v) => setF((x) => ({ ...x, [g]: { ...x[g], [k]: v } }));
  const num = (k) => ({ type: 'number', min: 0, step: 'any', inputMode: 'decimal', value: f[k], onChange: (e) => set(k, e.target.value === '' ? '' : Number(e.target.value)) });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.put('/admin/settings', f); await reload(); toast.success('Settings saved'); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save}>
      <PageHeader title="Settings" sub="Changes apply to the whole store straight away"><button className="btn small" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button></PageHeader>
      <div className="stack">
        <Card title="Store">
          <div className="form flat"><div className="fields">
            <label>Store name<input required value={f.storeName} onChange={(e) => set('storeName', e.target.value)} /></label>
            <label>Tagline<input value={f.tagline} onChange={(e) => set('tagline', e.target.value)} /></label>
            <label className="span2">Search engine description<textarea rows="2" value={f.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} /></label>
            <label>Currency<select value={f.currency} onChange={(e) => set('currency', e.target.value)}>{[...new Set([f.currency, ...CURRENCIES])].map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>Number format (locale)<input value={f.locale} onChange={(e) => set('locale', e.target.value)} placeholder="en-US" /></label>
          </div></div>
        </Card>

        <Card title="Pricing & shipping">
          <div className="form flat"><div className="fields">
            <label>Tax rate (%)<input {...num('taxRate')} max="100" /></label>
            <label>Standard shipping fee<input {...num('shippingFlat')} /></label>
            <label>Free standard shipping over<input {...num('freeShippingOver')} /><small className="muted">0 = standard shipping is always free</small></label>
            <label>Express shipping fee<input {...num('expressShipping')} /></label>
            <label>Low-stock alert at<input {...num('lowStockThreshold')} /></label>
            <label>Return window (days)<input {...num('returnDays')} /></label>
          </div>
          <label className="check"><input type="checkbox" checked={f.expressEnabled} onChange={(e) => set('expressEnabled', e.target.checked)} /> Offer express shipping</label></div>
        </Card>

        <Card title="Payments">
          <label className="check"><input type="checkbox" checked={f.codEnabled} onChange={(e) => set('codEnabled', e.target.checked)} /> Allow pay on delivery</label>
          <label className="check"><input type="checkbox" checked={f.cardEnabled} onChange={(e) => set('cardEnabled', e.target.checked)} /> Allow card payments <span className="muted small">(also needs STRIPE_SECRET_KEY on the server)</span></label>
        </Card>

        <Card title="Announcement bar">
          <div className="form flat"><label className="check"><input type="checkbox" checked={f.announcement.active} onChange={(e) => nested('announcement', 'active', e.target.checked)} /> Show the bar above the header</label>
          <div className="fields"><label>Text<input value={f.announcement.text} onChange={(e) => nested('announcement', 'text', e.target.value)} /></label><label>Link<input value={f.announcement.link} onChange={(e) => nested('announcement', 'link', e.target.value)} /></label></div></div>
        </Card>

        <Card title="Contact details">
          <div className="form flat"><div className="fields">
            <label>Email (also receives contact-form messages)<input type="email" value={f.contact.email} onChange={(e) => nested('contact', 'email', e.target.value)} /></label>
            <label>Phone<input value={f.contact.phone} onChange={(e) => nested('contact', 'phone', e.target.value)} /></label>
            <label>Address<input value={f.contact.address} onChange={(e) => nested('contact', 'address', e.target.value)} /></label>
            <label>Opening hours<input value={f.contact.hours} onChange={(e) => nested('contact', 'hours', e.target.value)} /></label>
          </div></div>
        </Card>

        <Card title="Social links">
          <div className="form flat"><div className="fields">
            {['facebook', 'instagram', 'twitter', 'youtube', 'whatsapp'].map((k) => <label key={k}>{k[0].toUpperCase() + k.slice(1)}<input value={f.social[k] || ''} onChange={(e) => nested('social', k, e.target.value)} placeholder={k === 'whatsapp' ? 'Phone number or link' : 'https://…'} /></label>)}
            <label className="span2">Footer note<input value={f.footerNote} onChange={(e) => set('footerNote', e.target.value)} /></label>
          </div></div>
        </Card>
      </div>
    </form>
  );
}
