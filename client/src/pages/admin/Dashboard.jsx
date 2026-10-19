import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, money, shortId, fmtDate } from '../../api.js';
import { Loader, ErrorBox } from '../../components/Loader.jsx';

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/admin/stats').then((r) => setS(r.data)).catch((e) => setError(errMsg(e))); }, []);

  if (error) return <ErrorBox message={error} />;
  if (!s) return <Loader />;
  const max = Math.max(...s.last7.map((d) => d.sales), 1);

  return (
    <>
      <h1>Dashboard</h1>
      <div className="stats">
        <div><span>Revenue</span><strong>{money(s.revenue)}</strong></div>
        <div><span>Orders</span><strong>{s.orders}</strong></div>
        <div><span>Products</span><strong>{s.products}</strong></div>
        <div><span>Customers</span><strong>{s.users}</strong></div>
      </div>

      <div className="admin-cols">
        <section className="panel">
          <h2>Sales, last 7 days</h2>
          <div className="bars">
            {s.last7.map((d) => (
              <div key={d.date} title={`${d.date}: ${money(d.sales)} from ${d.orders} orders`}>
                <i style={{ height: `${(d.sales / max) * 100}%` }} />
                <small>{new Date(d.date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short' })}</small>
              </div>
            ))}
          </div>
          <p className="small muted">
            {['Processing', 'Shipped', 'Delivered', 'Cancelled'].map((k) => `${k}: ${s.byStatus[k] || 0}`).join('   ')}
          </p>
        </section>

        <section className="panel">
          <h2>Low stock</h2>
          {s.lowStock.length === 0 && <p className="muted">Everything is well stocked.</p>}
          {s.lowStock.map((p) => (
            <div className="mini" key={p._id}>
              <Link to={`/admin/products/${p._id}`}>{p.name}</Link>
              <span className={p.countInStock === 0 ? 'bad' : ''}>{p.countInStock} left</span>
            </div>
          ))}
        </section>
      </div>

      <section className="panel">
        <h2>Recent orders</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {s.recentOrders.map((o) => (
                <tr key={o._id}>
                  <td><Link to={`/order/${o._id}`}>#{shortId(o._id)}</Link></td>
                  <td>{o.user?.name || 'Deleted user'}</td>
                  <td>{fmtDate(o.createdAt)}</td>
                  <td>{money(o.totalPrice)}</td>
                  <td><span className={`status ${o.status.toLowerCase()}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
