import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, money, shortId, fmtDate } from '../api.js';
import useSeo from '../hooks/useSeo.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { Loader, ErrorBox } from '../components/Loader.jsx';

const FILTERS = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function MyOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [f, setF] = useState('All');
  useSeo({ title: 'My orders' });
  useEffect(() => { api.get('/orders/mine').then((r) => setOrders(r.data)).catch((e) => setError(errMsg(e))); }, []);
  const list = orders?.filter((o) => f === 'All' || o.status === f);

  return (
    <div className="container section">
      <h1>My orders</h1>
      <div className="chips">{FILTERS.map((x) => <button key={x} className={`chip ${f === x ? 'on' : ''}`} onClick={() => setF(x)}>{x}</button>)}</div>
      {error && <ErrorBox message={error} />}
      {!orders && !error && <Loader />}
      {orders?.length === 0 && <div className="empty"><p>You haven't ordered anything yet.</p><Link to="/shop" className="btn">Start shopping</Link></div>}
      {list?.length === 0 && orders.length > 0 && <p className="muted">No {f.toLowerCase()} orders.</p>}
      <div className="order-cards">
        {list?.map((o) => (
          <Link key={o._id} to={`/order/${o._id}`} className="order-card">
            <div className="row between"><strong>#{shortId(o._id)}</strong><StatusBadge status={o.status} /></div>
            <div className="thumbs-row">{o.items.slice(0, 4).map((i) => <ProductImage key={i._id} src={i.image} name={i.name} />)}{o.items.length > 4 && <span className="more-count">+{o.items.length - 4}</span>}</div>
            <div className="row between muted small"><span>{fmtDate(o.createdAt)} · {o.items.reduce((s, i) => s + i.qty, 0)} items</span><span>{o.isPaid ? 'Paid' : 'Unpaid'}</span></div>
            <strong>{money(o.totalPrice)}</strong>
          </Link>
        ))}
      </div>
    </div>
  );
}
