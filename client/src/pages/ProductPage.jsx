import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, money, fmtDate, discountPct, imgUrl } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import useSeo from '../hooks/useSeo.js';
import { getRecent, pushRecent } from '../hooks/useRecentlyViewed.js';
import Gallery from '../components/Gallery.jsx';
import ProductCard from '../components/ProductCard.jsx';
import QtyStepper from '../components/QtyStepper.jsx';
import Rating from '../components/Rating.jsx';
import Icon from '../components/Icon.jsx';
import { Loader, ErrorBox } from '../components/Loader.jsx';

export default function ProductPage() {
  const { id } = useParams();
  const { user, toggleWishlist } = useAuth();
  const { add, openDrawer } = useCart();
  const s = useSettings();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState(1);
  const [review, setReview] = useState({ rating: 0, comment: '' });
  const [busy, setBusy] = useState(false);
  const [needOption, setNeedOption] = useState(false);

  const load = () => api.get(`/products/${id}`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));

  useEffect(() => {
    setData(null); setError(''); setVariantId(''); setQty(1); setNeedOption(false);
    load();
    const others = getRecent().filter((x) => x !== id);
    if (others.length) api.get(`/products/by-ids?ids=${others.slice(0, 8).join(',')}`).then((r) => setRecent(r.data)).catch(() => {}); else setRecent([]);
    pushRecent(id);
  }, [id]); // eslint-disable-line

  const p = data?.product;
  const variant = useMemo(() => p?.variants?.find((v) => v._id === variantId), [p, variantId]);
  const hasVariants = p?.variants?.length > 0;
  const price = variant && variant.price > 0 ? variant.price : p?.price;
  const stock = variant ? variant.countInStock : hasVariants ? 0 : p?.countInStock;
  const off = p ? discountPct({ price, comparePrice: p.comparePrice }) : 0;

  useSeo(p ? {
    title: p.name, description: p.description.slice(0, 155), image: p.images?.[0],
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, image: (p.images || []).map((i) => (/^https?:/.test(i) ? i : location.origin + imgUrl(i))), sku: p.sku || undefined,
      brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
      offers: { '@type': 'Offer', priceCurrency: s.currency, price: p.price, availability: p.countInStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: location.href },
      aggregateRating: p.numReviews > 0 ? { '@type': 'AggregateRating', ratingValue: p.rating.toFixed(1), reviewCount: p.numReviews } : undefined,
    },
  } : {});

  if (error) return <div className="container section"><ErrorBox message={error}><Link to="/shop"> Back to shop</Link></ErrorBox></div>;
  if (!data) return <div className="container section"><Loader /></div>;

  const { related } = data;
  const saved = user?.wishlist?.includes(p._id);
  const hasReviewed = user && p.reviews.some((r) => r.user === user._id);
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: p.reviews.filter((r) => r.rating === n).length }));

  const addToCart = (go) => {
    if (hasVariants && !variant) { setNeedOption(true); document.getElementById('options')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); toast.error(`Choose a ${p.optionName.toLowerCase()} first`); return; }
    add(p, qty, variant);
    if (go) navigate('/checkout'); else { toast.success('Added to cart'); openDrawer(); }
  };

  const share = async () => {
    const data = { title: p.name, url: location.href };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); toast.success('Link copied'); } } catch { /* cancelled */ }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.post(`/products/${id}/reviews`, review); toast.success('Thanks for the review'); setReview({ rating: 0, comment: '' }); await load(); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  const status = stock === 0 && (!hasVariants || variant) ? ['out', 'Out of stock'] : stock > 0 && stock <= s.lowStockThreshold ? ['low', `Only ${stock} left`] : stock > 0 ? ['', 'In stock'] : null;

  return (
    <div className="container section product-page">
      <p className="crumbs small muted"><Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <Link to={`/shop?category=${encodeURIComponent(p.category)}`}>{p.category}</Link> / {p.name}</p>

      <div className="detail">
        <Gallery images={p.images} name={p.name} />

        <div className="info">
          {p.isActive === false && <span className="pill off">Draft — only admins can see this</span>}
          <p className="muted">{p.brand}</p>
          <h1>{p.name}</h1>
          <a href="#reviews" className="rate-link"><Rating value={p.rating} count={p.numReviews} /></a>
          <p className="price big">{money(price)} {off > 0 && <><s>{money(p.comparePrice)}</s> <span className="badge sale inline">Save {off}%</span></>}</p>

          {hasVariants && (
            <div id="options" className={`options ${needOption ? 'need' : ''}`}>
              <p><strong>{p.optionName}</strong>{variant && <span className="muted"> — {variant.label}</span>}</p>
              <div className="opt-list" role="radiogroup" aria-label={p.optionName}>
                {p.variants.map((v) => (
                  <button key={v._id} role="radio" aria-checked={v._id === variantId} className={`opt ${v._id === variantId ? 'on' : ''}`} disabled={v.countInStock === 0} onClick={() => { setVariantId(v._id); setNeedOption(false); setQty(1); }}>
                    {v.label}
                  </button>
                ))}
              </div>
              {needOption && <p className="small bad">Please choose a {p.optionName.toLowerCase()}.</p>}
            </div>
          )}

          {status && <p className={`stock ${status[0]}`}>{status[1]}</p>}

          {(stock > 0 || (hasVariants && !variant && p.countInStock > 0)) && (
            <div className="buy">
              <QtyStepper value={qty} max={Math.max(Math.min(stock || 10, 10), 1)} onChange={setQty} />
              <button className="btn big grow" onClick={() => addToCart(false)}><Icon name="cart" size={18} /> Add to cart</button>
              <button className="btn big ghost" onClick={() => addToCart(true)}>Buy now</button>
            </div>
          )}

          <div className="row wrap actions-row">
            <button className="linkish" onClick={async () => {
              if (!user) return navigate('/login', { state: { from: `/product/${id}` } });
              try { toast.success((await toggleWishlist(p._id)) ? 'Saved to wishlist' : 'Removed from wishlist'); } catch (e) { toast.error(errMsg(e)); }
            }}><Icon name="heart" size={16} fill={saved} /> {saved ? 'Saved to wishlist' : 'Save to wishlist'}</button>
            <button className="linkish" onClick={share}><Icon name="share" size={16} /> Share</button>
          </div>

          <ul className="trust">
            <li><Icon name="truck" size={18} /> {s.freeShippingOver > 0 ? `Free shipping over ${money(s.freeShippingOver)}` : 'Free shipping'}</li>
            <li><Icon name="refresh" size={18} /> {s.returnDays}-day returns</li>
            <li><Icon name="shield" size={18} /> Secure checkout</li>
          </ul>

          <h2 className="h3">Description</h2>
          <p className="desc">{p.description}</p>
          <dl className="specs">
            {p.sku && <><dt>SKU</dt><dd>{variant?.sku || p.sku}</dd></>}
            <dt>Category</dt><dd><Link to={`/shop?category=${encodeURIComponent(p.category)}`}>{p.category}</Link></dd>
            {p.brand && <><dt>Brand</dt><dd>{p.brand}</dd></>}
            {p.tags?.length > 0 && <><dt>Tags</dt><dd>{p.tags.join(', ')}</dd></>}
          </dl>
        </div>
      </div>

      <section className="reviews" id="reviews">
        <h2>Customer reviews</h2>
        <div className="reviews-grid">
          <div>
            {p.numReviews > 0 && (
              <div className="rev-summary">
                <div className="big-rate"><strong>{p.rating.toFixed(1)}</strong><Rating value={p.rating} /><small className="muted">{p.numReviews} review{p.numReviews === 1 ? '' : 's'}</small></div>
                <div className="dist">{dist.map(({ n, c }) => <div key={n}><span>{n}★</span><div className="bar"><i style={{ width: `${(c / p.numReviews) * 100}%` }} /></div><span>{c}</span></div>)}</div>
              </div>
            )}
            {p.reviews.length === 0 && <p className="muted">No reviews yet. Be the first to share how it held up.</p>}
            {[...p.reviews].reverse().map((r) => (
              <div className="review" key={r._id}>
                <div className="row between"><strong>{r.name} {r.verified && <span className="verified"><Icon name="check" size={12} /> Verified purchase</span>}</strong><span className="muted small">{fmtDate(r.createdAt)}</span></div>
                <Rating value={r.rating} />
                <p>{r.comment}</p>
              </div>
            ))}
          </div>
          <div>
            {!user ? <p><Link to="/login" state={{ from: `/product/${id}` }} className="btn ghost">Sign in to write a review</Link></p>
              : hasReviewed ? <p className="muted">You've reviewed this product. Thank you.</p>
              : (
                <form onSubmit={submitReview} className="form">
                  <h3>Write a review</h3>
                  <Rating value={review.rating} onChange={(n) => setReview({ ...review, rating: n })} />
                  <textarea rows="4" required maxLength={1000} placeholder="What did you use it for, and how did it hold up?" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
                  <button className="btn" disabled={busy || !review.rating}>{busy ? 'Posting…' : 'Post review'}</button>
                </form>
              )}
          </div>
        </div>
      </section>

      {related.length > 0 && <section><h2>You might also like</h2><div className="grid">{related.map((r) => <ProductCard key={r._id} product={r} />)}</div></section>}
      {recent.length > 0 && <section><h2>Recently viewed</h2><div className="rail">{recent.map((r) => <ProductCard key={r._id} product={r} />)}</div></section>}

      <div className="buybar">
        <span className="grow"><strong>{money(price)}</strong>{variant && <small className="muted"> · {variant.label}</small>}</span>
        {p.countInStock > 0 ? <button className="btn big" onClick={() => addToCart(false)}><Icon name="cart" size={18} /> {hasVariants && !variant ? `Choose ${p.optionName.toLowerCase()}` : 'Add to cart'}</button> : <span className="stock out">Out of stock</span>}
      </div>
    </div>
  );
}
