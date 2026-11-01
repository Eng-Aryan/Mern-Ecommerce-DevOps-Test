import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import Icon from './Icon.jsx';

// Thumb-reach navigation for phones. Hidden where a page has its own bottom bar.
export default function MobileTabBar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { count } = useCart();
  const { setSearch } = useUI();
  if (pathname.startsWith('/product/') || pathname.startsWith('/checkout')) return null;
  return (
    <nav className="tabbar" aria-label="Quick navigation">
      <NavLink to="/" end><Icon name="home" /><span>Home</span></NavLink>
      <NavLink to="/shop"><Icon name="grid" /><span>Shop</span></NavLink>
      <button onClick={() => setSearch(true)}><Icon name="search" /><span>Search</span></button>
      <NavLink to="/cart"><span className="ico"><Icon name="cart" />{count > 0 && <b className="dot">{count}</b>}</span><span>Cart</span></NavLink>
      <NavLink to={user ? '/account' : '/login'}><Icon name="user" /><span>{user ? 'Account' : 'Sign in'}</span></NavLink>
    </nav>
  );
}
