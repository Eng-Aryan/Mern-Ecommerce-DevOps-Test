import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';
import { signToken } from '../utils/token.js';

const payload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isAdmin: user.isAdmin,
  wishlist: user.wishlist,
  shippingAddress: user.shippingAddress,
  token: signToken(user._id),
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new HttpError(400, 'Name, email and password are required');
  const user = await User.create({ name, email, password });
  res.status(201).json(payload(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password || ''))) throw new HttpError(401, 'Email or password is incorrect');
  res.json(payload(user));
});

export const me = asyncHandler(async (req, res) => res.json(payload(req.user)));

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const { name, email, password, currentPassword, shippingAddress } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (shippingAddress) user.shippingAddress = shippingAddress;
  if (password) {
    if (!(await user.matchPassword(currentPassword || ''))) throw new HttpError(400, 'Current password is incorrect');
    user.password = password;
  }
  await user.save();
  res.json(payload(user));
});
