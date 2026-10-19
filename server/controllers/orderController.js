import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';
import { buildQuote, FREE_SHIPPING_OVER, SHIPPING_FLAT, TAX_RATE } from '../utils/pricing.js';

// POST /api/orders/quote  — price preview for cart & checkout
export const quote = asyncHandler(async (req, res) => {
  const { items, itemsPrice, discount, shippingPrice, taxPrice, totalPrice, coupon, couponError } = await buildQuote(
    req.body.items,
    req.body.couponCode
  );
  res.json({
    items,
    itemsPrice,
    discount,
    shippingPrice,
    taxPrice,
    totalPrice,
    couponCode: coupon?.code || null,
    couponError,
    rules: { freeShippingOver: FREE_SHIPPING_OVER, shippingFlat: SHIPPING_FLAT, taxRate: TAX_RATE },
  });
});

export const createOrder = asyncHandler(async (req, res) => {
  const { items: rawItems, shippingAddress, paymentMethod = 'COD', couponCode } = req.body;
  if (!['COD', 'Stripe'].includes(paymentMethod)) throw new HttpError(400, 'Unsupported payment method');
  if (paymentMethod === 'Stripe' && !process.env.STRIPE_SECRET_KEY) throw new HttpError(400, 'Card payments are not enabled');

  const a = shippingAddress || {};
  const missing = ['fullName', 'address', 'city', 'postalCode', 'country'].filter((k) => !String(a[k] || '').trim());
  if (missing.length) throw new HttpError(400, 'Complete your shipping address before placing the order');

  const q = await buildQuote(rawItems, couponCode);
  if (couponCode && q.couponError) throw new HttpError(400, q.couponError);

  // Reserve stock atomically; roll back if any line fails.
  const reserved = [];
  try {
    for (const item of q.items) {
      const r = await Product.updateOne(
        { _id: item.product, countInStock: { $gte: item.qty } },
        { $inc: { countInStock: -item.qty } }
      );
      if (r.modifiedCount !== 1) throw new HttpError(400, `${item.name} just sold out. Update your cart`);
      reserved.push(item);
    }
  } catch (err) {
    await Promise.all(reserved.map((i) => Product.updateOne({ _id: i.product }, { $inc: { countInStock: i.qty } })));
    throw err;
  }

  let order;
  try {
    order = await Order.create({
      user: req.user._id,
      items: q.items,
      shippingAddress,
      paymentMethod,
      itemsPrice: q.itemsPrice,
      shippingPrice: q.shippingPrice,
      taxPrice: q.taxPrice,
      discount: q.discount,
      couponCode: q.coupon?.code,
      totalPrice: q.totalPrice,
    });
  } catch (err) {
    // give the reserved stock back if the order could not be saved
    await Promise.all(q.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { countInStock: i.qty } })));
    throw err;
  }

  if (q.coupon) await Coupon.updateOne({ _id: q.coupon._id }, { $inc: { used: 1 } });
  res.status(201).json(order);
});

export const myOrders = asyncHandler(async (req, res) => {
  res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }));
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new HttpError(404, 'Order not found');
  const ownerId = order.user._id.toString();
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
  await order.save();
  await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { countInStock: i.qty } })));
  res.json(order);
});

// ----- Admin -----
export const allOrders = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 15;
  const filter = req.query.status ? { status: req.query.status } : {};
  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
  ]);
  res.json({ orders, page, pages: Math.ceil(total / limit), total });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, isPaid } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');

  if (status && status !== order.status) {
    if (status === 'Cancelled' && order.status !== 'Cancelled')
      await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { countInStock: i.qty } })));
    if (order.status === 'Cancelled' && status !== 'Cancelled')
      await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { countInStock: -i.qty } })));
    order.status = status;
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
  await order.save();
  res.json(order);
});
