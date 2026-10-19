import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, money } from '../../api.js';
import ProductImage from '../../components/ProductImage.jsx';
import Pagination from '../../components/Pagination.jsx';
import { Loader } from '../../components/Loader.jsx';

export default function AdminProducts() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');

  const load = () => api.get(`/products?page=${page}&limit=10${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}`).then((r) => setData(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, [page]); // eslint-disable-line

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    try { await api.delete(`/products/${p._id}`); toast.success('Product deleted'); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <>
      <div className="row between wrap">
        <h1>Products</h1>
        <Link to="/admin/products/new" className="btn">Add product</Link>
      </div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }}>
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search products" aria-label="Search products" />
        <button className="btn ghost">Search</button>
      </form>
      {!data ? <Loader /> : (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p._id}>
                    <td className="thumb"><ProductImage src={p.images?.[0]} name={p.name} /></td>
                    <td>{p.name} {p.featured && <span className="pill">Featured</span>}</td>
                    <td>{p.category}</td>
                    <td>{money(p.price)}</td>
                    <td className={p.countInStock <= 5 ? 'bad' : ''}>{p.countInStock}</td>
                    <td className="actions">
                      <Link to={`/admin/products/${p._id}`} className="btn small ghost">Edit</Link>
                      <button className="btn small danger" onClick={() => remove(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
