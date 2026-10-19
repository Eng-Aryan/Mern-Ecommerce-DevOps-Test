import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, money } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import useQuote from '../useQuote.js';
import Summary from '../components/Summary.jsx';
import { ErrorBox } from '../components/Loader.jsx';

const FIELDS = [
  ['fullName', 'Full name', 'name'],
  ['phone', 'Phone', 'tel'],
  ['address', 'Street address', 'street-address'],
  ['city', 'City', 'address-level2'],
  ['postalCode', 'Postal code', 'postal-code'],
  ['country', 'Country', 'country-name'],
];

export default function Checkout() {
  const { user } = useAuth();
  const { items, coupon, clear } = useCart();
  const { quote, error, loading } = useQuote(items, coupon);
  const navigate = useNavigate();
  const [addr, setAddr] = useState({ fullName: user.name, phone: '', address: '', city: '', postalCode: '', country: '', ...(user.shippingAddress || {}) });
  const [method, setMethod] = useState('COD');
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [saveAddr, setSaveAddr] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get('/payment/config').then((r) => setStripeEnabled(r.data.stripeEnabled)).catch(() => {}); }, []);
  useEffect(() => { if (items.length === 0 && !busy) navigate('/cart', { replace: true }); }, [items.length]); // eslint-disable-line

  const place = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: order } = await api.post('/orders', {
        items: items.map((i) => ({ product: i.product, qty: i.qty })),
        shippingAddress: addr,
        paymentMethod: method,
        couponCode: coupon || undefined,
      });
      if (saveAddr) api.put('/auth/profile', { shippingAddress: addr }).catch(() => {});
      clear();
      if (method === 'Stripe') {
        const { data } = await api.post(`/payment/session/${order._id}`);
        window.location.href = data.url;
        return;
      }
      toast.success('Order placed');
      navigate(`/order/${order._id}`, { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="container section">
      <h1>Checkout</h1>
      <form className="two-col" onSubmit={place}>
        <div className="form">
          <h2>Shipping address</h2>
          <div className="fields">
            {FIELDS.map(([key, label, auto]) => (
              <label key={key} className={key === 'address' ? 'span2' : ''}>
                {label}
                <input required={key !== 'phone'} autoComplete={auto} value={addr[key] || ''} onChange={(e) => setAddr({ ...addr, [key]: e.target.value })} />
              </label>
            ))}
          </div>
          <label className="check"><input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} /> Save this address to my profile</label>

          <h2>Payment</h2>
          <label className={`option ${method === 'COD' ? 'on' : ''}`}>
            <input type="radio" name="pay" checked={method === 'COD'} onChange={() => setMethod('COD')} />
            <span><strong>Pay on delivery</strong><small>Cash or card to the courier when your order arrives.</small></span>
          </label>
          <label className={`option ${method === 'Stripe' ? 'on' : ''} ${stripeEnabled ? '' : 'disabled'}`}>
            <input type="radio" name="pay" disabled={!stripeEnabled} checked={method === 'Stripe'} onChange={() => setMethod('Stripe')} />
            <span>
              <strong>Pay by card</strong>
              <small>{stripeEnabled ? 'Secure payment on Stripe. You will be redirected to finish.' : 'Not available yet. Add STRIPE_SECRET_KEY to server/.env to turn this on.'}</small>
            </span>
          </label>
        </div>

        <aside className="panel">
          <h2>Your order</h2>
          {items.map((i) => (
            <div className="mini" key={i.product}><span>{i.qty} × {i.name}</span><span>{money(i.qty * i.price)}</span></div>
          ))}
          {error && <ErrorBox message={error} />}
          <Summary q={quote} loading={loading} />
          <button className="btn big block" disabled={busy || !quote}>{busy ? 'Placing order…' : method === 'Stripe' ? 'Continue to payment' : 'Place order'}</button>
        </aside>
      </form>
    </div>
  );
}
