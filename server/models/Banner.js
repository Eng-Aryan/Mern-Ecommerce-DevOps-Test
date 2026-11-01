import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Banner title is required'], trim: true },
    subtitle: { type: String, default: '' },
    image: { type: String, default: '' },
    link: { type: String, default: '/shop' },
    cta: { type: String, default: 'Shop now' },
    position: { type: String, enum: ['hero', 'promo'], default: 'hero' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Banner', bannerSchema);
