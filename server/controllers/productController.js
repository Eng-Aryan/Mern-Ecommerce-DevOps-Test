import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';
import { toCsv, sendCsv } from '../utils/csv.js';

const SORTS = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { rating: -1, numReviews: -1 },
  bestselling: { sold: -1, createdAt: -1 },
  name: { name: 1 },
};

const FIELDS = ['name', 'description', 'brand', 'category', 'sku', 'tags', 'price', 'comparePrice', 'images', 'countInStock', 'optionName', 'variants', 'featured', 'isActive'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const visible = { isActive: { $ne: false } }; // old products without the flag count as active

// GET /api/products?keyword=&category=&brand=a,b&minPrice=&maxPrice=&minRating=&onSale=&inStock=&sort=&page=&limit=&featured=
export const getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, brand, minPrice, maxPrice, minRating, sort = 'newest', featured, inStock, onSale } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 12, 48);

  const filter = { ...visible };
  if (keyword && String(keyword).trim()) {
    const rx = new RegExp(escapeRx(String(keyword).trim()), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { category: rx }, { description: rx }, { sku: rx }, { tags: rx }];
  }
  if (category) filter.category = String(category);
  if (brand) filter.brand = { $in: String(brand).split(',').filter(Boolean) };
  if (featured === 'true') filter.featured = true;
  if (inStock === 'true') filter.countInStock = { $gt: 0 };
  if (onSale === 'true') filter.$expr = { $gt: ['$comparePrice', '$price'] };
  if (minRating) filter.rating = { $gte: Number(minRating) };
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

// GET /api/products/suggest?q=  — instant search suggestions
export const suggest = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ products: [], categories: [] });
  const rx = new RegExp(escapeRx(q), 'i');
  const [products, categories] = await Promise.all([
    Product.find({ ...visible, $or: [{ name: rx }, { brand: rx }, { tags: rx }] }).select('name price images category').sort({ sold: -1 }).limit(6),
    Product.distinct('category', { ...visible, category: rx }),
  ]);
  res.json({ products, categories: categories.slice(0, 3) });
});

export const getCategories = asyncHandler(async (req, res) => {
  const [rows, docs] = await Promise.all([
    Product.aggregate([{ $match: visible }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    Category.find({ active: { $ne: false } }).sort({ order: 1, name: 1 }).lean(),
  ]);
  const counts = new Map(rows.map((r) => [r._id, r.count]));
  const out = docs.map((c) => ({ name: c.name, slug: c.slug, image: c.image, description: c.description, count: counts.get(c.name) || 0 }));
  // categories that exist only on products (no Category record yet) still show up
  rows.filter((r) => !docs.some((d) => d.name === r._id)).sort((a, b) => String(a._id).localeCompare(String(b._id))).forEach((r) => out.push({ name: r._id, count: r.count }));
  res.json(out.filter((c) => c.count > 0));
});

export const getBrands = asyncHandler(async (req, res) => {
  const match = { ...visible, brand: { $ne: '' } };
  if (req.query.category) match.category = String(req.query.category);
  const rows = await Product.aggregate([{ $match: match }, { $group: { _id: '$brand', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  res.json(rows.map((r) => ({ name: r._id, count: r.count })));
});

// GET /api/products/by-ids?ids=a,b,c  — used for "recently viewed"
export const getByIds = asyncHandler(async (req, res) => {
  const ids = String(req.query.ids || '').split(',').filter((id) => mongoose.isValidObjectId(id)).slice(0, 12);
  if (!ids.length) return res.json([]);
  const found = await Product.find({ _id: { $in: ids }, ...visible }).select('-reviews');
  const byId = new Map(found.map((p) => [p._id.toString(), p]));
  res.json(ids.map((id) => byId.get(id)).filter(Boolean));
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  // drafts are only visible to admins (the admin product form loads them through this endpoint)
  if (product.isActive === false && !req.user?.isAdmin) throw new HttpError(404, 'Product not found');
  const related = await Product.find({ category: product.category, _id: { $ne: product._id }, ...visible })
    .select('-reviews')
    .sort({ sold: -1 })
    .limit(4);
  res.json({ product, related });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(pick(req.body));
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  Object.entries(pick(req.body)).forEach(([k, v]) => (product[k] = v));
  await product.save();
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ message: 'Product deleted' });
});

export const duplicateProduct = asyncHandler(async (req, res) => {
  const src = await Product.findById(req.params.id).lean();
  if (!src) throw new HttpError(404, 'Product not found');
  const copy = await Product.create({
    ...pick(src),
    name: `${src.name} (copy)`,
    sku: '',
    variants: (src.variants || []).map(({ _id, ...v }) => v),
    isActive: false,
    featured: false,
  });
  res.status(201).json(copy);
});

// ----- admin -----
// GET /api/admin/products?q=&category=&stock=low|out|in&status=active|draft&sort=&page=&limit=
export const adminList = asyncHandler(async (req, res) => {
  const { q, category, stock, status, sort = 'newest' } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 12, 100);
  const filter = {};
  if (q && String(q).trim()) {
    const rx = new RegExp(escapeRx(String(q).trim()), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { sku: rx }, { category: rx }];
  }
  if (category) filter.category = String(category);
  if (stock === 'out') filter.countInStock = 0;
  if (stock === 'low') filter.countInStock = { $gt: 0, $lte: 5 };
  if (stock === 'in') filter.countInStock = { $gt: 5 };
  if (status === 'draft') filter.isActive = false;
  if (status === 'active') filter.isActive = { $ne: false };

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).select('-reviews').sort(SORTS[sort] || SORTS.newest).skip((page - 1) * limit).limit(limit),
  ]);
  res.json({ products, page, pages: Math.ceil(total / limit), total });
});

