import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import useSeo from '../hooks/useSeo.js';
import ProductCard from '../components/ProductCard.jsx';
import Pagination from '../components/Pagination.jsx';
import Drawer from '../components/Drawer.jsx';
import Icon from '../components/Icon.jsx';
import { SkeletonGrid, ErrorBox } from '../components/Loader.jsx';

function Filters({ cats, brands, p, set, price, setPrice }) {
  const selBrands = (p.brand || '').split(',').filter(Boolean);
  const toggleBrand = (b) => set({ brand: (selBrands.includes(b) ? selBrands.filter((x) => x !== b) : [...selBrands, b]).join(',') });
  return (
    <>
      <h3>Category</h3>
      <button className={`filter ${!p.category ? 'on' : ''}`} onClick={() => set({ category: '', brand: '' })}>All gear</button>
      {cats.map((c) => <button key={c.name} className={`filter ${p.category === c.name ? 'on' : ''}`} onClick={() => set({ category: c.name, brand: '' })}>{c.name} <span className="muted">{c.count}</span></button>)}

      {brands.length > 0 && (
        <>
          <h3>Brand</h3>
          {brands.map((b) => <label key={b.name} className="check"><input type="checkbox" checked={selBrands.includes(b.name)} onChange={() => toggleBrand(b.name)} /> {b.name} <span className="muted small">({b.count})</span></label>)}
        </>
      )}

      <h3>Price</h3>
      <form className="price-range" onSubmit={(e) => { e.preventDefault(); set({ minPrice: price.min, maxPrice: price.max }); }}>
        <input type="number" min="0" inputMode="numeric" placeholder="Min" value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value })} aria-label="Minimum price" />
        <input type="number" min="0" inputMode="numeric" placeholder="Max" value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value })} aria-label="Maximum price" />
        <button className="btn small ghost">Apply</button>
      </form>

      <h3>Rating</h3>
      <label className="check"><input type="checkbox" checked={p.minRating === '4'} onChange={(e) => set({ minRating: e.target.checked ? '4' : '' })} /> 4 stars & up</label>
      <h3>Availability</h3>
      <label className="check"><input type="checkbox" checked={p.inStock === 'true'} onChange={(e) => set({ inStock: e.target.checked })} /> In stock only</label>
      <label className="check"><input type="checkbox" checked={p.onSale === 'true'} onChange={(e) => set({ onSale: e.target.checked })} /> On sale</label>
    </>
  );
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState(false);
  const [view, setView] = useState(() => localStorage.getItem('shopView') || 'grid');
  const p = Object.fromEntries(params);
  const [price, setPrice] = useState({ min: p.minPrice || '', max: p.maxPrice || '' });
  const sort = p.sort || 'newest';
  const page = Number(p.page) || 1;
  const title = p.keyword ? `Results for “${p.keyword}”` : p.onSale === 'true' ? 'Sale' : p.category || 'All gear';
  useSeo({ title, description: p.category ? `Shop ${p.category}` : undefined });

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: 1, ...patch }).forEach(([k, v]) => (v === '' || v === false || v == null ? next.delete(k) : next.set(k, v)));
    setParams(next);
  };
  const clearAll = () => { setPrice({ min: '', max: '' }); setParams(p.keyword ? { keyword: p.keyword } : {}); };

  useEffect(() => { api.get('/products/categories').then((r) => setCats(r.data)).catch(() => {}); }, []);
  useEffect(() => { api.get('/products/brands', { params: { category: p.category || undefined } }).then((r) => setBrands(r.data)).catch(() => {}); }, [p.category]);
  useEffect(() => { setPrice({ min: p.minPrice || '', max: p.maxPrice || '' }); }, [p.minPrice, p.maxPrice]); // eslint-disable-line

  const query = params.toString();
  useEffect(() => {
    setError('');
    const q = new URLSearchParams(params);
    q.set('limit', '12');
    let alive = true;
    api.get(`/products?${q}`).then((r) => alive && setData(r.data)).catch((e) => alive && setError(errMsg(e)));
    return () => { alive = false; };
  }, [query]); // eslint-disable-line

  const chips = [
    p.category && ['category', p.category], ...(p.brand || '').split(',').filter(Boolean).map((b) => ['brand', b]),
    (p.minPrice || p.maxPrice) && ['price', `${p.minPrice || 0} – ${p.maxPrice || '∞'}`], p.minRating && ['minRating', '4★ & up'],
    p.inStock === 'true' && ['inStock', 'In stock'], p.onSale === 'true' && ['onSale', 'On sale'],
  ].filter(Boolean);
  const removeChip = ([k, v]) => k === 'price' ? set({ minPrice: '', maxPrice: '' }) : k === 'brand' ? set({ brand: (p.brand || '').split(',').filter((b) => b !== v).join(',') }) : set({ [k]: '' });
  const filterProps = { cats, brands, p, set, price, setPrice };

  return (
    <div className="container shop">
      <aside className="filters desk-only"><Filters {...filterProps} /></aside>

      <section>
        <div className="shop-head">
          <div><h1>{title}</h1>{data && <p className="muted">{data.total} {data.total === 1 ? 'product' : 'products'}</p>}</div>
          <div className="shop-tools">
            <button className="btn ghost small mob-only" onClick={() => setSheet(true)}><Icon name="sliders" size={16} /> Filters{chips.length > 0 && ` (${chips.length})`}</button>
            <label className="sort"><span className="desk-only">Sort by</span>
              <select value={sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort products">
                <option value="newest">Newest</option><option value="bestselling">Best selling</option><option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option><option value="rating">Top rated</option><option value="name">Name A–Z</option>
              </select>
            </label>
            <div className="view-toggle desk-only" role="group" aria-label="Layout">
              <button className={view === 'grid' ? 'on' : ''} onClick={() => { setView('grid'); localStorage.setItem('shopView', 'grid'); }} aria-label="Grid view"><Icon name="grid" size={18} /></button>
              <button className={view === 'list' ? 'on' : ''} onClick={() => { setView('list'); localStorage.setItem('shopView', 'list'); }} aria-label="List view"><Icon name="list" size={18} /></button>
            </div>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="chips">
            {chips.map((c) => <button key={c.join()} className="chip" onClick={() => removeChip(c)}>{c[1]} <Icon name="x" size={14} /></button>)}
            <button className="linkish small" onClick={clearAll}>Clear all</button>
          </div>
        )}

        {error && <ErrorBox message={error} />}
        {!data && !error && <SkeletonGrid n={8} />}
        {data && data.products.length === 0 && (
          <div className="empty"><h2>No products match</h2><p className="muted">Try removing a filter or searching for something else.</p><button className="btn" onClick={clearAll}>Clear filters</button></div>
        )}
        {data && data.products.length > 0 && (
          <>
            <div className={`grid ${view === 'list' ? 'list' : ''}`}>{data.products.map((x) => <ProductCard key={x._id} product={x} />)}</div>
            <Pagination page={data.page} pages={data.pages} onChange={(n) => { set({ page: n }); window.scrollTo({ top: 0 }); }} />
          </>
        )}
      </section>

      <Drawer open={sheet} onClose={() => setSheet(false)} side="bottom" title="Filters" footer={<button className="btn big block" onClick={() => setSheet(false)}>Show {data?.total ?? ''} results</button>}>
        <div className="filters sheet"><Filters {...filterProps} /></div>
      </Drawer>
    </div>
  );
}
