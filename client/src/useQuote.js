import { useEffect, useState } from 'react';
import api, { errMsg } from './api.js';

// Asks the server for a trusted price breakdown whenever the cart, coupon or shipping method changes.
export default function useQuote(items, couponCode, shippingMethod = 'standard') {
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(items.map((i) => [i.product, i.variant, i.qty])) + couponCode + shippingMethod;

  useEffect(() => {
    if (!items.length) { setQuote(null); return; }
    let alive = true;
    setLoading(true);
    api
      .post('/orders/quote', { items: items.map((i) => ({ product: i.product, variant: i.variant, qty: i.qty })), couponCode, shippingMethod })
      .then((r) => alive && (setQuote(r.data), setError('')))
      .catch((e) => alive && (setQuote(null), setError(errMsg(e))))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [key]); // eslint-disable-line

  return { quote, error, loading };
}
