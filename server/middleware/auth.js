import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new HttpError(401, 'Sign in to continue');
  let decoded;
  try {
    decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Your session has expired. Sign in again');
  }
  const user = await User.findById(decoded.id);
  if (!user) throw new HttpError(401, 'This account no longer exists');
  if (user.isBlocked) throw new HttpError(403, 'This account has been suspended. Contact support');
  req.user = user;
  next();
});

export const admin = (req, res, next) => {
  if (!req.user?.isAdmin) return next(new HttpError(403, 'Admin access required'));
  next();
};

// Attaches req.user when a valid token is sent, but never blocks the request.
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && !user.isBlocked) req.user = user;
    } catch {
      /* ignore invalid token on public routes */
    }
  }
  next();
});
