import { money } from '../api.js';

export default function Summary({ q, loading }) {
  if (!q) return null;
  return (
    <dl className={`summary ${loading ? 'dim' : ''}`}>
      <div><dt>Items</dt><dd>{money(q.itemsPrice)}</dd></div>
      {q.discount > 0 && <div className="good"><dt>Coupon {q.couponCode}</dt><dd>−{money(q.discount)}</dd></div>}
      <div><dt>Shipping</dt><dd>{q.shippingPrice === 0 ? 'Free' : money(q.shippingPrice)}</dd></div>
      <div><dt>Tax</dt><dd>{money(q.taxPrice)}</dd></div>
      <div className="total"><dt>Total</dt><dd>{money(q.totalPrice)}</dd></div>
    </dl>
  );
}
