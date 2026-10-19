import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Coupon from './models/Coupon.js';

const img = (seed) => `https://picsum.photos/seed/${seed}/800/800`;

const products = [
  ['Ridgeline 40L Pack', 'Packs & Bags', 'Ridgeline', 149, 179, 'A 40-litre carry-on-friendly pack with a suspended back panel, hip belt pockets and a laptop sleeve. Recycled 420D ripstop shell with a PFC-free water-repellent finish.', 24, true],
  ['Daybreak 22L Daypack', 'Packs & Bags', 'Ridgeline', 79, 0, 'Light, simple and comfortable for all-day hikes. Two bottle pockets, a stash pocket and a removable sit pad.', 40, true],
  ['Harbor Duffel 60L', 'Packs & Bags', 'Tidewater', 119, 139, 'Weatherproof roll-top duffel with welded seams. Carries like a backpack, packs flat when empty.', 15, false],
  ['Trailhead Shell Jacket', 'Apparel', 'Northfold', 189, 0, '3-layer waterproof-breathable shell with pit zips, a stowable hood and taped seams. Built for sustained rain.', 18, true],
  ['Merino Base Layer Crew', 'Apparel', 'Northfold', 74, 89, '165gsm merino-blend crew that stays fresh for days. Flatlock seams, no itch, no chafe.', 52, false],
  ['Field Fleece Pullover', 'Apparel', 'Tidewater', 98, 0, 'Recycled-polyester grid fleece. Warm for its weight and quick to dry.', 33, false],
  ['Summit Trail Pants', 'Apparel', 'Northfold', 108, 0, 'Four-way stretch, DWR-coated and cut to move. Zippered thigh pockets and articulated knees.', 27, false],
  ['Basecamp Stove Kit', 'Camp & Cook', 'Emberline', 129, 149, 'Stove, 1.8L pot, windscreen and bowl in one nesting kit. Boils a litre in about three minutes.', 20, true],
  ['Cast Iron Camp Skillet', 'Camp & Cook', 'Emberline', 59, 0, 'Pre-seasoned 10-inch skillet with a folding handle for fire or stove.', 35, false],
  ['Insulated Steel Bottle 1L', 'Camp & Cook', 'Tidewater', 36, 0, 'Keeps drinks cold for 24 hours or hot for 12. Powder-coated, dent-resistant, fits most cup holders.', 120, false],
  ['Lantern Light 600', 'Camp & Cook', 'Emberline', 44, 0, 'Rechargeable USB-C lantern with three brightness modes and a warm-white setting.', 3, false],
  ['Switchback Hiking Boots', 'Footwear', 'Northfold', 169, 199, 'Full-grain leather and a grippy lug outsole. Waterproof lining, supportive and broken in within a week.', 22, true],
  ['Tidepool Water Shoes', 'Footwear', 'Tidewater', 64, 0, 'Quick-drain mesh upper with a sticky rubber sole for slick rocks and river crossings.', 41, false],
  ['Wool Trail Socks (3-pack)', 'Accessories', 'Northfold', 32, 0, 'Cushioned merino-blend socks with a seamless toe and arch support.', 150, false],
  ['Headlamp 400', 'Accessories', 'Emberline', 39, 49, 'Lightweight, 400 lumens, red night mode and a lock function for the pack.', 60, false],
  ['Trekking Poles (pair)', 'Accessories', 'Ridgeline', 89, 0, 'Carbon-fibre, collapsible to 38 cm with cork grips and quick-lock adjustment.', 0, false],
].map(([name, category, brand, price, comparePrice, description, countInStock, featured]) => ({
  name, category, brand, price, comparePrice, description, countInStock, featured,
  images: [img(name.toLowerCase().replace(/[^a-z0-9]+/g, '-')), img(name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-2')],
}));

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([Order.deleteMany(), Product.deleteMany(), User.deleteMany(), Coupon.deleteMany()]);
  console.log('Cleared existing data');
  if (process.argv.includes('--destroy')) return done();

  await User.create([
    { name: 'Store Admin', email: 'admin@tidewater.test', password: 'Admin123!', isAdmin: true },
    { name: 'Demo Shopper', email: 'shopper@tidewater.test', password: 'Shopper123!' },
  ]);
  await Product.insertMany(products);
  await Coupon.create([
    { code: 'WELCOME10', type: 'percent', value: 10 },
    { code: 'TAKE20', type: 'fixed', value: 20, minOrder: 120 },
  ]);

  console.log(`Seeded ${products.length} products, 2 users, 2 coupons`);
  console.log('Admin   → admin@tidewater.test / Admin123!');
  console.log('Shopper → shopper@tidewater.test / Shopper123!');
  console.log('Coupons → WELCOME10 (10% off), TAKE20 ($20 off $120+)');
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
