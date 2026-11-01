import crypto from 'crypto';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';
import { signToken } from '../utils/token.js';
import { getSettings } from '../utils/settings.js';
import { sendMail, mailEnabled } from '../utils/mailer.js';
import * as emails from '../utils/emails.js';

const payload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  isAdmin: user.isAdmin,
  wishlist: user.wishlist,
  shippingAddress: user.shippingAddress,
  addresses: user.addresses,
  token: signToken(user._id),
});

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const ADDRESS_KEYS = ['label', 'fullName', 'phone', 'address', 'city', 'postalCode', 'country'];
const pickAddress = (body) => Object.fromEntries(ADDRESS_KEYS.filter((k) => body[k] !== undefined).map((k) => [k, String(body[k]).trim()]));

// keeps user.shippingAddress equal to the default saved address (used to prefill checkout)
const syncDefault = (user) => {
  const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
  if (def && !user.addresses.some((a) => a.isDefault)) def.isDefault = true;
  user.shippingAddress = def
    ? { fullName: def.fullName, phone: def.phone, address: def.address, city: def.city, postalCode: def.postalCode, country: def.country }
    : undefined;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new HttpError(400, 'Name, email and password are required');
  const user = await User.create({ name, email, password });
  getSettings().then((s) => { const m = emails.welcome(user, s); return sendMail({ to: user.email, ...m }); }).catch(() => {});
  res.status(201).json(payload(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password || ''))) throw new HttpError(401, 'Email or password is incorrect');
  if (user.isBlocked) throw new HttpError(403, 'This account has been suspended. Contact support');
  user.lastLoginAt = new Date();
  await User.updateOne({ _id: user._id }, { lastLoginAt: user.lastLoginAt });
  res.json(payload(user));
});

export const me = asyncHandler(async (req, res) => res.json(payload(req.user)));

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const { name, email, phone, password, currentPassword, shippingAddress } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (shippingAddress) user.shippingAddress = shippingAddress;
  if (password) {
    if (!(await user.matchPassword(currentPassword || ''))) throw new HttpError(400, 'Current password is incorrect');
    user.password = password;
  }
  await user.save();
  res.json(payload(user));
});

// ----- address book -----
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const a = pickAddress(req.body);
  const missing = ['fullName', 'address', 'city', 'postalCode', 'country'].filter((k) => !a[k]);
  if (missing.length) throw new HttpError(400, 'Fill in name, street, city, postal code and country');
  if (user.addresses.length >= 10) throw new HttpError(400, 'You can save up to 10 addresses');
  if (req.body.isDefault || user.addresses.length === 0) user.addresses.forEach((x) => (x.isDefault = false));
  user.addresses.push({ ...a, isDefault: Boolean(req.body.isDefault) || user.addresses.length === 0 });
  syncDefault(user);
  await user.save();
  res.status(201).json(payload(user));
});

export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.id);
  if (!addr) throw new HttpError(404, 'Address not found');
  Object.assign(addr, pickAddress(req.body));
  if (req.body.isDefault) user.addresses.forEach((x) => (x.isDefault = x._id.equals(addr._id)));
  syncDefault(user);
  await user.save();
  res.json(payload(user));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.id);
  if (!addr) throw new HttpError(404, 'Address not found');
  addr.deleteOne();
  syncDefault(user);
  await user.save();
  res.json(payload(user));
});

// ----- password reset -----
export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const user = email ? await User.findOne({ email }) : null;
  let devResetUrl;
  if (user && !user.isBlocked) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = sha(token);
    user.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const url = `${(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')}/reset-password/${token}`;
    const settings = await getSettings();
    await sendMail({ to: user.email, ...emails.resetPassword(url, settings) });
    // Without SMTP (local development only) hand the link back so the flow can be tested.
    if (!mailEnabled() && process.env.NODE_ENV !== 'production') devResetUrl = url;
  }
  // Same answer whether or not the account exists, so emails can't be probed.
  res.json({ message: 'If that email is registered, a reset link is on its way.', devResetUrl });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
  const user = await User.findOne({ resetToken: sha(String(req.params.token)), resetExpires: { $gt: new Date() } }).select('+password +resetToken +resetExpires');
  if (!user) throw new HttpError(400, 'This reset link is invalid or has expired');
  user.password = password;
  user.resetToken = undefined;
  user.resetExpires = undefined;
  await user.save();
  res.json(payload(user));
});
