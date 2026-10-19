import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import HttpError from './httpError.js';

export const FREE_SHIPPING_OVER = 100;
export const SHIPPING_FLAT = 8;
export const TAX_RATE = 0.08;

const round = (n) => Math.round(n * 100) / 100;

/**
 * Builds a trusted price breakdown from the database.
 * Never trust prices sent by the browser.
 */
export const buildQuote = async (rawItems = [], couponCode) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw new HttpError(400, 'Your cart is empty');

  const products = await Product.find({ _id: { $in: rawItems.map((i) => i.product) } });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const items = rawItems.map((raw) => {
    const p = byId.get(String(raw.product));
    if (!p) throw new HttpError(400, 'A product in your cart is no longer available');
    const qty = Math.max(parseInt(raw.qty, 10) || 1, 1);
    if (qty > p.countInStock)
      throw new HttpError(400, p.countInStock === 0 ? `${p.name} is out of stock` : `Only ${p.countInStock} of ${p.name} left`);
    return { product: p._id, name: p.name, image: p.images?.[0] || '', price: p.price, qty };
  });

  const itemsPrice = round(items.reduce((s, i) => s + i.price * i.qty, 0));

  let discount = 0;
  let coupon = null;
  let couponError = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase().trim() });
    if (!coupon || !coupon.active) couponError = 'That coupon code is not valid';
    else if (coupon.expiresAt && coupon.expiresAt < new Date()) couponError = 'That coupon has expired';
    else if (coupon.usageLimit && coupon.used >= coupon.usageLimit) couponError = 'That coupon has been fully redeemed';
    else if (itemsPrice < coupon.minOrder) couponError = `Spend $${coupon.minOrder} or more to use this coupon`;

    if (couponError) coupon = null;
    else discount = round(Math.min(itemsPrice, coupon.type === 'percent' ? (itemsPrice * coupon.value) / 100 : coupon.value));
  }

  const discounted = itemsPrice - discount;
  const shippingPrice = discounted >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FLAT;
  const taxPrice = round(discounted * TAX_RATE);
  const totalPrice = round(discounted + shippingPrice + taxPrice);

  return { items, itemsPrice, discount, shippingPrice, taxPrice, totalPrice, coupon, couponError };
};
