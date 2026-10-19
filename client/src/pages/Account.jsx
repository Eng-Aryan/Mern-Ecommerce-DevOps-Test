import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Account() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user.name, email: user.email, currentPassword: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { name: form.name, email: form.email };
      if (form.password) Object.assign(body, { password: form.password, currentPassword: form.currentPassword });
      await updateProfile(body);
      setForm((f) => ({ ...f, currentPassword: '', password: '' }));
      toast.success('Profile saved');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section narrow">
      <h1>Your account</h1>
      <p><Link to="/orders" className="btn ghost small">Order history</Link> <Link to="/wishlist" className="btn ghost small">Wishlist</Link></p>
      <form className="form" onSubmit={submit}>
        <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <h3>Change password</h3>
        <label>Current password<input type="password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></label>
        <label>New password<input type="password" minLength={6} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  );
}
