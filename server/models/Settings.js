import mongoose from 'mongoose';

// One document holds every store-wide setting the admin can change.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    storeName: { type: String, default: 'Tidewater Supply', trim: true },
    tagline: { type: String, default: 'Gear for the long way round.' },
    metaDescription: { type: String, default: 'Durable gear for hiking, camping and travel.' },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    locale: { type: String, default: 'en-US' },
    taxRate: { type: Number, default: 8, min: 0, max: 100 }, // percent
    shippingFlat: { type: Number, default: 8, min: 0 },
    expressEnabled: { type: Boolean, default: true },
    expressShipping: { type: Number, default: 20, min: 0 },
    freeShippingOver: { type: Number, default: 100, min: 0 }, // 0 = standard shipping always free
    codEnabled: { type: Boolean, default: true },
    cardEnabled: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    returnDays: { type: Number, default: 30, min: 0 },
    announcement: {
      text: { type: String, default: 'Free shipping on orders over $100' },
      link: { type: String, default: '/shop' },
      active: { type: Boolean, default: true },
    },
    contact: {
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      hours: { type: String, default: 'Mon–Fri, 9:00–17:00' },
    },
    social: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      youtube: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
    },
    footerNote: { type: String, default: '' },
  },
  { timestamps: true, minimize: false }
);

export default mongoose.model('Settings', settingsSchema);
