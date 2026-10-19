import { useEffect, useState } from 'react';
import api, { errMsg } from './api.js';

// Asks the server for a trusted price breakdown whenever the cart or coupon changes.
export default function useQuote(items, couponCode) {
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(items.map((i) => [i.product, i.qty])) + couponCode;

  useEffect(() => {
    if (!items.length) {
      setQuote(null);
      return;
    }
    let alive = true;
    setLoading(true);
    api
      .post('/orders/quote', { items: items.map((i) => ({ product: i.product, qty: i.qty })), couponCode })
      .then((r) => alive && (setQuote(r.data), setError('')))
      .catch((e) => alive && (setQuote(null), setError(errMsg(e))))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [key]); // eslint-disable-line

  return { quote, error, loading };
}
