import Order from '../models/Order.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';
import { buildQuote, FREE_SHIPPING_OVER, SHIPPING_FLAT, TAX_RATE } from '../utils/pricing.js';
import { reserve, release } from '../utils/stock.js';
import { sendMail } from '../utils/mailer.js';
import * as emails from '../utils/emails.js';
import { getSettings } from '../utils/settings.js';
import { toCsv, sendCsv } from '../utils/csv.js';

const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const notify = async (order, kind) => {
  try {
    const settings = await getSettings();
    const user = await User.findById(order.user).select('email');
    if (!user) return;
    const mail = kind === 'confirm' ? emails.orderConfirmation(order, settings) : emails.orderStatus(order, settings);
    await sendMail({ to: user.email, ...mail });
  } catch (err) {
    console.error('Order email failed:', err.message);
  }
};

// POST /api/orders/quote  — price preview for cart & checkout
export const quote = asyncHandler(async (req, res) => {
  const q = await buildQuote(req.body.items, req.body.couponCode, req.body.shippingMethod);
  const { settings } = q;
  res.json({
    items: q.items,
    itemsPrice: q.itemsPrice,
    discount: q.discount,
    shippingPrice: q.shippingPrice,
    shippingMethod: q.shippingMethod,
    taxPrice: q.taxPrice,
    totalPrice: q.totalPrice,
    couponCode: q.coupon?.code || null,
    couponError: q.couponError,
    rules: {
      freeShippingOver: settings.freeShippingOver ?? FREE_SHIPPING_OVER,
      shippingFlat: settings.shippingFlat ?? SHIPPING_FLAT,
      expressShipping: settings.expressShipping,
      expressEnabled: settings.expressEnabled,
      taxRate: (settings.taxRate ?? TAX_RATE * 100) / 100,
    },
  });
});

export const createOrder = asyncHandler(async (req, res) => {
  const { items: rawItems, shippingAddress, paymentMethod = 'COD', couponCode, shippingMethod = 'standard', customerNote = '' } = req.body;
  if (!['COD', 'Stripe'].includes(paymentMethod)) throw new HttpError(400, 'Unsupported payment method');
  const settings = await getSettings();
  if (paymentMethod === 'Stripe' && (!process.env.STRIPE_SECRET_KEY || !settings.cardEnabled)) throw new HttpError(400, 'Card payments are not enabled');
  if (paymentMethod === 'COD' && !settings.codEnabled) throw new HttpError(400, 'Pay on delivery is not available right now');

  const a = shippingAddress || {};
  const missing = ['fullName', 'address', 'city', 'postalCode', 'country'].filter((k) => !String(a[k] || '').trim());
  if (missing.length) throw new HttpError(400, 'Complete your shipping address before placing the order');

  const q = await buildQuote(rawItems, couponCode, shippingMethod);
  if (couponCode && q.couponError) throw new HttpError(400, q.couponError);

  // Reserve stock atomically; rolls back by itself if any line fails.
  await reserve(q.items);

  let order;
  try {
    order = await Order.create({
      user: req.user._id,
      items: q.items,
      shippingAddress,
      shippingMethod: q.shippingMethod,
      paymentMethod,
      itemsPrice: q.itemsPrice,
      shippingPrice: q.shippingPrice,
      taxPrice: q.taxPrice,
      discount: q.discount,
      couponCode: q.coupon?.code,
      totalPrice: q.totalPrice,
      customerNote: String(customerNote).slice(0, 500),
      statusHistory: [{ status: 'Processing', note: 'Order placed' }],
    });
  } catch (err) {
    // give the reserved stock back if the order could not be saved
    await release(q.items);
    throw err;
  }

  if (q.coupon) {
    // guarded so a coupon with a usage limit can't be over-redeemed by parallel orders
    await Coupon.updateOne(
      { _id: q.coupon._id, $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$used', '$usageLimit'] } }] },
      { $inc: { used: 1 } }
    );
  }
  notify(order, 'confirm');
  res.status(201).json(order);
});

export const myOrders = asyncHandler(async (req, res) => {
  res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }));
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) throw new HttpError(404, 'Order not found');
  const ownerId = order.user?._id?.toString();
  if (ownerId !== req.user._id.toString() && !req.user.isAdmin) throw new HttpError(403, 'This order belongs to another account');
  res.json(order);
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) throw new HttpError(403, 'Not allowed');
  if (order.status !== 'Processing') throw new HttpError(400, `A ${order.status.toLowerCase()} order can't be cancelled`);
  if (order.isPaid) throw new HttpError(400, 'Paid orders must be cancelled through support so we can refund you');

  order.status = 'Cancelled';
  order.statusHistory.push({ status: 'Cancelled', note: req.user.isAdmin && order.user.toString() !== req.user._id.toString() ? 'Cancelled by store' : 'Cancelled by customer' });
  await order.save();
  await release(order.items);
  res.json(order);
});