// POST /api/admin/products/bulk  { ids, action }
export const bulk = asyncHandler(async (req, res) => {
  const { ids, action } = req.body;
  if (!Array.isArray(ids) || !ids.length) throw new HttpError(400, 'Select at least one product');
  const filter = { _id: { $in: ids.filter((id) => mongoose.isValidObjectId(id)) } };
  const actions = {
    delete: () => Product.deleteMany(filter),
    publish: () => Product.updateMany(filter, { isActive: true }),
    unpublish: () => Product.updateMany(filter, { isActive: false }),
    feature: () => Product.updateMany(filter, { featured: true }),
    unfeature: () => Product.updateMany(filter, { featured: false }),
  };
  if (!actions[action]) throw new HttpError(400, 'Unknown bulk action');
  await actions[action]();
  res.json({ message: 'Done', count: ids.length });
});

export const exportProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().select('-reviews').sort({ name: 1 }).lean();
  sendCsv(
    res,
    'products.csv',
    toCsv(products, [
      { label: 'Name', value: (p) => p.name },
      { label: 'SKU', value: (p) => p.sku },
      { label: 'Category', value: (p) => p.category },
      { label: 'Brand', value: (p) => p.brand },
      { label: 'Price', value: (p) => p.price },
      { label: 'Compare price', value: (p) => p.comparePrice },
      { label: 'Stock', value: (p) => p.countInStock },
      { label: 'Options', value: (p) => (p.variants || []).map((v) => `${v.label}:${v.countInStock}`).join(' | ') },
      { label: 'Sold', value: (p) => p.sold },
      { label: 'Rating', value: (p) => p.rating },
      { label: 'Published', value: (p) => (p.isActive === false ? 'no' : 'yes') },
    ])
  );
});

// ----- reviews -----
const recalc = (product) => {
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.length ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length : 0;
};

export const createReview = asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating);
  const comment = (req.body.comment || '').trim();
  if (!rating || rating < 1 || rating > 5) throw new HttpError(400, 'Choose a rating from 1 to 5');
  if (!comment) throw new HttpError(400, 'Write a short comment');

  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  if (product.reviews.some((r) => r.user.toString() === req.user._id.toString()))
    throw new HttpError(400, 'You have already reviewed this product');

  const verified = Boolean(await Order.exists({ user: req.user._id, 'items.product': product._id, status: { $ne: 'Cancelled' } }));
  product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment, verified });
  recalc(product);
  await product.save();
  res.status(201).json({ message: 'Review added' });
});

// GET /api/admin/reviews?page=
export const adminReviews = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 15;
  const base = [{ $match: { 'reviews.0': { $exists: true } } }, { $unwind: '$reviews' }, { $sort: { 'reviews.createdAt': -1 } }];
  const [count, rows] = await Promise.all([
    Product.aggregate([...base, { $count: 'n' }]),
    Product.aggregate([...base, { $skip: (page - 1) * limit }, { $limit: limit }, { $project: { productName: '$name', image: { $arrayElemAt: ['$images', 0] }, review: '$reviews' } }]),
  ]);
  const total = count[0]?.n || 0;
  res.json({ reviews: rows.map((r) => ({ productId: r._id, productName: r.productName, image: r.image, ...r.review })), page, pages: Math.ceil(total / limit), total });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) throw new HttpError(404, 'Product not found');
  const review = product.reviews.id(req.params.reviewId);
  if (!review) throw new HttpError(404, 'Review not found');
  review.deleteOne();
  recalc(product);
  await product.save();
  res.json({ message: 'Review deleted' });
});
