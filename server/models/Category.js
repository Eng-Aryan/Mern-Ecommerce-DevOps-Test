import mongoose from 'mongoose';

const slugify = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], unique: true, trim: true },
    slug: { type: String, index: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function (next) {
  if (this.name) this.slug = slugify(this.name);
  next();
});

export default mongoose.model('Category', categorySchema);
