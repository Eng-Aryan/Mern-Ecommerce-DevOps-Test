import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, money, shortId, fmtDate } from '../api.js';
import ProductImage from '../components/ProductImage.jsx';
import Summary from '../components/Summary.jsx';
import { Loader, ErrorBox } from '../components/Loader.jsx';

const STEPS = ['Processing', 'Shipped', 'Delivered'];

export default function OrderPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sessionId = params.get('session_id');
    (async () => {
      try {
        if (sessionId) {
          try {
            await api.post(`/payment/confirm/${id}`, { sessionId });
            toast.success('Payment received');
          } catch (e) {
            toast.error(errMsg(e));
          }
          setParams({}, { replace: true });
        }
        setOrder((await api.get(`/orders/${id}`)).data);
      } catch (e) {
        setError(errMsg(e));
      }
    })();
  }, [id]); // eslint-disable-line

  const pay = async () => {
    setBusy(true);
    try {
      window.location.href = (await api.post(`/payment/session/${id}`)).data.url;
    } catch (e) {
      toast.error(errMsg(e));
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      setOrder({ ...(await api.put(`/orders/${id}/cancel`)).data, user: order.user });
      toast.success('Order cancelled');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  if (error) return <div className="container section"><ErrorBox message={error} /></div>;
  if (!order) return <div className="container section"><Loader /></div>;

  const step = STEPS.indexOf(order.status);
  const a = order.shippingAddress;

  return (
    <div className="container section">
      <p className="small muted"><Link to="/orders">Orders</Link> / #{shortId(order._id)}</p>
      <div className="row between wrap">
        <h1>Order #{shortId(order._id)}</h1>
        <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span>
      </div>
      <p className="muted">Placed {fmtDate(order.createdAt)}</p>

      {order.status !== 'Cancelled' && (
        <ol className="steps">
          {STEPS.map((s, i) => <li key={s} className={i <= step ? 'done' : ''}>{s}</li>)}
        </ol>
      )}

      <div className="two-col">
        <div>
          <div className="lines">
            {order.items.map((i) => (
              <div className="line" key={i._id}>
                <Link to={`/product/${i.product}`}><ProductImage src={i.image} name={i.name} /></Link>
                <div className="grow"><strong>{i.name}</strong><p className="muted small">{i.qty} × {money(i.price)}</p></div>
                <strong>{money(i.qty * i.price)}</strong>
              </div>
            ))}
          </div>
          <h3>Shipping to</h3>
          <p>{a.fullName}<br />{a.address}<br />{a.city}, {a.postalCode}<br />{a.country}{a.phone && <><br />{a.phone}</>}</p>
        </div>

        <aside className="panel">
          <h2>Payment</h2>
          <p className={order.isPaid ? 'good' : 'muted'}>
            {order.isPaid ? `Paid on ${fmtDate(order.paidAt)}` : order.paymentMethod === 'COD' ? 'Pay on delivery' : 'Awaiting payment'}
          </p>
          <Summary q={order} />
          {!order.isPaid && order.paymentMethod === 'Stripe' && order.status !== 'Cancelled' && (
            <button className="btn big block" onClick={pay} disabled={busy}>Pay {money(order.totalPrice)} now</button>
          )}
          {order.status === 'Processing' && !order.isPaid && (
            <button className="btn ghost block" onClick={cancel}>Cancel order</button>
          )}
        </aside>
      </div>
    </div>
  );
}
