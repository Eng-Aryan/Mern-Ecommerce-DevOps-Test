import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Auth({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="container section narrow">
      <h1>{isRegister ? 'Create your account' : 'Sign in'}</h1>
      <form className="form" onSubmit={submit}>
        {isRegister && <label>Name<input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}
        <label>Email<input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" required minLength={6} autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button className="btn big" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
      </form>
      <p className="muted">
        {isRegister ? 'Already have an account? ' : 'New here? '}
        <Link to={isRegister ? '/login' : '/register'} state={location.state}>{isRegister ? 'Sign in' : 'Create an account'}</Link>
      </p>
    </div>
  );
}
