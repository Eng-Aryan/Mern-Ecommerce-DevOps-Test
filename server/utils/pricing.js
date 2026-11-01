import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import HttpError from './httpError.js';
import { getSettings, formatMoney } from './settings.js';

const round = (n) => Math.round(n * 100) / 100;

// Kept for backwards compatibility; the live values come from store settings.
export const FREE_SHIPPING_OVER = 100;
export const SHIPPING_FLAT = 8;
export const TAX_RATE = 0.08;

/**
 * Builds a trusted price breakdown from the database.
 * Never trust prices sent by the browser.
 * rawItems: [{ product, variant?, qty }]
 */
export const buildQuote = async (rawItems = [], couponCode, shippingMethod = 'standard') => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw new HttpError(400, 'Your cart is empty');
  const settings = await getSettings();

  const products = await Product.find({ _id: { $in: rawItems.map((i) => i.product) } });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const items = rawItems.map((raw) => {
    const p = byId.get(String(raw.product));
    if (!p || p.isActive === false) throw new HttpError(400, 'A product in your cart is no longer available');

    let v = null;
    if (p.variants?.length) {
      v = p.variants.id(raw.variant);
      if (!v) throw new HttpError(400, `Choose a ${String(p.optionName || 'option').toLowerCase()} for ${p.name}`);
    }
    const stock = v ? v.countInStock : p.countInStock;
    const label = v ? `${p.name} (${v.label})` : p.name;
    const qty = Math.max(parseInt(raw.qty, 10) || 1, 1);
    if (qty > stock) throw new HttpError(400, stock === 0 ? `${label} is out of stock` : `Only ${stock} of ${label} left`);

    return {
      product: p._id,
      variant: v?._id,
      variantLabel: v?.label,
      sku: v?.sku || p.sku || undefined,
      name: p.name,
      image: p.images?.[0] || '',
      price: v && v.price > 0 ? v.price : p.price,
      qty,
    };
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
    else if (itemsPrice < coupon.minOrder) couponError = `Spend ${formatMoney(settings, coupon.minOrder)} or more to use this coupon`;

    if (couponError) coupon = null;
    else discount = round(Math.min(itemsPrice, coupon.type === 'percent' ? (itemsPrice * coupon.value) / 100 : coupon.value));
  }

  const discounted = itemsPrice - discount;
  const method = shippingMethod === 'express' && settings.expressEnabled ? 'express' : 'standard';
  const shippingPrice = method === 'express' ? settings.expressShipping : discounted >= settings.freeShippingOver ? 0 : settings.shippingFlat;
  const taxPrice = round(discounted * (settings.taxRate / 100));
  const totalPrice = round(discounted + shippingPrice + taxPrice);

  return { items, itemsPrice, discount, shippingPrice, shippingMethod: method, taxPrice, totalPrice, coupon, couponError, settings };
};
