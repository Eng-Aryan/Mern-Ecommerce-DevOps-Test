import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export const lineKey = (product, variant) => `${product}:${variant || ''}`;

const read = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('cart'));
    return Array.isArray(saved)
      ? saved
          .filter((i) => i && typeof i.product === 'string' && Number(i.price) >= 0 && Number(i.qty) > 0)
          .map((i) => ({ ...i, key: i.key || lineKey(i.product, i.variant) })) // carts saved by older versions have no key
      : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(read);
  const [coupon, setCoupon] = useState(() => localStorage.getItem('coupon') || '');
  const [drawer, setDrawer] = useState(false);

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(items)); }, [items]);
  useEffect(() => { coupon ? localStorage.setItem('coupon', coupon) : localStorage.removeItem('coupon'); }, [coupon]);
  // keep several tabs in sync
  useEffect(() => {
    const onStorage = (e) => { if (e.key === 'cart') setItems(read()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // add(product, qty, variant?) — variant is one entry of product.variants
  const add = (product, qty = 1, variant = null) =>
    setItems((prev) => {
      const key = lineKey(product._id, variant?._id);
      const max = variant ? variant.countInStock : product.countInStock;
      const price = variant && variant.price > 0 ? variant.price : product.price;
      const found = prev.find((i) => i.key === key);
      if (found) return prev.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + qty, max), countInStock: max, price } : i));
      return [...prev, { key, product: product._id, variant: variant?._id, variantLabel: variant?.label, name: product.name, image: product.images?.[0] || '', price, countInStock: max, qty: Math.min(qty, max) }];
    });

  const setQty = (key, qty) => setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, i.countInStock)) } : i)));
  const remove = (key) => setItems((prev) => prev.filter((i) => i.key !== key));
  const clear = () => { setItems([]); setCoupon(''); };

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.qty * i.price, 0), [items]);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, count, subtotal, coupon, setCoupon, drawer, openDrawer: () => setDrawer(true), closeDrawer: () => setDrawer(false) }}>
      {children}
    </CartContext.Provider>
  );
}
