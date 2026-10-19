import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';

const SORTS = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { rating: -1, numReviews: -1 },
};

// GET /api/products?keyword=&category=&minPrice=&maxPrice=&sort=&page=&limit=&featured=
export const getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice, sort = 'newest', featured, inStock } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 12, 48);

  const filter = {};
  if (keyword && keyword.trim()) {
    const rx = new RegExp(keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { category: rx }, { description: rx }];
  }
  if (category) filter.category = category;
  if (featured === 'true') filter.featured = true;
  if (inStock === 'true') filter.countInStock = { $gt: 0 };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .select('-reviews')
      .sort(SORTS[sort] || SORTS.newest)
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({ products, page, pages: Math.ceil(total / limit), total });
});

export const getCategories = asyncHandler(async (req, res) => {
  const rows = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json(rows.map((r) => ({ name: r._id, count: r.count })));
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  const related = await Product.find({ category: product.category, _id: { $ne: product._id } })
    .select('-reviews')
    .limit(4);
  res.json({ product, related });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  const fields = ['name', 'description', 'brand', 'category', 'price', 'comparePrice', 'images', 'countInStock', 'featured'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });
  await product.save();
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ message: 'Product deleted' });
});

export const createReview = asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating);
  const comment = (req.body.comment || '').trim();
  if (!rating || rating < 1 || rating > 5) throw new HttpError(400, 'Choose a rating from 1 to 5');
  if (!comment) throw new HttpError(400, 'Write a short comment');

  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  if (product.reviews.some((r) => r.user.toString() === req.user._id.toString()))
    throw new HttpError(400, 'You have already reviewed this product');

  product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment });
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length;
  await product.save();
  res.status(201).json({ message: 'Review added' });
});
