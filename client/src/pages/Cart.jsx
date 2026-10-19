import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import useQuote from '../useQuote.js';
import { money } from '../api.js';
import ProductImage from '../components/ProductImage.jsx';
import Summary from '../components/Summary.jsx';
import { ErrorBox } from '../components/Loader.jsx';

export default function Cart() {
  const { items, setQty, remove, coupon, setCoupon } = useCart();
  const [code, setCode] = useState(coupon);
  const { quote, error, loading } = useQuote(items, coupon);
  const navigate = useNavigate();

  if (items.length === 0)
    return (
      <div className="container section empty">
        <h1>Your cart is empty</h1>
        <p className="muted">Pick something for the next trip.</p>
        <Link to="/shop" className="btn">Browse gear</Link>
      </div>
    );

  const freeLeft = quote ? quote.rules.freeShippingOver - (quote.itemsPrice - quote.discount) : 0;

  return (
    <div className="container section">
      <h1>Your cart</h1>
      <div className="two-col">
        <div className="lines">
          {items.map((i) => (
            <div className="line" key={i.product}>
              <Link to={`/product/${i.product}`}><ProductImage src={i.image} name={i.name} /></Link>
              <div className="grow">
                <Link to={`/product/${i.product}`}><strong>{i.name}</strong></Link>
                <p className="muted small">{money(i.price)} each</p>
                <button className="linkish small" onClick={() => remove(i.product)}>Remove</button>
              </div>
              <div className="qty" role="group" aria-label={`Quantity for ${i.name}`}>
                <button onClick={() => setQty(i.product, i.qty - 1)} disabled={i.qty <= 1} aria-label="Decrease">−</button>
                <span>{i.qty}</span>
                <button onClick={() => setQty(i.product, i.qty + 1)} disabled={i.qty >= i.countInStock} aria-label="Increase">+</button>
              </div>
              <strong className="line-total">{money(i.price * i.qty)}</strong>
            </div>
          ))}
        </div>

        <aside className="panel">
          <h2>Order summary</h2>
          {error && <ErrorBox message={error} />}
          <Summary q={quote} loading={loading} />
          {quote && freeLeft > 0 && <p className="small muted">Add {money(freeLeft)} more for free shipping.</p>}

          <form className="coupon" onSubmit={(e) => { e.preventDefault(); setCoupon(code.trim().toUpperCase()); }}>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" />
            <button className="btn ghost small">Apply</button>
          </form>
          {quote?.couponError && <p className="small bad">{quote.couponError}</p>}

          <button className="btn big block" disabled={!quote} onClick={() => navigate('/checkout')}>Checkout</button>
        </aside>
      </div>
    </div>
  );
}
