import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Message from '../models/Message.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';
import { getSettings } from '../utils/settings.js';
import { toCsv, sendCsv } from '../utils/csv.js';

const DAY = 86_400_000;
const round = (n) => Math.round(n * 100) / 100;
const startOfDay = (d) => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};
const change = (cur, prev) => (prev ? round(((cur - prev) / prev) * 100) : null); // null = nothing to compare with
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/stats?days=7|30|90
export const stats = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 7), 90);
  const today = startOfDay(new Date());
  const tomorrow = new Date(today.getTime() + DAY);
  const since = new Date(today.getTime() - (days - 1) * DAY);
  const prevSince = new Date(since.getTime() - days * DAY);
  const settings = await getSettings();
  const live = { status: { $ne: 'Cancelled' } };
  const period = (from, to) =>
    Order.aggregate([{ $match: { ...live, createdAt: { $gte: from, $lt: to } } }, { $group: { _id: null, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } }]);

  const [users, products, orders, revenueAgg, byStatus, daily, recentOrders, lowStock, cur, prev, topProducts, newUsers, prevNewUsers, pendingOrders, payments, unreadMessages] =
    await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $match: live }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      // grouped by day in JS below (portable across MongoDB-compatible servers, UTC days)
      Order.find({ createdAt: { $gte: since }, ...live }).select('createdAt totalPrice').lean(),
      Order.find().populate('user', 'name').sort({ createdAt: -1 }).limit(6),
      Product.find({ countInStock: { $lte: settings.lowStockThreshold ?? 5 } }).select('name countInStock images').sort({ countInStock: 1 }).limit(6),
      period(since, tomorrow),
      period(prevSince, since),
      Order.aggregate([
        { $match: { ...live, createdAt: { $gte: since } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', name: { $first: '$items.name' }, image: { $first: '$items.image' }, qty: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      User.countDocuments({ createdAt: { $gte: since } }),
      User.countDocuments({ createdAt: { $gte: prevSince, $lt: since } }),
      Order.countDocuments({ status: 'Processing' }),
      Order.aggregate([{ $match: { ...live, createdAt: { $gte: since } } }, { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } }]),
      Message.countDocuments({ status: 'new' }),
    ]);

  // fill missing days with zero so charts always have one point per day
  const map = new Map();
  daily.forEach((o) => {
    const key = o.createdAt.toISOString().slice(0, 10);
    const c = map.get(key) || { sales: 0, orders: 0 };
    map.set(key, { sales: c.sales + o.totalPrice, orders: c.orders + 1 });
  });
  const series = Array.from({ length: days }, (_, i) => {
    const key = new Date(since.getTime() + i * DAY).toISOString().slice(0, 10);
    return { date: key, sales: round(map.get(key)?.sales || 0), orders: map.get(key)?.orders || 0 };
  });

  const c = cur[0] || { revenue: 0, orders: 0 };
  const p = prev[0] || { revenue: 0, orders: 0 };
  res.json({
    users,
    products,
    orders,
    revenue: revenueAgg[0]?.total || 0,
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    last7: series.slice(-7),
    series,
    days,
    period: {
      revenue: round(c.revenue),
      orders: c.orders,
      newUsers,
      avgOrder: c.orders ? round(c.revenue / c.orders) : 0,
      revenueChange: change(c.revenue, p.revenue),
      ordersChange: change(c.orders, p.orders),
      usersChange: change(newUsers, prevNewUsers),
    },
    topProducts,
    paymentSplit: payments.map((x) => ({ method: x._id, count: x.count, revenue: round(x.revenue) })),
    pendingOrders,
    unreadMessages,
    recentOrders,
    lowStock,
  });
});

// ----- users -----
const userFilter = (q) => {
  const term = String(q || '').trim();
  if (!term) return {};
  const rx = new RegExp(escapeRx(term), 'i');
  return { $or: [{ name: rx }, { email: rx }, { phone: rx }] };
};

// GET /api/admin/users?q=&page=&limit=
export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 15, 100);
  const filter = userFilter(req.query.q);
  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).select('-wishlist -addresses').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  const totals = await Order.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) }, status: { $ne: 'Cancelled' } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$totalPrice' } } },
  ]);
  const byUser = new Map(totals.map((t) => [t._id.toString(), t]));
  res.json({
    users: users.map((u) => ({ ...u, orderCount: byUser.get(u._id.toString())?.orders || 0, totalSpent: round(byUser.get(u._id.toString())?.spent || 0) })),
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-wishlist').lean();
  if (!user) throw new HttpError(404, 'User not found');
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(50).lean();
  const live = orders.filter((o) => o.status !== 'Cancelled');
  res.json({ user, orders, totals: { orders: live.length, spent: round(live.reduce((s, o) => s + o.totalPrice, 0)) } });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  if (user._id.equals(req.user._id)) throw new HttpError(400, "You can't change your own role or status");
  if (typeof req.body.isAdmin === 'boolean') user.isAdmin = req.body.isAdmin;
  if (typeof req.body.isBlocked === 'boolean') user.isBlocked = req.body.isBlocked;
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

export const exportUsers = asyncHandler(async (req, res) => {
  const users = await User.find(userFilter(req.query.q)).select('-wishlist -addresses').sort({ createdAt: -1 }).limit(10000).lean();
  sendCsv(
    res,
    'customers.csv',
    toCsv(users, [
      { label: 'Name', value: (u) => u.name },
      { label: 'Email', value: (u) => u.email },
      { label: 'Phone', value: (u) => u.phone },
      { label: 'Role', value: (u) => (u.isAdmin ? 'Admin' : 'Customer') },
      { label: 'Status', value: (u) => (u.isBlocked ? 'Suspended' : 'Active') },
      { label: 'Joined', value: (u) => u.createdAt },
    ])
  );
});

// ----- coupons -----
const checkCoupon = (b) => {
  if (b.type === 'percent' && Number(b.value) > 100) throw new HttpError(400, 'A percent coupon can be at most 100');
};
export const listCoupons = asyncHandler(async (req, res) => res.json(await Coupon.find().sort({ createdAt: -1 })));
export const createCoupon = asyncHandler(async (req, res) => {
  checkCoupon(req.body);
  res.status(201).json(await Coupon.create(req.body));
});
export const updateCoupon = asyncHandler(async (req, res) => {
  checkCoupon(req.body);
  const { used, ...body } = req.body; // usage count is managed by the server
  const c = await Coupon.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (!c) throw new HttpError(404, 'Coupon not found');
  res.json(c);
});
export const deleteCoupon = asyncHandler(async (req, res) => {
  const c = await Coupon.findByIdAndDelete(req.params.id);
  if (!c) throw new HttpError(404, 'Coupon not found');
  res.json({ message: 'Coupon deleted' });
});
