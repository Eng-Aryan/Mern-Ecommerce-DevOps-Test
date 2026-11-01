import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import useSeo from '../hooks/useSeo.js';
import Modal from '../components/Modal.jsx';
import Icon from '../components/Icon.jsx';

const TABS = [['profile', 'Profile', 'user'], ['addresses', 'Addresses', 'pin'], ['security', 'Password', 'lock']];
const EMPTY = { label: 'Home', fullName: '', phone: '', address: '', city: '', postalCode: '', country: '', isDefault: false };

function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone || '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await updateProfile(form); toast.success('Profile saved'); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <form className="form" onSubmit={submit}>
      <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label>Phone<input type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
      <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}

function Security() {
  const { updateProfile } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', password: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await updateProfile(form); setForm({ currentPassword: '', password: '' }); toast.success('Password changed'); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <form className="form" onSubmit={submit}>
      <label>Current password<input type="password" required autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></label>
      <label>New password<input type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
      <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
    </form>
  );
}

function Addresses() {
  const { user, saveAddress, removeAddress } = useAuth();
  const { confirm } = useUI();
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await saveAddress(edit); toast.success('Address saved'); setEdit(null); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  const del = async (a) => {
    if (await confirm({ title: 'Delete this address?', confirmLabel: 'Delete', danger: true })) removeAddress(a._id).catch((e) => toast.error(errMsg(e)));
  };
  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });
  return (
    <>
      <div className="addr-grid">
        {(user.addresses || []).map((a) => (
          <div key={a._id} className={`addr ${a.isDefault ? 'def' : ''}`}>
            <strong>{a.label}</strong>{a.isDefault && <span className="pill">Default</span>}
            <p>{a.fullName}<br />{a.address}<br />{a.city}, {a.postalCode}<br />{a.country}{a.phone && <><br />{a.phone}</>}</p>
            <div className="row small-gap">
              <button className="btn small ghost" onClick={() => setEdit(a)}>Edit</button>
              {!a.isDefault && <button className="btn small ghost" onClick={() => saveAddress({ _id: a._id, isDefault: true }).catch((e) => toast.error(errMsg(e)))}>Make default</button>}
              <button className="btn small danger" onClick={() => del(a)}>Delete</button>
            </div>
          </div>
        ))}
        <button className="addr add" onClick={() => setEdit({ ...EMPTY, fullName: user.name, phone: user.phone || '' })}><Icon name="plus" /> Add address</button>
      </div>
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?._id ? 'Edit address' : 'New address'}>
        {edit && (
          <form className="form flat" onSubmit={save}>
            <div className="fields">
              <label>Label<input value={edit.label || ''} onChange={set('label')} placeholder="Home, Work…" /></label>
              <label>Full name *<input required value={edit.fullName || ''} onChange={set('fullName')} /></label>
              <label className="span2">Street address *<input required value={edit.address || ''} onChange={set('address')} /></label>
              <label>City *<input required value={edit.city || ''} onChange={set('city')} /></label>
              <label>Postal code *<input required value={edit.postalCode || ''} onChange={set('postalCode')} /></label>
              <label>Country *<input required value={edit.country || ''} onChange={set('country')} /></label>
              <label>Phone<input type="tel" value={edit.phone || ''} onChange={set('phone')} /></label>
            </div>
            <label className="check"><input type="checkbox" checked={Boolean(edit.isDefault)} onChange={(e) => setEdit({ ...edit, isDefault: e.target.checked })} /> Use as my default address</label>
            <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
          </form>
        )}
      </Modal>
    </>
  );
}

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'profile';
  useSeo({ title: 'My account' });
  return (
    <div className="container section account">
      <h1>Hello, {user.name.split(' ')[0]}</h1>
      <div className="quick-links">
        <Link to="/orders" className="btn ghost small"><Icon name="box" size={16} /> Orders</Link>
        <Link to="/wishlist" className="btn ghost small"><Icon name="heart" size={16} /> Wishlist</Link>
        {user.isAdmin && <Link to="/admin" className="btn ghost small"><Icon name="chart" size={16} /> Admin panel</Link>}
        <button className="btn ghost small" onClick={() => { logout(); navigate('/'); }}><Icon name="logout" size={16} /> Sign out</button>
      </div>
      <div className="tabs" role="tablist">{TABS.map(([k, label, ic]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setParams({ tab: k })}><Icon name={ic} size={16} /> {label}</button>)}</div>
      {tab === 'profile' && <div className="narrow-form"><Profile /></div>}
      {tab === 'addresses' && <Addresses />}
      {tab === 'security' && <div className="narrow-form"><Security /></div>}
    </div>
  );
}
