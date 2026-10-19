import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <p className="logo">Tidewater<span>Supply</span></p>
          <p className="muted">Durable gear for hiking, camping and travel. Free shipping on orders over $100.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to={`/shop?category=${encodeURIComponent("Packs & Bags")}`}>Packs &amp; bags</Link>
          <Link to="/shop?category=Apparel">Apparel</Link>
          <Link to={`/shop?category=${encodeURIComponent("Camp & Cook")}`}>Camp &amp; cook</Link>
          <Link to="/shop?category=Footwear">Footwear</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/account">Profile</Link>
          <Link to="/orders">Order history</Link>
          <Link to="/wishlist">Wishlist</Link>
        </div>
      </div>
      <p className="container small muted copy">© {new Date().getFullYear()} Tidewater Supply</p>
    </footer>
  );
}
