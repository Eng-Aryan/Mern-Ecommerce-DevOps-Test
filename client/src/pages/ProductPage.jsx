import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, money, fmtDate } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import ProductImage from '../components/ProductImage.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Rating from '../components/Rating.jsx';
import { Loader, ErrorBox } from '../components/Loader.jsx';

export default function ProductPage() {
  const { id } = useParams();
  const { user, toggleWishlist } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [review, setReview] = useState({ rating: 0, comment: '' });
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.get(`/products/${id}`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));

  useEffect(() => {
    setData(null); setError(''); setActive(0); setQty(1);
    load();
    window.scrollTo({ top: 0 });
  }, [id]); // eslint-disable-line

  if (error) return <div className="container section"><ErrorBox message={error}><Link to="/shop"> Back to shop</Link></ErrorBox></div>;
  if (!data) return <div className="container section"><Loader /></div>;

  const { product: p, related } = data;
  const sale = p.comparePrice > p.price;
  const saved = user?.wishlist?.includes(p._id);
  const hasReviewed = user && p.reviews.some((r) => r.user === user._id);

  const submitReview = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/products/${id}/reviews`, review);
      toast.success('Thanks for the review');
      setReview({ rating: 0, comment: '' });
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section">
      <p className="crumbs small muted">
        <Link to="/shop">Shop</Link> / <Link to={`/shop?category=${encodeURIComponent(p.category)}`}>{p.category}</Link> / {p.name}
      </p>

      <div className="detail">
        <div className="gallery">
          <ProductImage className="gallery-main" src={p.images?.[active]} name={p.name} />
          {p.images?.length > 1 && (
            <div className="thumbs">
              {p.images.map((src, i) => (
                <button key={i} className={i === active ? 'on' : ''} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`}>
                  <ProductImage src={src} name={p.name} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="info">
          <p className="muted">{p.brand}</p>
          <h1>{p.name}</h1>
          <Rating value={p.rating} count={p.numReviews} />
          <p className="price big">{money(p.price)} {sale && <s>{money(p.comparePrice)}</s>}</p>
          <p className="desc">{p.description}</p>

          <p className={p.countInStock === 0 ? 'stock out' : p.countInStock <= 5 ? 'stock low' : 'stock'}>
            {p.countInStock === 0 ? 'Out of stock' : p.countInStock <= 5 ? `Only ${p.countInStock} left` : 'In stock'}
          </p>

          {p.countInStock > 0 && (
            <div className="buy">
              <label>
                Quantity
                <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                  {Array.from({ length: Math.min(p.countInStock, 10) }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
                </select>
              </label>
              <button className="btn big" onClick={() => { add(p, qty); toast.success('Added to cart'); }}>Add to cart</button>
              <button className="btn big ghost" onClick={() => { add(p, qty); navigate('/cart'); }}>Buy now</button>
            </div>
          )}

          <button
            className="linkish"
            onClick={async () => {
              if (!user) return navigate('/login', { state: { from: `/product/${id}` } });
              try { toast.success((await toggleWishlist(p._id)) ? 'Saved to wishlist' : 'Removed from wishlist'); } catch (e) { toast.error(errMsg(e)); }
            }}
          >
            {saved ? '♥ Saved to wishlist' : '♡ Save to wishlist'}
          </button>
        </div>
      </div>

      <section className="reviews">
        <h2>Reviews</h2>
        <div className="reviews-grid">
          <div>
            {p.reviews.length === 0 && <p className="muted">No reviews yet. Be the first to share how it held up.</p>}
            {[...p.reviews].reverse().map((r) => (
              <div className="review" key={r._id}>
                <div className="row between"><strong>{r.name}</strong><span className="muted small">{fmtDate(r.createdAt)}</span></div>
                <Rating value={r.rating} />
                <p>{r.comment}</p>
              </div>
            ))}
          </div>

          <div>
            {!user ? (
              <p><Link to="/login" state={{ from: `/product/${id}` }} className="btn ghost">Sign in to write a review</Link></p>
            ) : hasReviewed ? (
              <p className="muted">You've reviewed this product. Thank you.</p>
            ) : (
              <form onSubmit={submitReview} className="form">
                <h3>Write a review</h3>
                <Rating value={review.rating} onChange={(n) => setReview({ ...review, rating: n })} />
                <textarea rows="4" required placeholder="What did you use it for, and how did it hold up?" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
                <button className="btn" disabled={busy || !review.rating}>{busy ? 'Posting…' : 'Post review'}</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section>
          <h2>You might also like</h2>
          <div className="grid">{related.map((r) => <ProductCard key={r._id} product={r} />)}</div>
        </section>
      )}
    </div>
  );
}
