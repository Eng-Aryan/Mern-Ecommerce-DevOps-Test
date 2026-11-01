import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { money, errMsg, discountPct } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import ProductImage from './ProductImage.jsx';
import Rating from './Rating.jsx';
import Icon from './Icon.jsx';

export default function ProductCard({ product }) {
  const { user, toggleWishlist } = useAuth();
  const { add, openDrawer } = useCart();
  const { lowStockThreshold } = useSettings();
  const navigate = useNavigate();
  const saved = user?.wishlist?.includes(product._id);
  const off = discountPct(product);
  const hasOptions = product.variants?.length > 0;
  const out = product.countInStock === 0;
  const isNew = Date.now() - new Date(product.createdAt).getTime() < 14 * 86400000;

  const onSave = async () => {
    if (!user) return navigate('/login', { state: { from: '/wishlist' } });
    try { toast.success((await toggleWishlist(product._id)) ? 'Saved to wishlist' : 'Removed from wishlist'); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <article className="card">
      <div className="card-media">
        <Link to={`/product/${product._id}`} tabIndex={-1} aria-hidden="true">
          <ProductImage src={product.images?.[0]} name={product.name} />
          {product.images?.[1] && <ProductImage className="alt" src={product.images[1]} name="" />}
        </Link>
        <div className="badges">
          {off > 0 && <span className="badge sale">−{off}%</span>}
          {isNew && !off && <span className="badge new">New</span>}
        </div>
        {out && <span className="badge out">Sold out</span>}
        <button className={`heart ${saved ? 'on' : ''}`} onClick={onSave} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}>
          <Icon name="heart" size={18} fill={saved} />
        </button>
      </div>
      <div className="card-body">
        <p className="muted small">{product.brand || product.category}</p>
        <h3><Link to={`/product/${product._id}`}>{product.name}</Link></h3>
        {product.numReviews > 0 ? <Rating value={product.rating} count={product.numReviews} /> : <span className="small muted">No reviews yet</span>}
        {!out && product.countInStock <= lowStockThreshold && <p className="small bad">Only {product.countInStock} left</p>}
        <div className="card-foot">
          <p className="price">{hasOptions && <span className="from">From </span>}{money(product.price)} {off > 0 && <s>{money(product.comparePrice)}</s>}</p>
          {hasOptions ? (
            <Link className="btn small" to={`/product/${product._id}`} aria-disabled={out}>{out ? 'Sold out' : 'Options'}</Link>
          ) : (
            <button className="btn small" disabled={out} onClick={() => { add(product, 1); toast.success('Added to cart'); openDrawer(); }} aria-label={`Add ${product.name} to cart`}>
              <Icon name="plus" size={16} /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
