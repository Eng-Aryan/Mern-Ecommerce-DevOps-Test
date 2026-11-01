import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg, fmtDate } from '../../api.js';
import { useUI } from '../../context/UIContext.jsx';
import Modal from '../../components/Modal.jsx';
import Icon from '../../components/Icon.jsx';
import { Loader } from '../../components/Loader.jsx';
import { PageHeader } from './ui.jsx';

const EMPTY = { code: '', type: 'percent', value: '', minOrder: '', usageLimit: '', expiresAt: '' };
const toForm = (c) => ({ ...c, minOrder: c.minOrder || '', usageLimit: c.usageLimit || '', expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '' });

export default function AdminCoupons() {
  const { confirm } = useUI();
  const [coupons, setCoupons] = useState(null);
  const [form, setForm] = useState(null);

  const load = () => api.get('/admin/coupons').then((r) => setCoupons(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const body = { code: form.code, type: form.type, value: Number(form.value), minOrder: Number(form.minOrder) || 0, usageLimit: Number(form.usageLimit) || 0, expiresAt: form.expiresAt || null };
    try { form._id ? await api.put(`/admin/coupons/${form._id}`, body) : await api.post('/admin/coupons', body); toast.success('Coupon saved'); setForm(null); load(); } catch (err) { toast.error(errMsg(err)); }
  };
  const toggle = (c) => api.put(`/admin/coupons/${c._id}`, { active: !c.active }).then(load).catch((e) => toast.error(errMsg(e)));
  const remove = async (c) => { if (await confirm({ title: `Delete ${c.code}?`, confirmLabel: 'Delete', danger: true })) api.delete(`/admin/coupons/${c._id}`).then(load).catch((e) => toast.error(errMsg(e))); };

  return (
    <>
      <PageHeader title="Coupons"><button className="btn small" onClick={() => setForm(EMPTY)}><Icon name="plus" size={16} /> New coupon</button></PageHeader>
      {!coupons ? <Loader /> : (
        <div className="table-wrap">
          <table className="responsive">
            <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Expires</th><th></th></tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td data-label="Code"><strong>{c.code}</strong> {!c.active && <span className="pill off">Off</span>}{c.expiresAt && new Date(c.expiresAt) < new Date() && <span className="pill off">Expired</span>}</td>
                  <td data-label="Discount">{c.type === 'percent' ? `${c.value}%` : c.value}</td>
                  <td data-label="Min order">{c.minOrder || '—'}</td>
                  <td data-label="Used">{c.used}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                  <td data-label="Expires">{fmtDate(c.expiresAt)}</td>
                  <td className="actions">
                    <button className="btn small ghost" onClick={() => toggle(c)}>{c.active ? 'Disable' : 'Enable'}</button>
                    <button className="icon-btn" onClick={() => setForm(toForm(c))} aria-label="Edit"><Icon name="edit" size={18} /></button>
                    <button className="icon-btn danger" onClick={() => remove(c)} aria-label="Delete"><Icon name="trash" size={18} /></button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan="6" className="muted">No coupons yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={Boolean(form)} onClose={() => setForm(null)} title={form?._id ? 'Edit coupon' : 'New coupon'}>
        {form && (
          <form className="form flat" onSubmit={save}>
            <div className="fields">
              <label>Code *<input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} autoCapitalize="characters" /></label>
              <label>Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="percent">Percent off</option><option value="fixed">Fixed amount off</option></select></label>
              <label>Value *<input required type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></label>
              <label>Minimum order<input type="number" min="0" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} /></label>
              <label>Usage limit<input type="number" min="0" placeholder="0 = unlimited" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></label>
              <label>Expires<input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></label>
            </div>
            <button className="btn">Save coupon</button>
          </form>
        )}
      </Modal>
    </>
  );
}
