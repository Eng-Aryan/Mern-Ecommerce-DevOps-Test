import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api.js';
import { useUI } from '../../context/UIContext.jsx';
import Modal from '../../components/Modal.jsx';
import Icon from '../../components/Icon.jsx';
import { Loader } from '../../components/Loader.jsx';
import { PageHeader, ImageUpload, Thumb } from './ui.jsx';

const EMPTY = { title: '', subtitle: '', image: '', link: '/shop', cta: 'Shop now', position: 'hero', order: 0, active: true };

export default function AdminBanners() {
  const { confirm } = useUI();
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null);
  const load = () => api.get('/admin/banners').then((r) => setList(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const { _id, createdAt, updatedAt, __v, ...body } = form;
    body.order = Number(body.order) || 0;
    try { _id ? await api.put(`/admin/banners/${_id}`, body) : await api.post('/admin/banners', body); toast.success('Banner saved'); setForm(null); load(); } catch (err) { toast.error(errMsg(err)); }
  };
  const toggle = (b) => api.put(`/admin/banners/${b._id}`, { active: !b.active }).then(load).catch((e) => toast.error(errMsg(e)));
  const remove = async (b) => { if (await confirm({ title: `Delete "${b.title}"?`, confirmLabel: 'Delete', danger: true })) api.delete(`/admin/banners/${b._id}`).then(load).catch((e) => toast.error(errMsg(e))); };

  return (
    <>
      <PageHeader title="Banners" sub="Hero slides at the top of the homepage and promo tiles below"><button className="btn small" onClick={() => setForm(EMPTY)}><Icon name="plus" size={16} /> New banner</button></PageHeader>
      {!list ? <Loader /> : (
        <div className="table-wrap">
          <table className="responsive">
            <thead><tr><th></th><th>Title</th><th>Position</th><th>Link</th><th>Order</th><th></th></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b._id}>
                  <td className="thumb wide"><Thumb src={b.image} name={b.title} /></td>
                  <td data-label="Title"><strong>{b.title}</strong> {!b.active && <span className="pill off">Hidden</span>}<br /><small className="muted">{b.subtitle}</small></td>
                  <td data-label="Position">{b.position === 'hero' ? 'Hero slide' : 'Promo tile'}</td>
                  <td data-label="Link">{b.link}</td>
                  <td data-label="Order">{b.order}</td>
                  <td className="actions">
                    <button className="btn small ghost" onClick={() => toggle(b)}>{b.active ? 'Hide' : 'Show'}</button>
                    <button className="icon-btn" onClick={() => setForm(b)} aria-label="Edit"><Icon name="edit" size={18} /></button>
                    <button className="icon-btn danger" onClick={() => remove(b)} aria-label="Delete"><Icon name="trash" size={18} /></button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan="6" className="muted">No banners yet. The homepage shows a simple default hero.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={Boolean(form)} onClose={() => setForm(null)} title={form?._id ? 'Edit banner' : 'New banner'}>
        {form && (
          <form className="form flat" onSubmit={save}>
            <label>Title *<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label>Subtitle<input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></label>
            <div className="fields">
              <label>Button text<input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} /></label>
              <label>Link<input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/shop?category=Apparel" /></label>
              <label>Position<select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}><option value="hero">Hero slide</option><option value="promo">Promo tile</option></select></label>
              <label>Order<input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></label>
            </div>
            {form.image && <div className="img-list"><div><Thumb src={form.image} name={form.title} /><button type="button" className="btn small danger" onClick={() => setForm({ ...form, image: '' })}>Remove</button></div></div>}
            <ImageUpload label="Upload image" onUploaded={(url) => setForm((f) => ({ ...f, image: url }))} />
            <p className="small muted">Tip: use a wide image, about 1400×800 for hero slides and 900×500 for promo tiles.</p>
            <label className="check"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Visible in the store</label>
            <button className="btn">Save banner</button>
          </form>
        )}
      </Modal>
    </>
  );
}
