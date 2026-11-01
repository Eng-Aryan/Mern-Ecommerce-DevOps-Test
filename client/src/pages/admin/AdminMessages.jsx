import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg, fmtDateTime } from '../../api.js';
import { useUI } from '../../context/UIContext.jsx';
import Pagination from '../../components/Pagination.jsx';
import Icon from '../../components/Icon.jsx';
import { Loader } from '../../components/Loader.jsx';
import { PageHeader } from './ui.jsx';

export default function AdminMessages() {
  const { confirm } = useUI();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const load = () => api.get('/admin/messages', { params: { status: status || undefined, page } }).then((r) => setData(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, [status, page]); // eslint-disable-line

  const setS = (m, s) => api.put(`/admin/messages/${m._id}`, { status: s }).then(load).catch((e) => toast.error(errMsg(e)));
  const toggle = (m) => { setOpen(open === m._id ? null : m._id); if (m.status === 'new') setS(m, 'read'); };
  const remove = async (m) => { if (await confirm({ title: 'Delete this message?', confirmLabel: 'Delete', danger: true })) api.delete(`/admin/messages/${m._id}`).then(load).catch((e) => toast.error(errMsg(e))); };

  return (
    <>
      <PageHeader title="Messages" sub="From the contact form">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter"><option value="">All</option><option value="new">New</option><option value="read">Read</option><option value="replied">Replied</option></select>
      </PageHeader>
      {!data ? <Loader /> : (
        <>
          <div className="msg-list">
            {data.messages.map((m) => (
              <article key={m._id} className={`panel msg ${m.status === 'new' ? 'unread' : ''}`}>
                <button className="msg-head" onClick={() => toggle(m)} aria-expanded={open === m._id}>
                  <span className="grow"><strong>{m.name}</strong> <span className="muted small">&lt;{m.email}&gt;</span><br /><span>{m.subject || '(no subject)'}</span></span>
                  <span className="muted small">{fmtDateTime(m.createdAt)}</span>
                  <span className={`pill ${m.status === 'new' ? '' : 'off'}`}>{m.status}</span>
                </button>
                {open === m._id && (
                  <div className="msg-body">
                    <p>{m.message}</p>
                    <div className="row wrap">
                      <a className="btn small" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Your message'))}`} onClick={() => setS(m, 'replied')}><Icon name="mail" size={16} /> Reply by email</a>
                      {m.status !== 'replied' && <button className="btn small ghost" onClick={() => setS(m, 'replied')}>Mark replied</button>}
                      <button className="btn small danger" onClick={() => remove(m)}>Delete</button>
                    </div>
                  </div>
                )}
              </article>
            ))}
            {data.messages.length === 0 && <p className="muted">No messages.</p>}
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
