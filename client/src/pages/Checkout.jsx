import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, money } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import useQuote from '../useQuote.js';
import useSeo from '../hooks/useSeo.js';
import Summary from '../components/Summary.jsx';
import Icon from '../components/Icon.jsx';
import { ErrorBox } from '../components/Loader.jsx';

const FIELDS = [['fullName', 'Full name', 'name'], ['phone', 'Phone', 'tel'], ['address', 'Street address', 'street-address'], ['city', 'City', 'address-level2'], ['postalCode', 'Postal code', 'postal-code'], ['country', 'Country', 'country-name']];
const EMPTY = { fullName: '', phone: '', address: '', city: '', postalCode: '', country: '' };
const STEPS = ['Address', 'Delivery', 'Payment'];
const pickAddr = (a) => Object.fromEntries(FIELDS.map(([k]) => [k, a?.[k] || '']));

export default function Checkout() {
  const { user, saveAddress } = useAuth();
  const { items, coupon, clear } = useCart();
  const s = useSettings();
  const navigate = useNavigate();
  useSeo({ title: 'Checkout' });

  const saved = user.addresses || [];
  const def = saved.find((a) => a.isDefault) || saved[0];
  const [step, setStep] = useState(1);
  const [choice, setChoice] = useState(def?._id || 'new'); // saved address id or 'new'
  const [addr, setAddr] = useState({ ...EMPTY, fullName: user.name, phone: user.phone || '' });
  const [saveAddr, setSaveAddr] = useState(true);
  const [shipping, setShipping] = useState('standard');
  const [method, setMethod] = useState(s.codEnabled ? 'COD' : 'Stripe');
  const [note, setNote] = useState('');
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const { quote, error, loading } = useQuote(items, coupon, shipping);

  useEffect(() => { api.get('/payment/config').then((r) => setStripeEnabled(r.data.stripeEnabled)).catch(() => {}); }, []);
  useEffect(() => { if (items.length === 0 && !busy) navigate('/cart', { replace: true }); }, [items.length]); // eslint-disable-line

  const chosen = choice === 'new' ? addr : pickAddr(saved.find((a) => a._id === choice));
  const valid = ['fullName', 'address', 'city', 'postalCode', 'country'].every((k) => String(chosen[k] || '').trim());
  const standardPrice = quote ? (quote.itemsPrice - quote.discount >= quote.rules.freeShippingOver ? 0 : quote.rules.shippingFlat) : 0;

  const next = () => {
    if (step === 1 && !valid) return toast.error('Complete the required address fields');
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const place = async () => {
    setBusy(true);
    try {
      const { data: order } = await api.post('/orders', {
        items: items.map((i) => ({ product: i.product, variant: i.variant, qty: i.qty })),
        shippingAddress: chosen, paymentMethod: method, shippingMethod: shipping, couponCode: coupon || undefined, customerNote: note,
      });
      if (choice === 'new' && saveAddr) saveAddress({ ...addr, label: 'Home' }).catch(() => {});
      clear();
      if (method === 'Stripe') {
        const { data } = await api.post(`/payment/session/${order._id}`);
        window.location.href = data.url;
        return;
      }
      navigate(`/order/${order._id}?placed=1`, { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  const summary = (
    <>
      {items.map((i) => <div className="mini" key={i.key}><span>{i.qty} × {i.name}{i.variantLabel ? ` (${i.variantLabel})` : ''}</span><span>{money(i.qty * i.price)}</span></div>)}
      {error && <ErrorBox message={error} />}
      <Summary q={quote} loading={loading} />
    </>
  );

  return (
    <div className="container section checkout">
      <h1>Checkout</h1>
      <ol className="stepper" aria-label="Checkout steps">
        {STEPS.map((t, i) => <li key={t} className={step === i + 1 ? 'now' : step > i + 1 ? 'done' : ''}><button disabled={step <= i + 1} onClick={() => setStep(i + 1)}><b>{step > i + 1 ? <Icon name="check" size={14} /> : i + 1}</b> {t}</button></li>)}
      </ol>

      <details className="mob-summary mob-only"><summary>Order summary <strong>{quote ? money(quote.totalPrice) : ''}</strong></summary><div className="panel">{summary}</div></details>

      <div className="two-col">
        <div>
          {step === 1 && (
            <div className="form">
              <h2>Shipping address</h2>
              {saved.map((a) => (
                <label key={a._id} className={`option ${choice === a._id ? 'on' : ''}`}>
                  <input type="radio" name="addr" checked={choice === a._id} onChange={() => setChoice(a._id)} />
                  <span><strong>{a.label} · {a.fullName}</strong><small>{a.address}, {a.city} {a.postalCode}, {a.country}</small></span>
                </label>
              ))}
              {saved.length > 0 && (
                <label className={`option ${choice === 'new' ? 'on' : ''}`}>
                  <input type="radio" name="addr" checked={choice === 'new'} onChange={() => setChoice('new')} />
                  <span><strong>Use a different address</strong></span>
                </label>
              )}
              {choice === 'new' && (
                <>
                  <div className="fields">
                    {FIELDS.map(([key, label, auto]) => (
                      <label key={key} className={key === 'address' ? 'span2' : ''}>{label}{key !== 'phone' && ' *'}
                        <input required={key !== 'phone'} autoComplete={auto} value={addr[key]} onChange={(e) => setAddr({ ...addr, [key]: e.target.value })} inputMode={key === 'phone' ? 'tel' : undefined} />
                      </label>
                    ))}
                  </div>
                  <label className="check"><input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} /> Save this address to my account</label>
                </>
              )}
              <button className="btn big" onClick={next}>Continue to delivery</button>
            </div>
          )}

          {step === 2 && (
            <div className="form">
              <h2>Delivery method</h2>
              <label className={`option ${shipping === 'standard' ? 'on' : ''}`}>
                <input type="radio" name="ship" checked={shipping === 'standard'} onChange={() => setShipping('standard')} />
                <span className="grow"><strong>Standard</strong><small>Usually arrives in 3–7 working days</small></span><strong>{standardPrice === 0 ? 'Free' : money(standardPrice)}</strong>
              </label>
              {s.expressEnabled && (
                <label className={`option ${shipping === 'express' ? 'on' : ''}`}>
                  <input type="radio" name="ship" checked={shipping === 'express'} onChange={() => setShipping('express')} />
                  <span className="grow"><strong>Express</strong><small>Priority handling, 1–3 working days</small></span><strong>{money(s.expressShipping)}</strong>
                </label>
              )}
              <div className="row"><button className="btn ghost" onClick={() => setStep(1)}>Back</button><button className="btn big grow" onClick={next}>Continue to payment</button></div>
            </div>
          )}

          {step === 3 && (
            <div className="form">
              <h2>Payment</h2>
              {s.codEnabled && (
                <label className={`option ${method === 'COD' ? 'on' : ''}`}>
                  <input type="radio" name="pay" checked={method === 'COD'} onChange={() => setMethod('COD')} />
                  <span><strong>Pay on delivery</strong><small>Cash or card to the courier when your order arrives.</small></span>
                </label>
              )}
              <label className={`option ${method === 'Stripe' ? 'on' : ''} ${stripeEnabled ? '' : 'disabled'}`}>
                <input type="radio" name="pay" disabled={!stripeEnabled} checked={method === 'Stripe'} onChange={() => setMethod('Stripe')} />
                <span><strong>Pay by card</strong><small>{stripeEnabled ? 'Secure payment on Stripe. You will be redirected to finish.' : 'Not available yet. Add STRIPE_SECRET_KEY to server/.env to turn this on.'}</small></span>
              </label>
              <label>Order note (optional)<textarea rows="2" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Delivery instructions, gift message…" /></label>
              <div className="review-box">
                <p><strong>Ship to</strong><br />{chosen.fullName}, {chosen.address}, {chosen.city} {chosen.postalCode}, {chosen.country}</p>
                <p><strong>Delivery</strong> {shipping === 'express' ? 'Express' : 'Standard'}</p>
              </div>
              <div className="row"><button className="btn ghost" onClick={() => setStep(2)}>Back</button>
                <button className="btn big grow" disabled={busy || !quote} onClick={place}><Icon name="lock" size={16} /> {busy ? 'Placing order…' : method === 'Stripe' ? `Pay ${quote ? money(quote.totalPrice) : ''}` : `Place order${quote ? ` · ${money(quote.totalPrice)}` : ''}`}</button></div>
            </div>
          )}
        </div>

        <aside className="panel sticky desk-only"><h2>Your order</h2>{summary}</aside>
      </div>
    </div>
  );
}
