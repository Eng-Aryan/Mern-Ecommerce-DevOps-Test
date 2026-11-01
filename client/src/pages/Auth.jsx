import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import useSeo from '../hooks/useSeo.js';
import Icon from '../components/Icon.jsx';

const PasswordInput = ({ value, onChange, autoComplete, label = 'Password' }) => {
  const [show, setShow] = useState(false);
  return (
    <label>{label}
      <span className="pw">
        <input type={show ? 'text' : 'password'} required minLength={6} autoComplete={autoComplete} value={value} onChange={onChange} />
        <button type="button" className="icon-btn" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}><Icon name="eye" size={18} /></button>
      </span>
    </label>
  );
};

export function Auth({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  useSeo({ title: isRegister ? 'Create account' : 'Sign in' });

  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password); else await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) { toast.error(errMsg(err)); setBusy(false); }
  };

  return (
    <div className="container section narrow">
      <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <form className="form" onSubmit={submit}>
        {isRegister && <label>Name<input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}
        <label>Email<input type="email" required autoComplete="email" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <PasswordInput value={form.password} autoComplete={isRegister ? 'new-password' : 'current-password'} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {!isRegister && <Link to="/forgot-password" className="small">Forgot your password?</Link>}
        <button className="btn big" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
      </form>
      <p className="muted">{isRegister ? 'Already have an account? ' : 'New here? '}<Link to={isRegister ? '/login' : '/register'} state={location.state}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
    </div>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  useSeo({ title: 'Reset password' });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { setDone((await api.post('/auth/forgot-password', { email })).data); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <div className="container section narrow">
      <h1>Forgot your password?</h1>
      {done ? (
        <div className="panel">
          <p>{done.message}</p>
          {done.devResetUrl && <p className="notice info small">Email isn't configured on this server, so here's your link (shown in development only): <a href={done.devResetUrl}>Reset password</a></p>}
          <Link to="/login" className="btn ghost">Back to sign in</Link>
        </div>
      ) : (
        <form className="form" onSubmit={submit}>
          <p className="muted">Enter your email and we'll send you a link to choose a new password.</p>
          <label>Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <button className="btn big" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>
      )}
    </div>
  );
}

export function ResetPassword() {
  const { token } = useParams();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  useSeo({ title: 'Choose a new password' });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await resetPassword(token, password); toast.success('Password updated. You are signed in'); navigate('/', { replace: true }); } catch (err) { toast.error(errMsg(err)); setBusy(false); }
  };
  return (
    <div className="container section narrow">
      <h1>Choose a new password</h1>
      <form className="form" onSubmit={submit}>
        <PasswordInput label="New password" value={password} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />
        <button className="btn big" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
      </form>
    </div>
  );
}
