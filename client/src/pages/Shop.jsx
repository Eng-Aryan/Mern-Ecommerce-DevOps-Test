import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { Loader, ErrorBox } from '../components/Loader.jsx';

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [cats, setCats] = useState([]);
  const [error, setError] = useState('');
  const [price, setPrice] = useState({ min: params.get('minPrice') || '', max: params.get('maxPrice') || '' });

  const keyword = params.get('keyword') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;
  const inStock = params.get('inStock') === 'true';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: 1, ...patch }).forEach(([k, v]) => (v === '' || v === false || v == null ? next.delete(k) : next.set(k, v)));
    setParams(next);
  };

  useEffect(() => { api.get('/products/categories').then((r) => setCats(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    setData(null);
    setError('');
    const q = new URLSearchParams({ sort, page, limit: 12 });
    if (keyword) q.set('keyword', keyword);
    if (category) q.set('category', category);
    if (inStock) q.set('inStock', 'true');
    if (minPrice) q.set('minPrice', minPrice);
    if (maxPrice) q.set('maxPrice', maxPrice);
    api.get(`/products?${q}`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, [keyword, category, sort, page, inStock, minPrice, maxPrice]);

  return (
    <div className="container shop">
      <aside className="filters">
        <h3>Category</h3>
        <button className={`filter ${!category ? 'on' : ''}`} onClick={() => set({ category: '' })}>All gear</button>
        {cats.map((c) => (
          <button key={c.name} className={`filter ${category === c.name ? 'on' : ''}`} onClick={() => set({ category: c.name })}>
            {c.name} <span className="muted">{c.count}</span>
          </button>
        ))}

        <h3>Price</h3>
        <form className="price-range" onSubmit={(e) => { e.preventDefault(); set({ minPrice: price.min, maxPrice: price.max }); }}>
          <input type="number" min="0" placeholder="Min" value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value })} aria-label="Minimum price" />
          <input type="number" min="0" placeholder="Max" value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value })} aria-label="Maximum price" />
          <button className="btn small ghost">Apply</button>
        </form>

        <label className="check">
          <input type="checkbox" checked={inStock} onChange={(e) => set({ inStock: e.target.checked })} /> In stock only
        </label>
      </aside>

      <section>
        <div className="shop-head">
          <div>
            <h1>{keyword ? `Results for “${keyword}”` : category || 'All gear'}</h1>
            {data && <p className="muted">{data.total} {data.total === 1 ? 'product' : 'products'}</p>}
          </div>
          <label className="sort">
            Sort by
            <select value={sort} onChange={(e) => set({ sort: e.target.value })}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </label>
        </div>

        {error && <ErrorBox message={error} />}
        {!data && !error && <Loader />}
        {data && data.products.length === 0 && (
          <div className="empty">
            <p>No products match those filters.</p>
            <button className="btn" onClick={() => { setPrice({ min: '', max: '' }); setParams({}); }}>Clear filters</button>
          </div>
        )}
        {data && data.products.length > 0 && (
          <>
            <div className="grid">{data.products.map((p) => <ProductCard key={p._id} product={p} />)}</div>
            <Pagination page={data.page} pages={data.pages} onChange={(n) => { set({ page: n }); window.scrollTo({ top: 0 }); }} />
          </>
        )}
      </section>
    </div>
  );
}
