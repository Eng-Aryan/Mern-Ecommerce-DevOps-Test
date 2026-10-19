import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const search = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/shop?keyword=${encodeURIComponent(q.trim())}` : '/shop');
    setOpen(false);
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="logo" onClick={() => setOpen(false)}>Tidewater<span>Supply</span></Link>

        <form className="nav-search" onSubmit={search} role="search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search packs, boots, stoves" aria-label="Search products" />
          <button className="btn small" type="submit">Search</button>
        </form>

        <button className="nav-toggle" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>

        <nav className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          <NavLink to="/shop">Shop</NavLink>
          {user && <NavLink to="/wishlist">Wishlist</NavLink>}
          <NavLink to="/cart">Cart{count > 0 && <b className="pill">{count}</b>}</NavLink>
          {user ? (
            <>
              {user.isAdmin && <NavLink to="/admin">Admin</NavLink>}
              <NavLink to="/account">{user.name.split(' ')[0]}</NavLink>
              <button className="linkish" onClick={() => { logout(); navigate('/'); }}>Sign out</button>
            </>
          ) : (
            <NavLink to="/login">Sign in</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
