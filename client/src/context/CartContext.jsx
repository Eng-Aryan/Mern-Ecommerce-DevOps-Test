import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const read = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('cart'));
    return Array.isArray(saved)
      ? saved.filter((i) => i && typeof i.product === 'string' && Number(i.price) >= 0 && Number(i.qty) > 0)
      : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(read);
  const [coupon, setCoupon] = useState(() => localStorage.getItem('coupon') || '');

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);
  useEffect(() => {
    if (coupon) localStorage.setItem('coupon', coupon);
    else localStorage.removeItem('coupon');
  }, [coupon]);

  const add = (product, qty = 1) =>
    setItems((prev) => {
      const found = prev.find((i) => i.product === product._id);
      const max = product.countInStock;
      if (found) return prev.map((i) => (i.product === product._id ? { ...i, qty: Math.min(i.qty + qty, max), countInStock: max } : i));
      return [
        ...prev,
        { product: product._id, name: product.name, image: product.images?.[0] || '', price: product.price, countInStock: max, qty: Math.min(qty, max) },
      ];
    });

  const setQty = (id, qty) =>
    setItems((prev) => prev.map((i) => (i.product === id ? { ...i, qty: Math.max(1, Math.min(qty, i.countInStock)) } : i)));
  const remove = (id) => setItems((prev) => prev.filter((i) => i.product !== id));
  const clear = () => {
    setItems([]);
    setCoupon('');
  };

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.qty * i.price, 0), [items]);

  return <CartContext.Provider value={{ items, add, setQty, remove, clear, count, subtotal, coupon, setCoupon }}>{children}</CartContext.Provider>;
}
