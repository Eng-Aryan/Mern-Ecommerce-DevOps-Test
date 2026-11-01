import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api.js';
import ProductImage from '../../components/ProductImage.jsx';
import Icon from '../../components/Icon.jsx';
import { Loader } from '../../components/Loader.jsx';
import { PageHeader, Card, ImageUpload } from './ui.jsx';

const EMPTY = { name: '', brand: '', category: '', sku: '', tags: [], description: '', price: '', comparePrice: '', countInStock: '', featured: false, isActive: true, images: [], optionName: 'Size', variants: [] };
const PRESETS = { 'Clothing sizes': ['S', 'M', 'L', 'XL'], 'Shoe sizes': ['39', '40', '41', '42', '43', '44', '45'] };

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(id ? null : EMPTY);
  const [cats, setCats] = useState([]);
  const [tagText, setTagText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get('/admin/categories').then((r) => setCats(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (id) api.get(`/products/${id}`).then((r) => { setForm({ ...EMPTY, ...r.data.product }); setTagText((r.data.product.tags || []).join(', ')); }).catch((e) => toast.error(errMsg(e)));
  }, [id]);

  if (!form) return <Loader />;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const hasVariants = form.variants.length > 0;
  const setVariant = (i, patch) => set('variants', form.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const moveImg = (i, d) => { const a = [...form.images]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set('images', a); };
  const stockSum = form.variants.reduce((s, v) => s + (Number(v.countInStock) || 0), 0);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = {
      ...form, price: Number(form.price), comparePrice: Number(form.comparePrice) || 0, countInStock: hasVariants ? stockSum : Number(form.countInStock) || 0,
      tags: tagText.split(',').map((t) => t.trim()).filter(Boolean),
      variants: form.variants.map((v) => ({ ...v, price: Number(v.price) || 0, countInStock: Number(v.countInStock) || 0 })),
    };
    try {
      if (id) await api.put(`/products/${id}`, body); else await api.post('/products', body);
      toast.success('Product saved');
      navigate('/admin/products');
    } catch (err) { toast.error(errMsg(err)); setBusy(false); }
  };

  return (
    <form onSubmit={submit}>
      <PageHeader title={id ? 'Edit product' : 'Add product'}>
        <Link to="/admin/products" className="btn ghost small">Cancel</Link>
        {id && <Link to={`/product/${id}`} target="_blank" className="btn ghost small"><Icon name="eye" size={16} /> Preview</Link>}
        <button className="btn small" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
      </PageHeader>

      <div className="ad-cols form-cols">
        <div className="stack">
          <Card title="Basic information">
            <div className="form flat">
              <label>Name *<input required value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
              <div className="fields">
                <label>Category *<input required list="cat-list" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Apparel" /><datalist id="cat-list">{cats.map((c) => <option key={c.name} value={c.name} />)}</datalist></label>
                <label>Brand<input value={form.brand} onChange={(e) => set('brand', e.target.value)} /></label>
                <label>SKU<input value={form.sku} onChange={(e) => set('sku', e.target.value)} /></label>
                <label>Tags<input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="comma, separated" /></label>
              </div>
              <label>Description *<textarea required rows="6" value={form.description} onChange={(e) => set('description', e.target.value)} /></label>
            </div>
          </Card>

          <Card title="Pricing & stock">
            <div className="form flat"><div className="fields">
              <label>Price *<input required type="number" min="0" step="0.01" inputMode="decimal" value={form.price} onChange={(e) => set('price', e.target.value)} /></label>
              <label>Original price (shows a sale)<input type="number" min="0" step="0.01" inputMode="decimal" value={form.comparePrice} onChange={(e) => set('comparePrice', e.target.value)} /></label>
              <label>Stock {hasVariants && <span className="muted small">(total of options)</span>}<input required={!hasVariants} type="number" min="0" disabled={hasVariants} value={hasVariants ? stockSum : form.countInStock} onChange={(e) => set('countInStock', e.target.value)} /></label>
            </div></div>
          </Card>

          <Card title="Options (size, colour…)" action={hasVariants && <button type="button" className="linkish small" onClick={() => set('variants', [])}>Remove all</button>}>
            <p className="muted small">Add options when customers must choose one, such as a size. Each option has its own stock. Leave empty for a single product.</p>
            {hasVariants && <label className="inline-field">Option name<input value={form.optionName} onChange={(e) => set('optionName', e.target.value)} placeholder="Size" /></label>}
            {form.variants.map((v, i) => (
              <div className="variant-row" key={v._id || i}>
                <label>Label<input required value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} /></label>
                <label>SKU<input value={v.sku || ''} onChange={(e) => setVariant(i, { sku: e.target.value })} /></label>
                <label>Price <span className="muted small">(0 = same)</span><input type="number" min="0" step="0.01" value={v.price || ''} onChange={(e) => setVariant(i, { price: e.target.value })} /></label>
                <label>Stock<input required type="number" min="0" value={v.countInStock} onChange={(e) => setVariant(i, { countInStock: e.target.value })} /></label>
                <button type="button" className="icon-btn danger" onClick={() => set('variants', form.variants.filter((_, j) => j !== i))} aria-label="Remove option"><Icon name="trash" size={18} /></button>
              </div>
            ))}
            <div className="row wrap">
              <button type="button" className="btn ghost small" onClick={() => set('variants', [...form.variants, { label: '', sku: '', price: 0, countInStock: 0 }])}><Icon name="plus" size={16} /> Add option</button>
              {Object.entries(PRESETS).map(([name, labels]) => <button key={name} type="button" className="btn ghost small" onClick={() => setForm((f) => ({ ...f, optionName: 'Size', variants: labels.map((label) => ({ label, sku: f.sku ? `${f.sku}-${label}` : '', price: 0, countInStock: 0 })) }))}>{name}</button>)}
            </div>
          </Card>
        </div>

        <div className="stack">
          <Card title="Visibility">
            <label className="check"><input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Published (visible in the store)</label>
            <label className="check"><input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured on the homepage</label>
          </Card>
          <Card title="Images">
            <p className="muted small">The first image is the main photo.</p>
            <div className="img-list">
              {form.images.map((src, i) => (
                <div key={src + i}>
                  <ProductImage src={src} name={form.name || 'Image'} />
                  {i === 0 && <span className="pill main">Main</span>}
                  <div className="row small-gap">
                    <button type="button" className="icon-btn" disabled={i === 0} onClick={() => moveImg(i, -1)} aria-label="Move earlier"><Icon name="left" size={16} /></button>
                    <button type="button" className="icon-btn" disabled={i === form.images.length - 1} onClick={() => moveImg(i, 1)} aria-label="Move later"><Icon name="right" size={16} /></button>
                    <button type="button" className="icon-btn danger" onClick={() => set('images', form.images.filter((_, j) => j !== i))} aria-label="Remove image"><Icon name="trash" size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <ImageUpload multiple label="Upload images" onUploaded={(url) => setForm((f) => ({ ...f, images: [...f.images, url] }))} />
          </Card>
        </div>
      </div>
    </form>
  );
}
