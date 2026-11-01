import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Coupon from './models/Coupon.js';
import Category from './models/Category.js';
import Banner from './models/Banner.js';
import Settings from './models/Settings.js';
import Message from './models/Message.js';
import Subscriber from './models/Subscriber.js';

// npm run seed        → catalogue, categories, banners, settings, 2 accounts, 2 coupons (no orders)
// npm run seed:demo   → the above + customers, ~60 orders over 30 days, reviews, subscribers, messages
const DEMO = process.argv.includes('--demo');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const img = (seed, w = 800, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

// [name, category, brand, price, comparePrice, description, stock, featured, sold, tags]
const SIZES = { optionName: 'Size', labels: ['S', 'M', 'L', 'XL'] };
const products = [
  ['Ridgeline 40L Pack', 'Packs & Bags', 'Ridgeline', 149, 179, 'A 40-litre carry-on-friendly pack with a suspended back panel, hip belt pockets and a laptop sleeve. Recycled 420D ripstop shell with a PFC-free water-repellent finish.', 24, true, 212, ['backpack', 'travel']],
  ['Daybreak 22L Daypack', 'Packs & Bags', 'Ridgeline', 79, 0, 'Light, simple and comfortable for all-day hikes. Two bottle pockets, a stash pocket and a removable sit pad.', 40, true, 340, ['backpack', 'day hike']],
  ['Harbor Duffel 60L', 'Packs & Bags', 'Tidewater', 119, 139, 'Weatherproof roll-top duffel with welded seams. Carries like a backpack, packs flat when empty.', 15, false, 96, ['duffel', 'travel']],
  ['Trailhead Shell Jacket', 'Apparel', 'Northfold', 189, 0, '3-layer waterproof-breathable shell with pit zips, a stowable hood and taped seams. Built for sustained rain.', 18, true, 158, ['rain', 'jacket'], { ...SIZES, stock: [4, 6, 5, 3] }],
  ['Merino Base Layer Crew', 'Apparel', 'Northfold', 74, 89, '165gsm merino-blend crew that stays fresh for days. Flatlock seams, no itch, no chafe.', 52, false, 301, ['merino', 'base layer'], { ...SIZES, stock: [12, 16, 14, 10] }],
  ['Field Fleece Pullover', 'Apparel', 'Tidewater', 98, 0, 'Recycled-polyester grid fleece. Warm for its weight and quick to dry.', 33, false, 187, ['fleece', 'warm'], { ...SIZES, stock: [8, 11, 9, 5] }],
  ['Summit Trail Pants', 'Apparel', 'Northfold', 108, 0, 'Four-way stretch, DWR-coated and cut to move. Zippered thigh pockets and articulated knees.', 27, false, 143, ['pants', 'hiking'], { ...SIZES, stock: [6, 9, 8, 4] }],
  ['Basecamp Stove Kit', 'Camp & Cook', 'Emberline', 129, 149, 'Stove, 1.8L pot, windscreen and bowl in one nesting kit. Boils a litre in about three minutes.', 20, true, 174, ['stove', 'cooking']],
  ['Cast Iron Camp Skillet', 'Camp & Cook', 'Emberline', 59, 0, 'Pre-seasoned 10-inch skillet with a folding handle for fire or stove.', 35, false, 88, ['skillet', 'cooking']],
  ['Insulated Steel Bottle 1L', 'Camp & Cook', 'Tidewater', 36, 0, 'Keeps drinks cold for 24 hours or hot for 12. Powder-coated, dent-resistant, fits most cup holders.', 120, false, 512, ['bottle', 'insulated']],
  ['Lantern Light 600', 'Camp & Cook', 'Emberline', 44, 0, 'Rechargeable USB-C lantern with three brightness modes and a warm-white setting.', 3, false, 129, ['light', 'camp']],
  ['Switchback Hiking Boots', 'Footwear', 'Northfold', 169, 199, 'Full-grain leather and a grippy lug outsole. Waterproof lining, supportive and broken in within a week.', 22, true, 201, ['boots', 'waterproof'], { optionName: 'Size', labels: ['41', '42', '43', '44', '45'], stock: [3, 5, 6, 5, 3] }],
  ['Tidepool Water Shoes', 'Footwear', 'Tidewater', 64, 0, 'Quick-drain mesh upper with a sticky rubber sole for slick rocks and river crossings.', 41, false, 118, ['water', 'shoes'], { optionName: 'Size', labels: ['40', '41', '42', '43', '44', '45'], stock: [6, 8, 9, 8, 6, 4] }],
  ['Wool Trail Socks (3-pack)', 'Accessories', 'Northfold', 32, 0, 'Cushioned merino-blend socks with a seamless toe and arch support.', 150, false, 466, ['socks', 'merino']],
  ['Headlamp 400', 'Accessories', 'Emberline', 39, 49, 'Lightweight, 400 lumens, red night mode and a lock function for the pack.', 60, false, 255, ['light', 'headlamp']],
  ['Trekking Poles (pair)', 'Accessories', 'Ridgeline', 89, 0, 'Carbon-fibre, collapsible to 38 cm with cork grips and quick-lock adjustment.', 0, false, 167, ['poles', 'hiking']],
].map(([name, category, brand, price, comparePrice, description, countInStock, featured, sold, tags, v], idx) => {
  const key = slug(name);
  const sku = `TWS-${String(idx + 1).padStart(3, '0')}`;
  return {
    name, category, brand, price, comparePrice, description, countInStock, featured, sold, tags, sku,
    images: [img(key), img(`${key}-2`), img(`${key}-3`)],
    ...(v ? { optionName: v.optionName, variants: v.labels.map((label, i) => ({ label, sku: `${sku}-${label}`, countInStock: v.stock[i] })) } : {}),
  };
});

const categories = [
  ['Packs & Bags', 'Daypacks, travel packs and duffels', 0],
  ['Apparel', 'Shells, layers and trail pants', 1],
  ['Camp & Cook', 'Stoves, cookware and camp light', 2],
  ['Footwear', 'Boots and water shoes', 3],
  ['Accessories', 'Socks, poles and headlamps', 4],
].map(([name, description, order]) => ({ name, description, order, image: img(`cat-${slug(name)}`, 600, 400) }));

const banners = [
  { title: 'Gear for the long way round', subtitle: 'Packs, shells, stoves and boots tested on wet ridgelines and long trains.', cta: 'Shop all gear', link: '/shop', position: 'hero', order: 0, image: img('hero-ridge', 1400, 800) },
  { title: 'Autumn layers are here', subtitle: 'Merino, fleece and shells to keep you warm when the weather turns.', cta: 'Shop apparel', link: '/shop?category=Apparel', position: 'hero', order: 1, image: img('hero-layers', 1400, 800) },
  { title: 'Cook anywhere', subtitle: 'The Basecamp Stove Kit boils a litre in about three minutes.', cta: 'See camp & cook', link: '/shop?category=Camp%20%26%20Cook', position: 'hero', order: 2, image: img('hero-camp', 1400, 800) },
  { title: 'Save on boots', subtitle: 'Up to 15% off selected footwear.', cta: 'View deals', link: '/shop?onSale=true', position: 'promo', order: 0, image: img('promo-boots', 900, 500) },
  { title: 'New: Lantern Light 600', subtitle: 'Rechargeable USB-C, three brightness modes.', cta: 'Take a look', link: '/shop?keyword=lantern', position: 'promo', order: 1, image: img('promo-lantern', 900, 500) },
];

// small deterministic random generator so demo data is the same on every run
const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

const seedDemo = async (allProducts, customers) => {
  const rand = rng(42);
  const pickOne = (arr) => arr[Math.floor(rand() * arr.length)];
  const cities = [['Erbil', 'Iraq', '44001'], ['Sulaymaniyah', 'Iraq', '46001'], ['Berlin', 'Germany', '10115'], ['Leeds', 'United Kingdom', 'LS1 4AP'], ['Austin', 'United States', '73301']];
  const orders = [];
  for (let i = 0; i < 60; i++) {
    const user = pickOne(customers);
    const daysAgo = Math.floor(rand() * 30);
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - Math.floor(rand() * 40000000));
    const lines = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => pickOne(allProducts));
    const items = [...new Map(lines.map((p) => [String(p._id), p])).values()].map((p) => {
      const v = p.variants?.length ? pickOne(p.variants) : null;
      return { product: p._id, variant: v?._id, variantLabel: v?.label, sku: v?.sku || p.sku, name: p.name, image: p.images[0], price: p.price, qty: 1 + Math.floor(rand() * 2) };
    });
    const itemsPrice = items.reduce((s, it) => s + it.price * it.qty, 0);
    const shippingPrice = itemsPrice >= 100 ? 0 : 8;
    const taxPrice = Math.round(itemsPrice * 0.08 * 100) / 100;
    const [city, country, postalCode] = pickOne(cities);
    const status = daysAgo > 12 ? pickOne(['Delivered', 'Delivered', 'Delivered', 'Cancelled']) : daysAgo > 4 ? pickOne(['Shipped', 'Delivered', 'Processing']) : 'Processing';
    const card = rand() > 0.55;
    const paid = status === 'Delivered' || (card && status !== 'Cancelled');
    const history = [{ status: 'Processing', note: 'Order placed', at: createdAt }];
    if (['Shipped', 'Delivered'].includes(status)) history.push({ status: 'Shipped', note: '', at: new Date(createdAt.getTime() + 86400000) });
    if (status === 'Delivered') history.push({ status: 'Delivered', note: '', at: new Date(createdAt.getTime() + 3 * 86400000) });
    if (status === 'Cancelled') history.push({ status: 'Cancelled', note: 'Cancelled by customer', at: new Date(createdAt.getTime() + 3600000) });
    orders.push({
      user: user._id, items, shippingMethod: 'standard', paymentMethod: card ? 'Stripe' : 'COD',
      shippingAddress: { fullName: user.name, phone: '0750 000 0000', address: `${10 + i} Main Street`, city, postalCode, country },
      itemsPrice, shippingPrice, taxPrice, totalPrice: Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100,
      isPaid: paid, paidAt: paid ? createdAt : undefined, status, statusHistory: history,
      carrier: status === 'Shipped' || status === 'Delivered' ? 'DHL' : '', trackingNumber: status === 'Shipped' || status === 'Delivered' ? `DH${100000 + i * 37}` : '',
      deliveredAt: status === 'Delivered' ? history[history.length - 1].at : undefined, createdAt, updatedAt: createdAt,
    });
  }
  await Order.collection.insertMany(orders.map((o) => ({ ...o, _id: new mongoose.Types.ObjectId() })));

  // reviews
  const comments = ['Exactly as described and well made.', 'Great value, would buy again.', 'Held up in heavy rain on a three-day trek.', 'Comfortable from day one.', 'A little pricey but the quality shows.', 'Shipping was quick and packaging was tidy.'];
  for (const p of allProducts.slice(0, 10)) {
    const reviews = customers.slice(0, 2 + Math.floor(rand() * 3)).map((u) => ({ user: u._id, name: u.name, rating: 3 + Math.floor(rand() * 3), comment: pickOne(comments), verified: true }));
    p.reviews = reviews;
    p.numReviews = reviews.length;
    p.rating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await p.save();
  }

  await Subscriber.insertMany(['mia@example.com', 'omar@example.com', 'lena@example.com', 'sam@example.com'].map((email) => ({ email })));
  await Message.create([
    { name: 'Mia Carter', email: 'mia@example.com', subject: 'Boot sizing', message: 'Do the Switchback boots run true to size? I am between a 42 and a 43.' },
    { name: 'Omar Ali', email: 'omar@example.com', subject: 'Bulk order', message: 'We are a hiking club of 20 people and would like to ask about a group discount.', status: 'read' },
  ]);
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([Order.deleteMany(), Product.deleteMany(), User.deleteMany(), Coupon.deleteMany(), Category.deleteMany(), Banner.deleteMany(), Settings.deleteMany(), Message.deleteMany(), Subscriber.deleteMany()]);
  console.log('Cleared existing data');
  if (process.argv.includes('--destroy')) return done();

  await User.create([
    { name: 'Store Admin', email: 'admin@tidewater.test', password: 'Admin123!', isAdmin: true },
    { name: 'Demo Shopper', email: 'shopper@tidewater.test', password: 'Shopper123!' },
  ]);
  const saved = await Product.insertMany(products);
  await Category.insertMany(categories);
  await Banner.insertMany(banners);
  await Settings.create({
    key: 'main',
    contact: { email: 'hello@tidewater.test', phone: '+1 555 010 2030', address: '12 Harbour Road, Portside', hours: 'Mon–Fri, 9:00–17:00' },
    social: { instagram: 'https://instagram.com/', facebook: 'https://facebook.com/', youtube: 'https://youtube.com/' },
  });
  await Coupon.create([
    { code: 'WELCOME10', type: 'percent', value: 10 },
    { code: 'TAKE20', type: 'fixed', value: 20, minOrder: 120 },
  ]);

  if (DEMO) {
    const customers = await User.create(
      ['Mia Carter', 'Omar Ali', 'Lena Weber', 'Sam Brooks', 'Aiko Tanaka', 'Noor Hassan', 'Jonas Berg', 'Priya Nair'].map((name, i) => ({
        name, email: `${name.split(' ')[0].toLowerCase()}@example.com`, password: 'Customer123!', createdAt: new Date(Date.now() - (i * 3 + 1) * 86400000),
      }))
    );
    await seedDemo(saved, customers);
    console.log('Demo data added: 8 customers (password Customer123!), 60 orders, reviews, subscribers, messages');
  }

  console.log(`Seeded ${products.length} products, ${categories.length} categories, ${banners.length} banners, 2 users, 2 coupons`);
  console.log('Admin   → admin@tidewater.test / Admin123!');
  console.log('Shopper → shopper@tidewater.test / Shopper123!');
  console.log('Coupons → WELCOME10 (10% off), TAKE20 (20 off orders of 120+)');
  done();
};

const done = async () => {
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
