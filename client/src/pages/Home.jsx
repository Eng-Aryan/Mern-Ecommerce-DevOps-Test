import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import { Loader } from '../components/Loader.jsx';

export default function Home() {
  const [featured, setFeatured] = useState(null);
  const [latest, setLatest] = useState([]);
  const [cats, setCats] = useState([]);

  useEffect(() => {
    api.get('/products?featured=true&limit=4').then((r) => setFeatured(r.data.products)).catch(() => setFeatured([]));
    api.get('/products?sort=newest&limit=8').then((r) => setLatest(r.data.products)).catch(() => {});
    api.get('/products/categories').then((r) => setCats(r.data)).catch(() => {});
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <h1>Gear for the long way round.</h1>
          <p>Packs, shells, stoves and boots tested on wet ridgelines and long trains. Built to be repaired, not replaced.</p>
          <div className="row">
            <Link to="/shop" className="btn accent big">Shop all gear</Link>
            <Link to="/shop?sort=rating" className="btn outline-light big">Top rated</Link>
          </div>
        </div>
        <div className="container cat-tiles">
          {cats.map((c, i) => (
            <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`} className={`tile t${i % 5}`}>
              <strong>{c.name}</strong>
              <span>{c.count} {c.count === 1 ? 'item' : 'items'}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Crew favourites</h2>
          <Link to="/shop" className="muted">See everything</Link>
        </div>
        {featured === null ? <Loader /> : featured.length === 0 ? (
          <p className="muted">No featured products yet. Run <code>npm run seed</code> to add sample gear.</p>
        ) : (
          <div className="grid">{featured.map((p) => <ProductCard key={p._id} product={p} />)}</div>
        )}
      </section>

      <section className="band">
        <div className="container perks">
          <div><h3>Free shipping over $100</h3><p>Flat $8 under that. Orders leave within two working days.</p></div>
          <div><h3>30-day returns</h3><p>Used it and it isn't right? Send it back for a refund.</p></div>
          <div><h3>Repair, don't replace</h3><p>Zips, buckles and straps are covered for the life of the product.</p></div>
        </div>
      </section>

      {latest.length > 0 && (
        <section className="container section">
          <div className="section-head"><h2>New in</h2></div>
          <div className="grid">{latest.map((p) => <ProductCard key={p._id} product={p} />)}</div>
        </section>
      )}
    </>
  );
}
