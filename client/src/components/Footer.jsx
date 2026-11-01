import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { Logo } from './Navbar.jsx';
import Icon from './Icon.jsx';

export default function Footer() {
  const s = useSettings();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { toast.success((await api.post('/newsletter', { email })).data.message); setEmail(''); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  const social = Object.entries(s.social || {}).filter(([, v]) => v);

  return (
    <footer className="footer">
      <div className="container news">
        <div><h3>Get 10% off your first order</h3><p className="muted">Join the list for new arrivals, restocks and offers. Unsubscribe any time.</p></div>
        <form onSubmit={subscribe} className="news-form">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email address" autoComplete="email" />
          <button className="btn accent" disabled={busy}>{busy ? 'Joining…' : 'Subscribe'}</button>
        </form>
      </div>
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="muted">{s.tagline}</p>
          {s.contact?.email && <p className="small"><Icon name="mail" size={14} /> <a href={`mailto:${s.contact.email}`}>{s.contact.email}</a></p>}
          {s.contact?.phone && <p className="small"><Icon name="phone" size={14} /> <a href={`tel:${s.contact.phone.replace(/\s/g, '')}`}>{s.contact.phone}</a></p>}
          {s.contact?.address && <p className="small"><Icon name="pin" size={14} /> {s.contact.address}</p>}
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/shop">All products</Link>
          <Link to="/shop?onSale=true">Sale</Link>
          <Link to="/shop?sort=bestselling">Best sellers</Link>
          <Link to="/shop?sort=rating">Top rated</Link>
        </div>
        <div>
          <h4>Help</h4>
          <Link to="/faq">FAQ</Link>
          <Link to="/shipping-returns">Shipping & returns</Link>
          <Link to="/contact">Contact us</Link>
          <Link to="/orders">Track an order</Link>
        </div>
        <div>
          <h4>Company</h4>
          <Link to="/about">About us</Link>
          <Link to="/privacy">Privacy policy</Link>
          <Link to="/terms">Terms of service</Link>
          {social.length > 0 && <div className="social">{social.map(([k, v]) => <a key={k} href={k === 'whatsapp' && !/^https?:/.test(v) ? `https://wa.me/${v.replace(/\D/g, '')}` : v} target="_blank" rel="noreferrer noopener">{k[0].toUpperCase() + k.slice(1)}</a>)}</div>}
        </div>
      </div>
      <div className="container copy small">
        <span>© {new Date().getFullYear()} {s.storeName}. {s.footerNote}</span>
        <span className="pay-badges">{s.codEnabled && <i>Pay on delivery</i>}{s.cardEnabled && <i>Card</i>}</span>
      </div>
    </footer>
  );
}
