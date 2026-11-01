import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, money, fmtDate, downloadFile } from '../../api.js';
import useDebounce from '../../hooks/useDebounce.js';
import Pagination from '../../components/Pagination.jsx';
import Icon from '../../components/Icon.jsx';
import { Loader } from '../../components/Loader.jsx';
import { PageHeader } from './ui.jsx';

export default function AdminUsers() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [q, setQ] = useState(params.get('q') || '');
  const dq = useDebounce(q, 300);
  const page = Number(params.get('page')) || 1;

  const set = (patch) => { const n = new URLSearchParams(params); Object.entries({ page: 1, ...patch }).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k))); setParams(n, { replace: true }); };
  useEffect(() => { if ((params.get('q') || '') !== dq) set({ q: dq }); }, [dq]); // eslint-disable-line
  useEffect(() => { api.get('/admin/users', { params: { q: params.get('q') || undefined, page } }).then((r) => setData(r.data)).catch((e) => toast.error(errMsg(e))); }, [params.toString()]); // eslint-disable-line

  return (
    <>
      <PageHeader title="Customers" sub={data ? `${data.total} account${data.total === 1 ? '' : 's'}` : ''}>
        <button className="btn ghost small" onClick={() => downloadFile('/admin/users/export', 'customers.csv', { q: params.get('q') || undefined }).catch((e) => toast.error(errMsg(e)))}><Icon name="download" size={16} /> Export CSV</button>
      </PageHeader>
      <div className="toolbar"><div className="search-in"><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone…" aria-label="Search customers" /></div></div>
      {!data ? <Loader /> : (
        <>
          <div className="table-wrap">
            <table className="responsive">
              <thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>Spent</th><th>Joined</th><th>Status</th></tr></thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u._id}>
                    <td data-label="Name"><Link to={`/admin/users/${u._id}`}><strong>{u.name}</strong></Link>{u.isAdmin && <span className="pill">Admin</span>}</td>
                    <td data-label="Email">{u.email}</td>
                    <td data-label="Orders">{u.orderCount}</td>
                    <td data-label="Spent">{money(u.totalSpent)}</td>
                    <td data-label="Joined">{fmtDate(u.createdAt)}</td>
                    <td data-label="Status">{u.isBlocked ? <span className="pill off">Suspended</span> : 'Active'}</td>
                  </tr>
                ))}
                {data.users.length === 0 && <tr><td colSpan="6" className="muted">No customers found.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={(n) => set({ page: n })} />
        </>
      )}
    </>
  );
}
