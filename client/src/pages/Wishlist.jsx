import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { Loader, ErrorBox } from '../components/Loader.jsx';

export default function Wishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/wishlist').then((r) => setItems(r.data)).catch((e) => setError(errMsg(e))); }, []);

  // hide items the moment they're un-hearted
  const visible = items?.filter((p) => user.wishlist.includes(p._id));

  return (
    <div className="container section">
      <h1>Wishlist</h1>
      {error && <ErrorBox message={error} />}
      {!items && !error && <Loader />}
      {visible?.length === 0 && <div className="empty"><p>Tap the heart on any product to save it here.</p><Link to="/shop" className="btn">Browse gear</Link></div>}
      {visible?.length > 0 && <div className="grid">{visible.map((p) => <ProductCard key={p._id} product={p} />)}</div>}
    </div>
  );
}
