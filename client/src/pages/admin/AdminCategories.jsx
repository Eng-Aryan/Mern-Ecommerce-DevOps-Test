import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api.js';
import { useUI } from '../../context/UIContext.jsx';
import Modal from '../../components/Modal.jsx';
import Icon from '../../components/Icon.jsx';
import { Loader } from '../../components/Loader.jsx';
import { PageHeader, ImageUpload, Thumb } from './ui.jsx';

const EMPTY = { name: '', description: '', image: '', order: 0, active: true };

export default function AdminCategories() {
  const { confirm } = useUI();
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null);
  const load = () => api.get('/admin/categories').then((r) => setList(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const body = { name: form.name, description: form.description, image: form.image, order: Number(form.order) || 0, active: form.active };
    try { form._id ? await api.put(`/admin/categories/${form._id}`, body) : await api.post('/admin/categories', body); toast.success('Category saved'); setForm(null); load(); } catch (err) { toast.error(errMsg(err)); }
  };
  const remove = async (c) => { if (await confirm({ title: `Delete "${c.name}"?`, confirmLabel: 'Delete', danger: true })) api.delete(`/admin/categories/${c._id}`).then(() => { toast.success('Deleted'); load(); }).catch((e) => toast.error(errMsg(e))); };

  return (
    <>
      <PageHeader title="Categories" sub="Images and order shown on the storefront"><button className="btn small" onClick={() => setForm(EMPTY)}><Icon name="plus" size={16} /> New category</button></PageHeader>
      {!list ? <Loader /> : (
        <div className="table-wrap">
          <table className="responsive">
            <thead><tr><th></th><th>Name</th><th>Products</th><th>Order</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c._id || c.name}>
                  <td className="thumb"><Thumb src={c.image} name={c.name} /></td>
                  <td data-label="Name"><strong>{c.name}</strong><br /><small className="muted">{c.description}</small></td>
                  <td data-label="Products">{c.count}</td>
                  <td data-label="Order">{c.order ?? '—'}</td>
                  <td data-label="Status">{c.unsaved ? <span className="pill off">No record</span> : c.active ? 'Visible' : <span className="pill off">Hidden</span>}</td>
                  <td className="actions">
                    {c.unsaved ? <button className="btn small ghost" onClick={() => setForm({ ...EMPTY, name: c.name })}>Set up</button> : (<>
                      <button className="icon-btn" onClick={() => setForm({ ...c })} aria-label="Edit"><Icon name="edit" size={18} /></button>
                      <button className="icon-btn danger" onClick={() => remove(c)} aria-label="Delete"><Icon name="trash" size={18} /></button></>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={Boolean(form)} onClose={() => setForm(null)} title={form?._id ? 'Edit category' : 'New category'}>
        {form && (
          <form className="form flat" onSubmit={save}>
            <label>Name *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Description<input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label>Display order<input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></label>
            {form.image && <div className="img-list"><div><Thumb src={form.image} name={form.name} /><button type="button" className="btn small danger" onClick={() => setForm({ ...form, image: '' })}>Remove</button></div></div>}
            <ImageUpload label="Upload image" onUploaded={(url) => setForm((f) => ({ ...f, image: url }))} />
            <label className="check"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Visible in the store</label>
            <button className="btn">Save category</button>
          </form>
        )}
      </Modal>
    </>
  );
}