// ----- Admin -----
const adminFilter = (query) => {
  const { status, payment, method, from, to, q } = query;
  const filter = {};
  if (STATUSES.includes(status)) filter.status = status;
  if (payment === 'paid') filter.isPaid = true;
  if (payment === 'unpaid') filter.isPaid = false;
  if (['COD', 'Stripe'].includes(method)) filter.paymentMethod = method;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
    if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
  }
  return filter;
};

// order search: matches the order number (last characters of the id) or the customer's name/email
const withSearch = async (filter, q) => {
  const term = String(q || '').trim();
  if (!term) return filter;
  const rx = new RegExp(escapeRx(term), 'i');
  const users = await User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id').limit(200);
  return {
    ...filter,
    $or: [{ user: { $in: users.map((u) => u._id) } }, { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: escapeRx(term), options: 'i' } } }, { trackingNumber: rx }],
  };
};

export const allOrders = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 15, 100);
  const filter = await withSearch(adminFilter(req.query), req.query.q);
  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
  ]);
  res.json({ orders, page, pages: Math.ceil(total / limit), total });
});

export const exportOrders = asyncHandler(async (req, res) => {
  const filter = await withSearch(adminFilter(req.query), req.query.q);
  const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).limit(5000).lean();
  sendCsv(
    res,
    'orders.csv',
    toCsv(orders, [
      { label: 'Order', value: (o) => String(o._id).slice(-8).toUpperCase() },
      { label: 'Date', value: (o) => o.createdAt },
      { label: 'Customer', value: (o) => o.user?.name },
      { label: 'Email', value: (o) => o.user?.email },
      { label: 'Items', value: (o) => o.items.reduce((s, i) => s + i.qty, 0) },
      { label: 'Subtotal', value: (o) => o.itemsPrice },
      { label: 'Discount', value: (o) => o.discount },
      { label: 'Shipping', value: (o) => o.shippingPrice },
      { label: 'Tax', value: (o) => o.taxPrice },
      { label: 'Total', value: (o) => o.totalPrice },
      { label: 'Payment', value: (o) => o.paymentMethod },
      { label: 'Paid', value: (o) => (o.isPaid ? 'yes' : 'no') },
      { label: 'Status', value: (o) => o.status },
      { label: 'Carrier', value: (o) => o.carrier },
      { label: 'Tracking', value: (o) => o.trackingNumber },
      { label: 'Ship to', value: (o) => [o.shippingAddress?.address, o.shippingAddress?.city, o.shippingAddress?.country].filter(Boolean).join(', ') },
    ])
  );
});

// shared by the single and bulk update endpoints; returns the saved order
const applyUpdate = async (order, { status, isPaid, carrier, trackingNumber, adminNote, note }) => {
  let statusChanged = false;
  if (status && STATUSES.includes(status) && status !== order.status) {
    if (status === 'Cancelled') await release(order.items);
    if (order.status === 'Cancelled') await reserve(order.items, (i) => `Not enough stock of ${i.name} to reopen this order`);
    order.status = status;
    order.statusHistory.push({ status, note: note || '' });
    statusChanged = true;
    if (status === 'Delivered') {
      order.deliveredAt = new Date();
      if (order.paymentMethod === 'COD' && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
      }
    }
  }
  if (typeof isPaid === 'boolean' && isPaid !== order.isPaid) {
    order.isPaid = isPaid;
    order.paidAt = isPaid ? new Date() : undefined;
  }
  if (carrier !== undefined) order.carrier = String(carrier).trim();
  if (trackingNumber !== undefined) order.trackingNumber = String(trackingNumber).trim();
  if (adminNote !== undefined) order.adminNote = String(adminNote).slice(0, 1000);
  await order.save();
  return { order, statusChanged };
};

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');
  const { order: saved, statusChanged } = await applyUpdate(order, req.body);
  if (statusChanged && ['Shipped', 'Delivered'].includes(saved.status)) notify(saved, 'status');
  res.json(saved);
});

// PUT /api/admin/orders-bulk  { ids, status }
export const bulkUpdateOrders = asyncHandler(async (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !ids.length) throw new HttpError(400, 'Select at least one order');
  if (!STATUSES.includes(status)) throw new HttpError(400, 'Choose a valid status');
  let updated = 0;
  const failed = [];
  for (const id of ids) {
    try {
      const order = await Order.findById(id);
      if (!order) continue;
      const { order: saved, statusChanged } = await applyUpdate(order, { status });
      if (statusChanged) {
        updated++;
        if (['Shipped', 'Delivered'].includes(saved.status)) notify(saved, 'status');
      }
    } catch (err) {
      failed.push(`${String(id).slice(-8).toUpperCase()}: ${err.message}`);
    }
  }
  res.json({ updated, failed });
});
