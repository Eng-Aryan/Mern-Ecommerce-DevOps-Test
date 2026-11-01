import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg, fmtDate, downloadFile } from '../../api.js';
import { useUI } from '../../context/UIContext.jsx';
import useDebounce from '../../hooks/useDebounce.js';
import Pagination from '../../components/Pagination.jsx';
import Icon from '../../components/Icon.jsx';
import { Loader } from '../../components/Loader.jsx';
import { PageHeader } from './ui.jsx';

export default function AdminSubscribers() {
  const { confirm } = useUI();
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q, 300);
  const load = () => api.get('/admin/subscribers', { params: { q: dq || undefined, page } }).then((r) => setData(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { setPage(1); }, [dq]);
  useEffect(() => { load(); }, [dq, page]); // eslint-disable-line
  const remove = async (s) => { if (await confirm({ title: `Remove ${s.email}?`, confirmLabel: 'Remove', danger: true })) api.delete(`/admin/subscribers/${s._id}`).then(load).catch((e) => toast.error(errMsg(e))); };

  return (
    <>
      <PageHeader title="Subscribers" sub={data ? `${data.total} on the newsletter list` : ''}>
        <button className="btn ghost small" onClick={() => downloadFile('/admin/subscribers/export', 'subscribers.csv').catch((e) => toast.error(errMsg(e)))}><Icon name="download" size={16} /> Export CSV</button>
      </PageHeader>
      <div className="toolbar"><div className="search-in"><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email…" aria-label="Search subscribers" /></div></div>
      {!data ? <Loader /> : (
        <>
          <div className="table-wrap"><table className="responsive"><thead><tr><th>Email</th><th>Subscribed</th><th></th></tr></thead><tbody>
            {data.subscribers.map((s) => <tr key={s._id}><td data-label="Email">{s.email}</td><td data-label="Subscribed">{fmtDate(s.createdAt)}</td><td className="actions"><button className="icon-btn danger" onClick={() => remove(s)} aria-label={`Remove ${s.email}`}><Icon name="trash" size={18} /></button></td></tr>)}
            {data.subscribers.length === 0 && <tr><td colSpan="3" className="muted">No subscribers yet.</td></tr>}
          </tbody></table></div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
