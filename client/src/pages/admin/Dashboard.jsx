import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, money, shortId, fmtDate } from '../../api.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import Icon from '../../components/Icon.jsx';
import { Loader, ErrorBox } from '../../components/Loader.jsx';
import { PageHeader, Card, StatCard, SalesChart, Donut, Thumb } from './ui.jsx';

const STATUS_COLORS = { Processing: '#f2b84b', Shipped: '#4a90b8', Delivered: '#2e9e68', Cancelled: '#c8412b' };

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const [s, setS] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get(`/admin/stats?days=${days}`).then((r) => setS(r.data)).catch((e) => setError(errMsg(e))); }, [days]);

  if (error) return <ErrorBox message={error} />;
  if (!s) return <Loader />;
  const p = s.period;

  return (
    <>
      <PageHeader title="Dashboard" sub={`Last ${days} days compared with the ${days} days before`}>
        <div className="seg" role="group" aria-label="Period">{[7, 30, 90].map((d) => <button key={d} className={days === d ? 'on' : ''} onClick={() => setDays(d)}>{d}d</button>)}</div>
      </PageHeader>

      {(s.pendingOrders > 0 || s.unreadMessages > 0) && (
        <div className="alerts">
          {s.pendingOrders > 0 && <Link to="/admin/orders?status=Processing" className="alert"><Icon name="clipboard" size={16} /> {s.pendingOrders} order{s.pendingOrders > 1 ? 's' : ''} waiting to be processed</Link>}
          {s.unreadMessages > 0 && <Link to="/admin/messages" className="alert"><Icon name="message" size={16} /> {s.unreadMessages} unread message{s.unreadMessages > 1 ? 's' : ''}</Link>}
        </div>
      )}

      <div className="stats">
        <StatCard label="Revenue" value={money(p.revenue)} change={p.revenueChange} icon="trend" hint="vs previous" />
        <StatCard label="Orders" value={p.orders} change={p.ordersChange} icon="clipboard" hint="vs previous" />
        <StatCard label="Avg. order value" value={money(p.avgOrder)} icon="tag" />
        <StatCard label="New customers" value={p.newUsers} change={p.usersChange} icon="users" hint="vs previous" />
      </div>

      <div className="ad-cols">
        <Card title="Sales"><SalesChart series={s.series} /></Card>
        <Card title="Orders by status"><Donut data={Object.keys(STATUS_COLORS).map((k) => ({ label: k, value: s.byStatus[k] || 0, color: STATUS_COLORS[k] }))} /></Card>
      </div>

      <div className="ad-cols even">
        <Card title="Top products" action={<span className="muted small">by revenue</span>}>
          {s.topProducts.length === 0 && <p className="muted">No sales in this period yet.</p>}
          {s.topProducts.map((t) => <div className="mini-row" key={t._id}><Thumb src={t.image} name={t.name} /><span className="grow"><Link to={`/admin/products/${t._id}`}>{t.name}</Link><small className="muted">{t.qty} sold</small></span><strong>{money(t.revenue)}</strong></div>)}
        </Card>
        <Card title="Low stock" action={<Link to="/admin/products?stock=low" className="small">View all</Link>}>
          {s.lowStock.length === 0 && <p className="muted">Everything is well stocked.</p>}
          {s.lowStock.map((x) => <div className="mini-row" key={x._id}><Thumb src={x.images?.[0]} name={x.name} /><span className="grow"><Link to={`/admin/products/${x._id}`}>{x.name}</Link></span><span className={x.countInStock === 0 ? 'bad' : 'warn'}>{x.countInStock === 0 ? 'Out of stock' : `${x.countInStock} left`}</span></div>)}
        </Card>
      </div>

      <Card title="Recent orders" action={<Link to="/admin/orders" className="small">View all</Link>}>
        <div className="table-wrap flat">
          <table className="responsive">
            <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {s.recentOrders.map((o) => (
                <tr key={o._id}>
                  <td data-label="Order"><Link to={`/admin/orders/${o._id}`}>#{shortId(o._id)}</Link></td>
                  <td data-label="Customer">{o.user?.name || 'Deleted user'}</td>
                  <td data-label="Date">{fmtDate(o.createdAt)}</td>
                  <td data-label="Total">{money(o.totalPrice)}</td>
                  <td data-label="Status"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
              {s.recentOrders.length === 0 && <tr><td colSpan="5" className="muted">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
