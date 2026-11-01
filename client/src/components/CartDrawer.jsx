import { Link, useNavigate } from 'react-router-dom';
import { money } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import Drawer from './Drawer.jsx';
import ProductImage from './ProductImage.jsx';
import QtyStepper from './QtyStepper.jsx';
import Icon from './Icon.jsx';

// Slide-in mini cart: opens whenever something is added.
export default function CartDrawer() {
  const { items, drawer, closeDrawer, setQty, remove, subtotal, count } = useCart();
  const { freeShippingOver } = useSettings();
  const navigate = useNavigate();
  const left = Math.max(freeShippingOver - subtotal, 0);
  const pct = freeShippingOver > 0 ? Math.min(100, (subtotal / freeShippingOver) * 100) : 100;

  const footer = items.length > 0 && (
    <>
      <div className="row between"><strong>Subtotal</strong><strong>{money(subtotal)}</strong></div>
      <p className="small muted">Shipping, tax and coupons are calculated at checkout.</p>
      <button className="btn big block" onClick={() => { closeDrawer(); navigate('/checkout'); }}>Checkout</button>
      <button className="btn ghost block" onClick={() => { closeDrawer(); navigate('/cart'); }}>View cart</button>
    </>
  );

  return (
    <Drawer open={drawer} onClose={closeDrawer} side="right" title={`Your cart (${count})`} footer={footer}>
      {items.length === 0 ? (
        <div className="empty"><p className="muted">Your cart is empty.</p><Link className="btn" to="/shop" onClick={closeDrawer}>Browse gear</Link></div>
      ) : (
        <>
          {freeShippingOver > 0 && (
            <div className="ship-bar">
              <p className="small">{left > 0 ? <>Add <strong>{money(left)}</strong> for free shipping</> : <><Icon name="check" size={14} /> You've unlocked free shipping</>}</p>
              <div className="bar"><i style={{ width: `${pct}%` }} /></div>
            </div>
          )}
          {items.map((i) => (
            <div className="mini-line" key={i.key}>
              <Link to={`/product/${i.product}`} onClick={closeDrawer}><ProductImage src={i.image} name={i.name} /></Link>
              <div className="grow">
                <Link to={`/product/${i.product}`} onClick={closeDrawer}><strong>{i.name}</strong></Link>
                {i.variantLabel && <p className="small muted">{i.variantLabel}</p>}
                <p className="small">{money(i.price)}</p>
                <QtyStepper value={i.qty} max={i.countInStock} onChange={(n) => setQty(i.key, n)} label={`Quantity for ${i.name}`} />
              </div>
              <button className="icon-btn" onClick={() => remove(i.key)} aria-label={`Remove ${i.name}`}><Icon name="trash" size={18} /></button>
            </div>
          ))}
        </>
      )}
    </Drawer>
  );
}
