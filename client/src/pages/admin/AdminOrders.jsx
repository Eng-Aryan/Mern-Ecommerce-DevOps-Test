import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, money, shortId, fmtDate, downloadFile } from '../../api.js';
import useDebounce from '../../hooks/useDebounce.js';
import Pagination from '../../components/Pagination.jsx';
import Icon from '../../components/Icon.jsx';
import { Loader } from '../../components/Loader.jsx';
import { PageHeader } from './ui.jsx';

const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [sel, setSel] = useState([]);
  const [q, setQ] = useState(params.get('q') || '');
  const dq = useDebounce(q, 300);
  const f = { status: params.get('status') || '', payment: params.get('payment') || '', method: params.get('method') || '', from: params.get('from') || '', to: params.get('to') || '', page: Number(params.get('page')) || 1 };
  const filters = { q: params.get('q') || undefined, status: f.status || undefined, payment: f.payment || undefined, method: f.method || undefined, from: f.from || undefined, to: f.to || undefined };

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: 1, ...patch }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };
  useEffect(() => { if ((params.get('q') || '') !== dq) set({ q: dq }); }, [dq]); // eslint-disable-line

  const load = () => api.get('/admin/orders', { params: { ...filters, page: f.page } }).then((r) => { setData(r.data); setSel([]); }).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, [params.toString()]); // eslint-disable-line

  const update = async (id, patch) => {
    try { await api.put(`/admin/orders/${id}`, patch); toast.success('Order updated'); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const bulk = async (status) => {
    try {
      const { data: r } = await api.put('/admin/orders-bulk', { ids: sel, status });
      toast.success(`${r.updated} order${r.updated === 1 ? '' : 's'} updated`);
      if (r.failed.length) toast.error(r.failed[0]);
      load();
    } catch (e) { toast.error(errMsg(e)); }
  };
  const all = data && data.orders.length > 0 && sel.length === data.orders.length;

  return (
    <>
      <PageHeader title="Orders" sub={data ? `${data.total} order${data.total === 1 ? '' : 's'}` : ''}>
        <button className="btn ghost small" onClick={() => downloadFile('/admin/orders/export', 'orders.csv', filters).catch((e) => toast.error(errMsg(e)))}><Icon name="download" size={16} /> Export CSV</button>
      </PageHeader>

      <div className="toolbar">
        <div className="search-in"><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order #, customer, tracking…" aria-label="Search orders" /></div>
        <select value={f.status} onChange={(e) => set({ status: e.target.value })} aria-label="Status"><option value="">Any status</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={f.payment} onChange={(e) => set({ payment: e.target.value })} aria-label="Payment status"><option value="">Paid or unpaid</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select>
        <select value={f.method} onChange={(e) => set({ method: e.target.value })} aria-label="Payment method"><option value="">Any method</option><option value="COD">Pay on delivery</option><option value="Stripe">Card</option></select>
        <label className="date-in">From<input type="date" value={f.from} onChange={(e) => set({ from: e.target.value })} /></label>
        <label className="date-in">To<input type="date" value={f.to} onChange={(e) => set({ to: e.target.value })} /></label>
      </div>

      {sel.length > 0 && (
        <div className="bulkbar"><strong>{sel.length} selected</strong><span className="muted small">Set status to</span>
          {STATUSES.map((s) => <button key={s} className="btn small ghost" onClick={() => bulk(s)}>{s}</button>)}
        </div>
      )}

      {!data ? <Loader /> : (
        <>
          <div className="table-wrap">
            <table className="responsive">
              <thead><tr><th className="chk"><input type="checkbox" checked={Boolean(all)} onChange={(e) => setSel(e.target.checked ? data.orders.map((o) => o._id) : [])} aria-label="Select all" /></th><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Paid</th><th>Status</th></tr></thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o._id}>
                    <td className="chk"><input type="checkbox" checked={sel.includes(o._id)} onChange={(e) => setSel(e.target.checked ? [...sel, o._id] : sel.filter((x) => x !== o._id))} aria-label={`Select order ${shortId(o._id)}`} /></td>
                    <td data-label="Order"><Link to={`/admin/orders/${o._id}`}><strong>#{shortId(o._id)}</strong></Link></td>
                    <td data-label="Customer">{o.user?.name || 'Deleted user'}<br /><small className="muted">{o.paymentMethod === 'COD' ? 'Pay on delivery' : 'Card'}</small></td>
                    <td data-label="Date">{fmtDate(o.createdAt)}</td>
                    <td data-label="Total">{money(o.totalPrice)}</td>
                    <td data-label="Paid"><label className="check"><input type="checkbox" checked={o.isPaid} onChange={(e) => update(o._id, { isPaid: e.target.checked })} /> {o.isPaid ? 'Paid' : 'Unpaid'}</label></td>
                    <td data-label="Status">
                      <select value={o.status} onChange={(e) => update(o._id, { status: e.target.value })} aria-label={`Status of order ${shortId(o._id)}`} className={`st-select ${o.status.toLowerCase()}`}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                    </td>
                  </tr>
                ))}
                {data.orders.length === 0 && <tr><td colSpan="7" className="muted">No orders match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={(n) => set({ page: n })} />
        </>
      )}
    </>
  );
}
