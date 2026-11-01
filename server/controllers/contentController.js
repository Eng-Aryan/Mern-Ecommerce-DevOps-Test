import Settings from '../models/Settings.js';
import Category from '../models/Category.js';
import Banner from '../models/Banner.js';
import Product from '../models/Product.js';
import Message from '../models/Message.js';
import Subscriber from '../models/Subscriber.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';
import { getSettings, clearSettingsCache } from '../utils/settings.js';
import { sendMail } from '../utils/mailer.js';
import { contactNotice } from '../utils/emails.js';
import { toCsv, sendCsv } from '../utils/csv.js';

const strip = ({ _id, __v, key, createdAt, updatedAt, ...rest }) => rest;
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ----- settings -----
export const publicSettings = asyncHandler(async (req, res) => res.json(strip(await getSettings())));

export const updateSettings = asyncHandler(async (req, res) => {
  const body = strip(req.body);
  const settings = await Settings.findOneAndUpdate({ key: 'main' }, { $set: body }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  clearSettingsCache();
  res.json(strip(settings.toObject()));
});

// ----- banners -----
export const publicBanners = asyncHandler(async (req, res) => {
  res.json(await Banner.find({ active: true }).sort({ order: 1, createdAt: -1 }));
});
export const listBanners = asyncHandler(async (req, res) => res.json(await Banner.find().sort({ position: 1, order: 1, createdAt: -1 })));
export const createBanner = asyncHandler(async (req, res) => res.status(201).json(await Banner.create(req.body)));
export const updateBanner = asyncHandler(async (req, res) => {
  const b = await Banner.findByIdAndUpdate(req.params.id, strip(req.body), { new: true, runValidators: true });
  if (!b) throw new HttpError(404, 'Banner not found');
  res.json(b);
});
export const deleteBanner = asyncHandler(async (req, res) => {
  const b = await Banner.findByIdAndDelete(req.params.id);
  if (!b) throw new HttpError(404, 'Banner not found');
  res.json({ message: 'Banner deleted' });
});

// ----- categories (admin) -----
export const adminCategories = asyncHandler(async (req, res) => {
  const [docs, rows] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).lean(),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const counts = new Map(rows.map((r) => [r._id, r.count]));
  const out = docs.map((c) => ({ ...c, count: counts.get(c.name) || 0 }));
  // product categories that have no record yet: shown so the admin can promote them
  rows.filter((r) => !docs.some((d) => d.name === r._id)).forEach((r) => out.push({ name: r._id, count: r.count, unsaved: true }));
  res.json(out);
});
export const createCategory = asyncHandler(async (req, res) => res.status(201).json(await Category.create(strip(req.body))));
export const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw new HttpError(404, 'Category not found');
  const oldName = cat.name;
  Object.assign(cat, strip(req.body));
  await cat.save();
  // keep products attached when a category is renamed
  if (cat.name !== oldName) await Product.updateMany({ category: oldName }, { category: cat.name });
  res.json(cat);
});
export const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw new HttpError(404, 'Category not found');
  if (await Product.exists({ category: cat.name })) throw new HttpError(400, 'This category still has products. Move or delete them first');
  await cat.deleteOne();
  res.json({ message: 'Category deleted' });
});

// ----- newsletter -----
export const subscribe = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Enter a valid email address');
  await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
  res.status(201).json({ message: "You're subscribed. Thanks!" });
});
export const listSubscribers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 20;
  const filter = req.query.q ? { email: new RegExp(escapeRx(String(req.query.q).trim()), 'i') } : {};
  const [total, subscribers] = await Promise.all([Subscriber.countDocuments(filter), Subscriber.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)]);
  res.json({ subscribers, page, pages: Math.ceil(total / limit), total });
});
export const deleteSubscriber = asyncHandler(async (req, res) => {
  if (!(await Subscriber.findByIdAndDelete(req.params.id))) throw new HttpError(404, 'Subscriber not found');
  res.json({ message: 'Removed' });
});
export const exportSubscribers = asyncHandler(async (req, res) => {
  const subs = await Subscriber.find().sort({ createdAt: -1 }).lean();
  sendCsv(res, 'subscribers.csv', toCsv(subs, [{ label: 'Email', value: (s) => s.email }, { label: 'Subscribed', value: (s) => s.createdAt }]));
});

// ----- contact form -----
export const contact = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  const msg = await Message.create({ name, email, subject, message });
  const settings = await getSettings();
  const to = settings.contact?.email || process.env.CONTACT_TO;
  if (to) sendMail({ to, ...contactNotice(msg, settings) });
  res.status(201).json({ message: "Thanks, we've got your message and will reply soon." });
});
export const listMessages = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 15;
  const filter = ['new', 'read', 'replied'].includes(req.query.status) ? { status: req.query.status } : {};
  const [total, messages] = await Promise.all([Message.countDocuments(filter), Message.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)]);
  res.json({ messages, page, pages: Math.ceil(total / limit), total });
});
export const updateMessage = asyncHandler(async (req, res) => {
  const m = await Message.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!m) throw new HttpError(404, 'Message not found');
  res.json(m);
});
export const deleteMessage = asyncHandler(async (req, res) => {
  if (!(await Message.findByIdAndDelete(req.params.id))) throw new HttpError(404, 'Message not found');
  res.json({ message: 'Message deleted' });
});
