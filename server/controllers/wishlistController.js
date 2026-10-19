import User from '../models/User.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({ path: 'wishlist', select: '-reviews' });
  res.json(user.wishlist);
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const exists = await Product.exists({ _id: req.params.productId });
  if (!exists) return res.status(404).json({ message: 'Product not found' });
  const has = req.user.wishlist.some((id) => id.toString() === req.params.productId);
  const update = has ? { $pull: { wishlist: req.params.productId } } : { $addToSet: { wishlist: req.params.productId } };
  await User.updateOne({ _id: req.user._id }, update);
  const user = await User.findById(req.user._id).select('wishlist');
  res.json({ wishlist: user.wishlist, added: !has });
});
