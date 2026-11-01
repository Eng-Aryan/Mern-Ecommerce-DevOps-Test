import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, money, shortId, fmtDate, fmtDateTime } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import useSeo from '../hooks/useSeo.js';
import ProductImage from '../components/ProductImage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Summary from '../components/Summary.jsx';
import Icon from '../components/Icon.jsx';
import { Loader, ErrorBox } from '../components/Loader.jsx';

const STEPS = ['Processing', 'Shipped', 'Delivered'];

export default function OrderPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { add, openDrawer } = useCart();
  const s = useSettings();
  const { confirm } = useUI();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const placed = params.get('placed') === '1';
  useSeo({ title: `Order #${shortId(id)}` });

  useEffect(() => {
    const sessionId = params.get('session_id');
    (async () => {
      try {
        if (sessionId) {
          try { await api.post(`/payment/confirm/${id}`, { sessionId }); toast.success('Payment received'); } catch (e) { toast.error(errMsg(e)); }
          setParams({}, { replace: true });
        }
        setOrder((await api.get(`/orders/${id}`)).data);
      } catch (e) { setError(errMsg(e)); }
    })();
  }, [id]); // eslint-disable-line

  const pay = async () => {
    setBusy(true);
    try { window.location.href = (await api.post(`/payment/session/${id}`)).data.url; } catch (e) { toast.error(errMsg(e)); setBusy(false); }
  };
  const cancel = async () => {
    if (!(await confirm({ title: 'Cancel this order?', message: 'Your items go back into stock.', confirmLabel: 'Cancel order', danger: true }))) return;
    try { setOrder({ ...(await api.put(`/orders/${id}/cancel`)).data, user: order.user }); toast.success('Order cancelled'); } catch (e) { toast.error(errMsg(e)); }
  };
  const buyAgain = async () => {
    let added = 0;
    for (const i of order.items) {
      try {
        const { product } = (await api.get(`/products/${i.product}`)).data;
        const v = i.variant ? product.variants.find((x) => x._id === i.variant) : null;
        if ((v ? v.countInStock : product.countInStock) > 0) { add(product, i.qty, v); added++; }
      } catch { /* product no longer sold */ }
    }
    added ? (toast.success(`${added} item${added > 1 ? 's' : ''} added to your cart`), openDrawer()) : toast.error('Those items are no longer available');
  };

  if (error) return <div className="container section"><ErrorBox message={error} /></div>;
  if (!order) return <div className="container section"><Loader /></div>;

  const step = STEPS.indexOf(order.status);
  const a = order.shippingAddress;
  const history = order.statusHistory?.length ? order.statusHistory : [{ status: order.status, at: order.createdAt }];

  return (
    <div className="container section order-page">
      {placed && (
        <div className="success-banner" role="status">
          <Icon name="check" size={28} />
          <div><h2>Thank you, your order is in!</h2><p>We've emailed a confirmation. You can follow its progress on this page.</p></div>
        </div>
      )}
      <p className="small muted no-print"><Link to="/orders">Orders</Link> / #{shortId(order._id)}</p>
      <div className="row between wrap">
        <h1>Order #{shortId(order._id)}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="muted">Placed {fmtDate(order.createdAt)}</p>

      {order.status !== 'Cancelled' && <ol className="steps">{STEPS.map((t, i) => <li key={t} className={i <= step ? 'done' : ''}>{t}</li>)}</ol>}

      {order.trackingNumber && (
        <div className="panel tracking">
          <Icon name="truck" />
          <div className="grow"><strong>{order.carrier || 'Carrier'}</strong><p className="muted small">Tracking number</p></div>
          <code>{order.trackingNumber}</code>
          <button className="icon-btn no-print" onClick={() => { navigator.clipboard?.writeText(order.trackingNumber); toast.success('Copied'); }} aria-label="Copy tracking number"><Icon name="copy" size={18} /></button>
        </div>
      )}

      <div className="two-col">
        <div>
          <div className="lines">
            {order.items.map((i) => (
              <div className="line" key={i._id}>
                <Link to={`/product/${i.product}`}><ProductImage src={i.image} name={i.name} /></Link>
                <div className="grow"><strong>{i.name}</strong>{i.variantLabel && <p className="small muted">{i.variantLabel}</p>}<p className="muted small">{i.qty} × {money(i.price)}</p></div>
                <strong>{money(i.qty * i.price)}</strong>
              </div>
            ))}
          </div>

          <div className="cols-2">
            <div><h3>Shipping to</h3><p>{a.fullName}<br />{a.address}<br />{a.city}, {a.postalCode}<br />{a.country}{a.phone && <><br />{a.phone}</>}</p></div>
            <div><h3>Delivery</h3><p>{order.shippingMethod === 'express' ? 'Express' : 'Standard'} shipping{order.customerNote && <><br /><span className="muted">Note: {order.customerNote}</span></>}</p></div>
          </div>

          <h3>Order history</h3>
          <ul className="timeline">{[...history].reverse().map((h, k) => <li key={k}><b>{h.status}</b><span>{h.note}</span><time className="muted small">{fmtDateTime(h.at)}</time></li>)}</ul>
        </div>

        <aside className="panel">
          <h2>Payment</h2>
          <p className={order.isPaid ? 'good' : 'muted'}>{order.isPaid ? `Paid on ${fmtDate(order.paidAt)}` : order.paymentMethod === 'COD' ? 'Pay on delivery' : 'Awaiting payment'}</p>
          <Summary q={order} />
          {!order.isPaid && order.paymentMethod === 'Stripe' && order.status !== 'Cancelled' && <button className="btn big block no-print" onClick={pay} disabled={busy}>Pay {money(order.totalPrice)} now</button>}
          <button className="btn ghost block no-print" onClick={buyAgain}><Icon name="refresh" size={16} /> Buy again</button>
          <button className="btn ghost block no-print" onClick={() => window.print()}><Icon name="printer" size={16} /> Print invoice</button>
          {order.status === 'Processing' && !order.isPaid && <button className="btn danger block no-print" onClick={cancel}>Cancel order</button>}
          <p className="small muted no-print">Need help? <Link to="/contact">Contact us</Link>. Returns accepted within {s.returnDays} days.</p>
        </aside>
      </div>
      <p className="print-only small">{s.storeName} · {s.contact?.email} · {s.contact?.phone}</p>
    </div>
  );
}
