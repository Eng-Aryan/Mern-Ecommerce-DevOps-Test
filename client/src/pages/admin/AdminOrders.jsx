import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, money, shortId, fmtDate } from '../../api.js';
import Pagination from '../../components/Pagination.jsx';
import { Loader } from '../../components/Loader.jsx';

const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const load = () => api.get(`/admin/orders?page=${page}${status ? `&status=${status}` : ''}`).then((r) => setData(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, [page, status]); // eslint-disable-line

  const update = async (id, patch) => {
    try { await api.put(`/admin/orders/${id}`, patch); toast.success('Order updated'); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <>
      <div className="row between wrap">
        <h1>Orders</h1>
        <label className="sort">Status
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>
      {!data ? <Loader /> : data.orders.length === 0 ? <p className="muted">No orders found.</p> : (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Paid</th><th>Status</th></tr></thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o._id}>
                    <td><Link to={`/order/${o._id}`}>#{shortId(o._id)}</Link></td>
                    <td>{o.user?.name || 'Deleted user'}<br /><small className="muted">{o.paymentMethod}</small></td>
                    <td>{fmtDate(o.createdAt)}</td>
                    <td>{money(o.totalPrice)}</td>
                    <td>
                      <label className="check"><input type="checkbox" checked={o.isPaid} onChange={(e) => update(o._id, { isPaid: e.target.checked })} /> {o.isPaid ? 'Paid' : 'Unpaid'}</label>
                    </td>
                    <td>
                      <select value={o.status} onChange={(e) => update(o._id, { status: e.target.value })} aria-label={`Status of order ${shortId(o._id)}`}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
