import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, money } from '../api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import useSeo from '../hooks/useSeo.js';
import Icon from '../components/Icon.jsx';

const Page = ({ title, children, lead }) => {
  useSeo({ title });
  return <div className="container section prose"><h1>{title}</h1>{lead && <p className="lead">{lead}</p>}{children}</div>;
};

export function About() {
  const s = useSettings();
  return (
    <Page title={`About ${s.storeName}`} lead={s.tagline}>
      <p>{s.storeName} sells durable gear for hiking, camping and travel. We pick products that can be repaired rather than replaced, and we test them in real weather before we recommend them.</p>
      <div className="cols-3">
        <div className="panel"><Icon name="shield" /><h3>Built to last</h3><p>Every product is chosen for materials and construction, not trends.</p></div>
        <div className="panel"><Icon name="refresh" /><h3>Easy returns</h3><p>Not right? Send it back within {s.returnDays} days.</p></div>
        <div className="panel"><Icon name="message" /><h3>Real people</h3><p>Questions about fit or kit? <Link to="/contact">Talk to us</Link>.</p></div>
      </div>
    </Page>
  );
}

export function Contact() {
  const s = useSettings();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api.post('/contact', form); setSent(true); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <Page title="Contact us" lead="Questions about an order, sizing or kit? Send us a message and we'll reply as soon as we can.">
      <div className="two-col">
        {sent ? <div className="panel"><h2>Message sent</h2><p>Thanks, we'll be in touch soon.</p></div> : (
          <form className="form" onSubmit={submit}>
            <div className="fields"><label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></label><label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label></div>
            <label>Subject<input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
            <label>Message<textarea required rows="6" maxLength={4000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
            <button className="btn big" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
          </form>
        )}
        <aside className="panel">
          <h2>Details</h2>
          {s.contact?.email && <p><Icon name="mail" size={16} /> <a href={`mailto:${s.contact.email}`}>{s.contact.email}</a></p>}
          {s.contact?.phone && <p><Icon name="phone" size={16} /> <a href={`tel:${s.contact.phone.replace(/\s/g, '')}`}>{s.contact.phone}</a></p>}
          {s.contact?.address && <p><Icon name="pin" size={16} /> {s.contact.address}</p>}
          {s.contact?.hours && <p className="muted">{s.contact.hours}</p>}
        </aside>
      </div>
    </Page>
  );
}

export function FAQ() {
  const s = useSettings();
  const q = [
    ['How long does delivery take?', 'Standard delivery usually takes 3–7 working days. Express takes 1–3 working days. Orders leave within two working days.'],
    ['How much does shipping cost?', `Standard shipping is ${money(s.shippingFlat)}${s.freeShippingOver > 0 ? ` and free on orders over ${money(s.freeShippingOver)}` : ''}.${s.expressEnabled ? ` Express shipping is ${money(s.expressShipping)}.` : ''}`],
    ['Can I pay on delivery?', s.codEnabled ? 'Yes. Choose "Pay on delivery" at checkout and pay the courier when your order arrives.' : 'Pay on delivery is not available right now. You can pay by card at checkout.'],
    ['How do I track my order?', <>Sign in and open <Link to="/orders">My orders</Link>. Once your order ships you'll see the carrier and tracking number.</>],
    ['Can I cancel my order?', 'You can cancel an order yourself while it is still processing and unpaid. After that, contact us and we will help.'],
    ['What is your returns policy?', `You can return unused items within ${s.returnDays} days of delivery for a refund. See Shipping & returns for details.`],
  ];
  return (
    <Page title="Help & FAQ">
      {q.map(([a, b]) => <details key={a} className="faq"><summary>{a}</summary><p>{b}</p></details>)}
      <p>Still stuck? <Link to="/contact">Contact us</Link>.</p>
    </Page>
  );
}

export function ShippingReturns() {
  const s = useSettings();
  return (
    <Page title="Shipping & returns">
      <h2>Shipping</h2>
      <p>Standard shipping costs {money(s.shippingFlat)}{s.freeShippingOver > 0 ? ` and is free for orders over ${money(s.freeShippingOver)}` : ''}. {s.expressEnabled && `Express shipping costs ${money(s.expressShipping)}. `}Orders are dispatched within two working days. Taxes are added at checkout.</p>
      <h2>Returns</h2>
      <p>If something isn't right, return it within {s.returnDays} days of delivery in its original condition and we'll refund you. Contact us first so we can give you a return address.</p>
      <h2>Damaged or wrong item?</h2>
      <p>Tell us within 7 days and we'll replace it or refund you, including return postage.</p>
    </Page>
  );
}

export function Privacy() {
  const s = useSettings();
  return (
    <Page title="Privacy policy">
      <p>{s.storeName} collects only the information needed to process your orders and run your account: your name, email, phone, delivery addresses and order history.</p>
      <h2>How we use it</h2><p>To fulfil and deliver orders, send order updates, provide customer support, and, if you subscribe, send our newsletter. We do not sell your data.</p>
      <h2>Payments</h2><p>Card payments are handled by Stripe. We never see or store your card number.</p>
      <h2>Your choices</h2><p>You can update your details in your account, unsubscribe from emails at any time, or ask us to delete your account at {s.contact?.email || 'our contact address'}.</p>
    </Page>
  );
}

export function Terms() {
  const s = useSettings();
  return (
    <Page title="Terms of service">
      <p>By using {s.storeName} you agree to these terms.</p>
      <h2>Orders</h2><p>Prices and availability can change. An order is accepted when we confirm it. We may cancel an order if an item is unavailable or a price was shown incorrectly, and we will refund any payment.</p>
      <h2>Delivery & returns</h2><p>See our <Link to="/shipping-returns">Shipping & returns</Link> page.</p>
      <h2>Accounts</h2><p>Keep your password private. You are responsible for activity on your account.</p>
    </Page>
  );
}
