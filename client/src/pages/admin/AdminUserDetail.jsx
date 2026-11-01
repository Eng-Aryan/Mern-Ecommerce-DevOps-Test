import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, money, shortId, fmtDate } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Icon from '../../components/Icon.jsx';
import { Loader, ErrorBox } from '../../components/Loader.jsx';
import { PageHeader, Card, StatCard } from './ui.jsx';

export default function AdminUserDetail() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const { confirm } = useUI();
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const load = () => api.get(`/admin/users/${id}`).then((r) => setD(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  if (error) return <ErrorBox message={error} />;
  if (!d) return <Loader />;
  const { user: u, orders, totals } = d;
  const self = u._id === me._id;
  const act = async (fn, msg) => { try { await fn(); toast.success(msg); load(); } catch (e) { toast.error(errMsg(e)); } };

  return (
    <>
      <PageHeader title={u.name} sub={u.email}>
        <Link to="/admin/users" className="btn ghost small"><Icon name="arrowLeft" size={16} /> Customers</Link>
        <a className="btn ghost small" href={`mailto:${u.email}`}><Icon name="mail" size={16} /> Email</a>
      </PageHeader>
      <div className="stats">
        <StatCard label="Orders" value={totals.orders} icon="clipboard" />
        <StatCard label="Total spent" value={money(totals.spent)} icon="trend" />
        <StatCard label="Member since" value={fmtDate(u.createdAt)} icon="user" />
        <StatCard label="Last sign-in" value={fmtDate(u.lastLoginAt)} icon="lock" />
      </div>
      <div className="ad-cols form-cols">
        <Card title="Orders">
          <div className="table-wrap flat"><table className="responsive"><thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>
            {orders.map((o) => <tr key={o._id}><td data-label="Order"><Link to={`/admin/orders/${o._id}`}>#{shortId(o._id)}</Link></td><td data-label="Date">{fmtDate(o.createdAt)}</td><td data-label="Total">{money(o.totalPrice)}</td><td data-label="Status"><StatusBadge status={o.status} /></td></tr>)}
            {orders.length === 0 && <tr><td colSpan="4" className="muted">No orders yet.</td></tr>}
          </tbody></table></div>
        </Card>
        <Card title="Account">
          <p>{u.phone || <span className="muted">No phone</span>}</p>
          <p>{u.isAdmin ? <span className="pill">Admin</span> : 'Customer'} {u.isBlocked && <span className="pill off">Suspended</span>}</p>
          {self ? <p className="muted small">This is your own account.</p> : (
            <div className="stack-btns">
              <button className="btn ghost small" onClick={() => act(() => api.put(`/admin/users/${u._id}`, { isAdmin: !u.isAdmin }), 'Role updated')}>{u.isAdmin ? 'Remove admin access' : 'Make admin'}</button>
              <button className="btn ghost small" onClick={() => act(() => api.put(`/admin/users/${u._id}`, { isBlocked: !u.isBlocked }), u.isBlocked ? 'Account reactivated' : 'Account suspended')}>{u.isBlocked ? 'Reactivate account' : 'Suspend account'}</button>
              <button className="btn danger small" onClick={async () => { if (await confirm({ title: `Delete ${u.name}?`, message: 'Their account is removed. Past orders are kept.', confirmLabel: 'Delete', danger: true })) act(async () => { await api.delete(`/admin/users/${u._id}`); navigate('/admin/users'); }, 'User deleted'); }}>Delete account</button>
            </div>
          )}
          {u.addresses?.length > 0 && <><h3>Saved addresses</h3>{u.addresses.map((a) => <p key={a._id} className="small">{a.label}: {a.address}, {a.city}, {a.country}</p>)}</>}
        </Card>
      </div>
    </>
  );
}
