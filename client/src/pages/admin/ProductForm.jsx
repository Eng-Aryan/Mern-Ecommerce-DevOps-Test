import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api.js';
import ProductImage from '../../components/ProductImage.jsx';
import { Loader } from '../../components/Loader.jsx';

const EMPTY = { name: '', brand: '', category: '', description: '', price: '', comparePrice: '', countInStock: '', featured: false, images: [] };

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(id ? null : EMPTY);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id) api.get(`/products/${id}`).then((r) => setForm(r.data.product)).catch((e) => toast.error(errMsg(e)));
  }, [id]);

  if (!form) return <Loader />;
  const set = (k, v) => setForm({ ...form, [k]: v });

  const upload = async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      const body = new FormData();
      body.append('image', file);
      try {
        const { data } = await api.post('/upload', body);
        setForm((f) => ({ ...f, images: [...f.images, data.url] }));
      } catch (err) {
        toast.error(errMsg(err));
      }
    }
    e.target.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = { ...form, price: Number(form.price), comparePrice: Number(form.comparePrice) || 0, countInStock: Number(form.countInStock) };
    try {
      if (id) await api.put(`/products/${id}`, body);
      else await api.post('/products', body);
      toast.success('Product saved');
      navigate('/admin/products');
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <>
      <h1>{id ? 'Edit product' : 'Add product'}</h1>
      <form className="form wide" onSubmit={submit}>
        <div className="fields">
          <label className="span2">Name<input required value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
          <label>Brand<input value={form.brand} onChange={(e) => set('brand', e.target.value)} /></label>
          <label>Category<input required value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Apparel" /></label>
          <label>Price ($)<input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} /></label>
          <label>Original price ($, optional)<input type="number" min="0" step="0.01" value={form.comparePrice} onChange={(e) => set('comparePrice', e.target.value)} /></label>
          <label>Stock<input required type="number" min="0" value={form.countInStock} onChange={(e) => set('countInStock', e.target.value)} /></label>
          <label className="check align-end"><input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} /> Show on homepage</label>
          <label className="span2">Description<textarea required rows="5" value={form.description} onChange={(e) => set('description', e.target.value)} /></label>
        </div>

        <h3>Images</h3>
        <div className="img-list">
          {form.images.map((src, i) => (
            <div key={src + i}>
              <ProductImage src={src} name={form.name || 'Image'} />
              <button type="button" className="btn small danger" onClick={() => set('images', form.images.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
        </div>
        <input type="file" accept="image/*" multiple onChange={upload} aria-label="Upload images" />
        <div className="row">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" aria-label="Image URL" />
          <button type="button" className="btn ghost small" onClick={() => { if (url.trim()) { set('images', [...form.images, url.trim()]); setUrl(''); } }}>Add URL</button>
        </div>

        <div className="row">
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
          <button type="button" className="btn ghost" onClick={() => navigate('/admin/products')}>Cancel</button>
        </div>
      </form>
    </>
  );
}
