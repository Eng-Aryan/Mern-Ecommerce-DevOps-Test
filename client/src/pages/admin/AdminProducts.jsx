import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, money, downloadFile } from '../../api.js';
import { useUI } from '../../context/UIContext.jsx';
import useDebounce from '../../hooks/useDebounce.js';
import Pagination from '../../components/Pagination.jsx';
import Icon from '../../components/Icon.jsx';
import { Loader } from '../../components/Loader.jsx';
import { PageHeader, Thumb } from './ui.jsx';

export default function AdminProducts() {
  const { confirm } = useUI();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [cats, setCats] = useState([]);
  const [sel, setSel] = useState([]);
  const [q, setQ] = useState(params.get('q') || '');
  const dq = useDebounce(q, 300);
  const f = { category: params.get('category') || '', stock: params.get('stock') || '', status: params.get('status') || '', page: Number(params.get('page')) || 1 };

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: 1, ...patch }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };
  useEffect(() => { if ((params.get('q') || '') !== dq) set({ q: dq }); }, [dq]); // eslint-disable-line
  useEffect(() => { api.get('/admin/categories').then((r) => setCats(r.data)).catch(() => {}); }, []);

  const load = () => api.get('/admin/products', { params: { q: params.get('q') || undefined, category: f.category || undefined, stock: f.stock || undefined, status: f.status || undefined, page: f.page, limit: 12 } })
    .then((r) => { setData(r.data); setSel([]); }).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, [params.toString()]); // eslint-disable-line

  const bulk = async (action) => {
    if (action === 'delete' && !(await confirm({ title: `Delete ${sel.length} product${sel.length > 1 ? 's' : ''}?`, message: "This can't be undone.", confirmLabel: 'Delete', danger: true }))) return;
    try { await api.post('/admin/products/bulk', { ids: sel, action }); toast.success('Done'); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const remove = async (p) => {
    if (!(await confirm({ title: `Delete "${p.name}"?`, message: "This can't be undone.", confirmLabel: 'Delete', danger: true }))) return;
    try { await api.delete(`/products/${p._id}`); toast.success('Product deleted'); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const duplicate = async (p) => {
    try { await api.post(`/admin/products/${p._id}/duplicate`); toast.success('Duplicated as a draft'); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const all = data && data.products.length > 0 && sel.length === data.products.length;

  return (
    <>
      <PageHeader title="Products" sub={data ? `${data.total} product${data.total === 1 ? '' : 's'}` : ''}>
        <button className="btn ghost small" onClick={() => downloadFile('/admin/products/export', 'products.csv').catch((e) => toast.error(errMsg(e)))}><Icon name="download" size={16} /> Export</button>
        <Link to="/admin/products/new" className="btn small"><Icon name="plus" size={16} /> Add product</Link>
      </PageHeader>

      <div className="toolbar">
        <div className="search-in"><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, SKU, brand…" aria-label="Search products" /></div>
        <select value={f.category} onChange={(e) => set({ category: e.target.value })} aria-label="Category"><option value="">All categories</option>{cats.map((c) => <option key={c.name}>{c.name}</option>)}</select>
        <select value={f.stock} onChange={(e) => set({ stock: e.target.value })} aria-label="Stock"><option value="">Any stock</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
        <select value={f.status} onChange={(e) => set({ status: e.target.value })} aria-label="Status"><option value="">Any status</option><option value="active">Published</option><option value="draft">Draft</option></select>
      </div>

      {sel.length > 0 && (
        <div className="bulkbar"><strong>{sel.length} selected</strong>
          <button className="btn small ghost" onClick={() => bulk('publish')}>Publish</button><button className="btn small ghost" onClick={() => bulk('unpublish')}>Unpublish</button>
          <button className="btn small ghost" onClick={() => bulk('feature')}>Feature</button><button className="btn small ghost" onClick={() => bulk('unfeature')}>Unfeature</button>
          <button className="btn small danger" onClick={() => bulk('delete')}>Delete</button>
        </div>
      )}

      {!data ? <Loader /> : (
        <>
          <div className="table-wrap">
            <table className="responsive">
              <thead><tr><th className="chk"><input type="checkbox" checked={Boolean(all)} onChange={(e) => setSel(e.target.checked ? data.products.map((p) => p._id) : [])} aria-label="Select all" /></th><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th><th></th></tr></thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p._id}>
                    <td className="chk"><input type="checkbox" checked={sel.includes(p._id)} onChange={(e) => setSel(e.target.checked ? [...sel, p._id] : sel.filter((x) => x !== p._id))} aria-label={`Select ${p.name}`} /></td>
                    <td className="thumb"><Thumb src={p.images?.[0]} name={p.name} /></td>
                    <td data-label="Name"><Link to={`/admin/products/${p._id}`}><strong>{p.name}</strong></Link>{p.isActive === false && <span className="pill off">Draft</span>}{p.featured && <span className="pill">Featured</span>}<br /><small className="muted">{p.sku || '—'}{p.variants?.length > 0 && ` · ${p.variants.length} options`}</small></td>
                    <td data-label="Category">{p.category}</td>
                    <td data-label="Price">{money(p.price)}</td>
                    <td data-label="Stock" className={p.countInStock === 0 ? 'bad' : p.countInStock <= 5 ? 'warn' : ''}>{p.countInStock}</td>
                    <td data-label="Sold">{p.sold || 0}</td>
                    <td className="actions">
                      <Link to={`/product/${p._id}`} target="_blank" className="icon-btn" aria-label="View in store"><Icon name="eye" size={18} /></Link>
                      <Link to={`/admin/products/${p._id}`} className="icon-btn" aria-label="Edit"><Icon name="edit" size={18} /></Link>
                      <button className="icon-btn" onClick={() => duplicate(p)} aria-label="Duplicate"><Icon name="copy" size={18} /></button>
                      <button className="icon-btn danger" onClick={() => remove(p)} aria-label="Delete"><Icon name="trash" size={18} /></button>
                    </td>
                  </tr>
                ))}
                {data.products.length === 0 && <tr><td colSpan="8" className="muted">No products match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={(n) => set({ page: n })} />
        </>
      )}
    </>
  );
}
