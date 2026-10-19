import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg, fmtDate } from '../../api.js';
import { Loader } from '../../components/Loader.jsx';

const EMPTY = { code: '', type: 'percent', value: '', minOrder: '', usageLimit: '', expiresAt: '' };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get('/admin/coupons').then((r) => setCoupons(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    const body = { ...form, value: Number(form.value), minOrder: Number(form.minOrder) || 0, usageLimit: Number(form.usageLimit) || 0 };
    if (!body.expiresAt) delete body.expiresAt;
    try { await api.post('/admin/coupons', body); toast.success('Coupon created'); setForm(EMPTY); load(); } catch (err) { toast.error(errMsg(err)); }
  };
  const toggle = (c) => api.put(`/admin/coupons/${c._id}`, { active: !c.active }).then(load).catch((e) => toast.error(errMsg(e)));
  const remove = (c) => window.confirm(`Delete ${c.code}?`) && api.delete(`/admin/coupons/${c._id}`).then(load).catch((e) => toast.error(errMsg(e)));

  return (
    <>
      <h1>Coupons</h1>
      <form className="form wide" onSubmit={create}>
        <div className="fields four">
          <label>Code<input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></label>
          <label>Type
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Percent off</option>
              <option value="fixed">Dollars off</option>
            </select>
          </label>
          <label>Value<input required type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></label>
          <label>Minimum order ($)<input type="number" min="0" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} /></label>
          <label>Usage limit<input type="number" min="0" placeholder="0 = unlimited" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></label>
          <label>Expires<input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></label>
        </div>
        <div><button className="btn">Create coupon</button></div>
      </form>

      {!coupons ? <Loader /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Expires</th><th></th></tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td><strong>{c.code}</strong> {!c.active && <span className="pill off">Off</span>}</td>
                  <td>{c.type === 'percent' ? `${c.value}%` : `$${c.value}`}</td>
                  <td>{c.minOrder ? `$${c.minOrder}` : '—'}</td>
                  <td>{c.used}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                  <td>{fmtDate(c.expiresAt)}</td>
                  <td className="actions">
                    <button className="btn small ghost" onClick={() => toggle(c)}>{c.active ? 'Disable' : 'Enable'}</button>
                    <button className="btn small danger" onClick={() => remove(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
