import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, money, shortId, fmtDate } from '../api.js';
import { Loader, ErrorBox } from '../components/Loader.jsx';

export default function MyOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/orders/mine').then((r) => setOrders(r.data)).catch((e) => setError(errMsg(e))); }, []);

  return (
    <div className="container section">
      <h1>Order history</h1>
      {error && <ErrorBox message={error} />}
      {!orders && !error && <Loader />}
      {orders?.length === 0 && <div className="empty"><p>You haven't ordered anything yet.</p><Link to="/shop" className="btn">Start shopping</Link></div>}
      {orders?.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td><Link to={`/order/${o._id}`}>#{shortId(o._id)}</Link></td>
                  <td>{fmtDate(o.createdAt)}</td>
                  <td>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td>{money(o.totalPrice)}</td>
                  <td>{o.isPaid ? 'Paid' : 'Unpaid'}</td>
                  <td><span className={`status ${o.status.toLowerCase()}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
