import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import SearchBox from './SearchBox.jsx';
import Drawer from './Drawer.jsx';
import Icon from './Icon.jsx';

export const Logo = ({ onClick }) => {
  const { storeName } = useSettings();
  const [first, ...rest] = storeName.split(' ');
  return <Link to="/" className="logo" onClick={onClick}>{first}{rest.length > 0 && <span>{rest.join(' ')}</span>}</Link>;
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count, openDrawer } = useCart();
  const { announcement } = useSettings();
  const { theme, toggle } = useTheme();
  const { menu, setMenu, search, setSearch } = useUI();
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);

  useEffect(() => { api.get('/products/categories').then((r) => setCats(r.data)).catch(() => {}); }, []);
  const wish = user?.wishlist?.length || 0;

  return (
    <>
      {announcement?.active && announcement.text && (
        <div className="announce">
          {announcement.link ? <Link to={announcement.link}>{announcement.text}</Link> : <span>{announcement.text}</span>}
        </div>
      )}
      <header className="nav">
        <div className="container nav-inner">
          <button className="icon-btn menu-btn" onClick={() => setMenu(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <Logo />
          <SearchBox className="desk-only" />
          <nav className="nav-actions" aria-label="Main">
            <NavLink to="/shop" className="nav-link desk-only">Shop</NavLink>
            <button className="icon-btn mob-only" onClick={() => setSearch(true)} aria-label="Search"><Icon name="search" /></button>
            <button className="icon-btn desk-only" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
            <NavLink to={user ? '/wishlist' : '/login'} className="icon-btn" aria-label="Wishlist"><Icon name="heart" />{wish > 0 && <b className="dot">{wish}</b>}</NavLink>
            <NavLink to={user ? '/account' : '/login'} className="icon-btn desk-only" aria-label="Account"><Icon name="user" /></NavLink>
            <button className="icon-btn" onClick={openDrawer} aria-label={`Cart, ${count} items`}><Icon name="cart" />{count > 0 && <b className="dot">{count}</b>}</button>
          </nav>
        </div>
        <div className="subnav desk-only">
          <div className="container">
            {cats.slice(0, 7).map((c) => <NavLink key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`}>{c.name}</NavLink>)}
            <NavLink to="/shop?onSale=true" className="sale-link">Sale</NavLink>
          </div>
        </div>
      </header>

      <Drawer open={menu} onClose={() => setMenu(false)} side="left" title="Menu">
        <nav className="menu-list" onClick={() => setMenu(false)}>
          <Link to="/shop">All products</Link>
          {cats.map((c) => <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`}>{c.name} <span className="muted small">{c.count}</span></Link>)}
          <Link to="/shop?onSale=true" className="sale-link">Sale</Link>
          <hr />
          {user ? (
            <>
              <Link to="/account">My account</Link>
              <Link to="/orders">My orders</Link>
              <Link to="/wishlist">Wishlist</Link>
              {user.isAdmin && <Link to="/admin">Admin panel</Link>}
              <button className="linkish" onClick={() => { logout(); navigate('/'); }}>Sign out</button>
            </>
          ) : (
            <><Link to="/login">Sign in</Link><Link to="/register">Create account</Link></>
          )}
          <hr />
          <Link to="/contact">Contact us</Link>
          <Link to="/faq">Help & FAQ</Link>
          <Link to="/shipping-returns">Shipping & returns</Link>
        </nav>
        <button className="btn ghost block" onClick={toggle}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} /> {theme === 'dark' ? 'Light' : 'Dark'} mode</button>
      </Drawer>

      <Drawer open={search} onClose={() => setSearch(false)} side="top" title="Search">
        <SearchBox autoFocus onDone={() => setSearch(false)} className="in-drawer" />
      </Drawer>
    </>
  );
}
