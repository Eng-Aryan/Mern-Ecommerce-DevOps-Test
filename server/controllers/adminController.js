import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';

export const stats = asyncHandler(async (req, res) => {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 6);
  since.setUTCHours(0, 0, 0, 0);

  const [users, products, orders, revenueAgg, byStatus, daily, recentOrders, lowStock] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    // grouped by day in JS below (portable across MongoDB-compatible servers, UTC days)
    Order.find({ createdAt: { $gte: since }, status: { $ne: 'Cancelled' } }).select('createdAt totalPrice').lean(),
    Order.find().populate('user', 'name').sort({ createdAt: -1 }).limit(6),
    Product.find({ countInStock: { $lte: 5 } }).select('name countInStock images').sort({ countInStock: 1 }).limit(6),
  ]);

  // fill missing days with zero so the chart always has 7 bars
  const map = new Map();
  daily.forEach((o) => {
    const key = o.createdAt.toISOString().slice(0, 10);
    const cur = map.get(key) || { sales: 0, orders: 0 };
    map.set(key, { sales: cur.sales + o.totalPrice, orders: cur.orders + 1 });
  });
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, sales: Math.round((map.get(key)?.sales || 0) * 100) / 100, orders: map.get(key)?.orders || 0 };
  });

  res.json({
    users,
    products,
    orders,
    revenue: revenueAgg[0]?.total || 0,
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    last7,
    recentOrders,
    lowStock,
  });
});

// ----- users -----
export const listUsers = asyncHandler(async (req, res) => res.json(await User.find().sort({ createdAt: -1 })));

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  if (user._id.equals(req.user._id)) throw new HttpError(400, "You can't change your own role");
  if (typeof req.body.isAdmin === 'boolean') user.isAdmin = req.body.isAdmin;
  await user.save();
  res.json(user);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  if (user._id.equals(req.user._id)) throw new HttpError(400, "You can't delete your own account");
  await user.deleteOne();
  res.json({ message: 'User deleted' });
});

// ----- coupons -----
export const listCoupons = asyncHandler(async (req, res) => res.json(await Coupon.find().sort({ createdAt: -1 })));
export const createCoupon = asyncHandler(async (req, res) => res.status(201).json(await Coupon.create(req.body)));
export const updateCoupon = asyncHandler(async (req, res) => {
  const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!c) throw new HttpError(404, 'Coupon not found');
  res.json(c);
});
export const deleteCoupon = asyncHandler(async (req, res) => {
  const c = await Coupon.findByIdAndDelete(req.params.id);
  if (!c) throw new HttpError(404, 'Coupon not found');
  res.json({ message: 'Coupon deleted' });
});
