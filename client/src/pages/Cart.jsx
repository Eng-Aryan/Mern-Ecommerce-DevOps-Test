import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import useQuote from '../useQuote.js';
import useSeo from '../hooks/useSeo.js';
import { money, errMsg } from '../api.js';
import ProductImage from '../components/ProductImage.jsx';
import QtyStepper from '../components/QtyStepper.jsx';
import Summary from '../components/Summary.jsx';
import Icon from '../components/Icon.jsx';
import { ErrorBox } from '../components/Loader.jsx';

export default function Cart() {
  const { items, setQty, remove, coupon, setCoupon } = useCart();
  const { user, toggleWishlist } = useAuth();
  const [code, setCode] = useState(coupon);
  const { quote, error, loading } = useQuote(items, coupon);
  const navigate = useNavigate();
  useSeo({ title: 'Your cart' });

  if (items.length === 0)
    return (
      <div className="container section empty">
        <h1>Your cart is empty</h1>
        <p className="muted">Pick something for the next trip.</p>
        <Link to="/shop" className="btn big">Browse gear</Link>
      </div>
    );

  const freeLeft = quote ? quote.rules.freeShippingOver - (quote.itemsPrice - quote.discount) : 0;
  const saveForLater = async (i) => {
    if (!user) return navigate('/login', { state: { from: '/cart' } });
    try { if (!user.wishlist.includes(i.product)) await toggleWishlist(i.product); remove(i.key); toast.success('Moved to wishlist'); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="container section">
      <h1>Your cart</h1>
      <div className="two-col">
        <div className="lines">
          {items.map((i) => (
            <div className="line" key={i.key}>
              <Link to={`/product/${i.product}`}><ProductImage src={i.image} name={i.name} /></Link>
              <div className="grow">
                <Link to={`/product/${i.product}`}><strong>{i.name}</strong></Link>
                {i.variantLabel && <p className="small muted">{i.variantLabel}</p>}
                <p className="muted small">{money(i.price)} each</p>
                <div className="row wrap small-gap">
                  <button className="linkish small" onClick={() => remove(i.key)}>Remove</button>
                  <button className="linkish small" onClick={() => saveForLater(i)}>Save for later</button>
                </div>
              </div>
              <QtyStepper value={i.qty} max={i.countInStock} onChange={(n) => setQty(i.key, n)} label={`Quantity for ${i.name}`} />
              <strong className="line-total">{money(i.price * i.qty)}</strong>
            </div>
          ))}
        </div>

        <aside className="panel sticky">
          <h2>Order summary</h2>
          {error && <ErrorBox message={error} />}
          <Summary q={quote} loading={loading} />
          {quote && quote.rules.freeShippingOver > 0 && (
            freeLeft > 0 ? <p className="small muted"><Icon name="truck" size={14} /> Add {money(freeLeft)} more for free shipping.</p> : <p className="small good"><Icon name="check" size={14} /> Free shipping unlocked.</p>
          )}
          <form className="coupon" onSubmit={(e) => { e.preventDefault(); setCoupon(code.trim().toUpperCase()); }}>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" autoCapitalize="characters" />
            <button className="btn ghost small">Apply</button>
          </form>
          {quote?.couponError && <p className="small bad">{quote.couponError}</p>}
          <button className="btn big block" disabled={!quote} onClick={() => navigate('/checkout')}>Checkout</button>
          <Link to="/shop" className="btn ghost block">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
