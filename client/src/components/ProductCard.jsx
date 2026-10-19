import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { money, errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import ProductImage from './ProductImage.jsx';
import Rating from './Rating.jsx';

export default function ProductCard({ product }) {
  const { user, toggleWishlist } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const saved = user?.wishlist?.includes(product._id);
  const sale = product.comparePrice > product.price;

  const onSave = async () => {
    if (!user) return navigate('/login', { state: { from: '/wishlist' } });
    try {
      const added = await toggleWishlist(product._id);
      toast.success(added ? 'Saved to wishlist' : 'Removed from wishlist');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <article className="card">
      <div className="card-media">
        <Link to={`/product/${product._id}`} tabIndex={-1}>
          <ProductImage src={product.images?.[0]} name={product.name} />
        </Link>
        {sale && <span className="badge sale">Save {Math.round((1 - product.price / product.comparePrice) * 100)}%</span>}
        {product.countInStock === 0 && <span className="badge out">Sold out</span>}
        <button className={`heart ${saved ? 'on' : ''}`} onClick={onSave} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}>
          {saved ? '♥' : '♡'}
        </button>
      </div>
      <div className="card-body">
        <p className="muted small">{product.brand || product.category}</p>
        <h3><Link to={`/product/${product._id}`}>{product.name}</Link></h3>
        <Rating value={product.rating} count={product.numReviews} />
        <div className="card-foot">
          <p className="price">
            {money(product.price)} {sale && <s>{money(product.comparePrice)}</s>}
          </p>
          <button
            className="btn small"
            disabled={product.countInStock === 0}
            onClick={() => {
              add(product, 1);
              toast.success('Added to cart');
            }}
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
