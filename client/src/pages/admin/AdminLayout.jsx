import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import Icon from '../../components/Icon.jsx';
import '../../styles/admin.css';

const NAV = [
  ['/admin', 'Dashboard', 'chart', true],
  ['/admin/orders', 'Orders', 'clipboard', false, 'orders'],
  ['/admin/products', 'Products', 'box'],
  ['/admin/categories', 'Categories', 'layers'],
  ['/admin/users', 'Customers', 'users'],
  ['/admin/coupons', 'Coupons', 'percent'],
  ['/admin/reviews', 'Reviews', 'star'],
  ['/admin/banners', 'Banners', 'image'],
  ['/admin/messages', 'Messages', 'message', false, 'messages'],
  ['/admin/subscribers', 'Subscribers', 'mail'],
  ['/admin/settings', 'Settings', 'sliders'],
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { storeName } = useSettings();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [badges, setBadges] = useState({});

  useEffect(() => { setOpen(false); document.title = `Admin · ${storeName}`; }, [pathname, storeName]);
  useEffect(() => {
    Promise.all([api.get('/admin/orders?status=Processing&limit=1'), api.get('/admin/messages?status=new')])
      .then(([o, m]) => setBadges({ orders: o.data.total, messages: m.data.total })).catch(() => {});
  }, [pathname]);

  return (
    <div className="admin-shell">
      <aside className={`ad-side ${open ? 'open' : ''}`}>
        <div className="ad-brand"><Link to="/admin">{storeName}</Link><span className="pill">Admin</span></div>
        <nav>
          {NAV.map(([to, label, icon, end, badge]) => (
            <NavLink key={to} to={to} end={end}><Icon name={icon} size={18} /> {label}{badges[badge] > 0 && <b className="count">{badges[badge]}</b>}</NavLink>
          ))}
        </nav>
        <div className="ad-side-foot">
          <Link to="/" target="_blank"><Icon name="external" size={16} /> View store</Link>
          <button onClick={() => { logout(); navigate('/'); }}><Icon name="logout" size={16} /> Sign out</button>
        </div>
      </aside>
      {open && <div className="ad-scrim" onClick={() => setOpen(false)} />}
      <div className="ad-main">
        <header className="ad-top">
          <button className="icon-btn ad-burger" onClick={() => setOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <span className="grow muted small">Signed in as <strong>{user.name}</strong></span>
          <button className="icon-btn" onClick={toggle} aria-label="Toggle dark mode"><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
        </header>
        <main className="ad-content"><Outlet /></main>
      </div>
    </div>
  );
}
