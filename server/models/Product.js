import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    verified: { type: Boolean, default: false }, // bought this product
  },
  { timestamps: true }
);

// A variant is one purchasable option (e.g. "M / Blue") with its own stock.
const variantSchema = new mongoose.Schema({
  label: { type: String, required: [true, 'Each option needs a label'], trim: true },
  sku: { type: String, default: '', trim: true },
  price: { type: Number, min: 0, default: 0 }, // 0 = use the product price
  countInStock: { type: Number, required: true, min: 0, default: 0 },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    brand: { type: String, default: '', trim: true },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    sku: { type: String, default: '', trim: true },
    tags: [{ type: String, trim: true }],
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    comparePrice: { type: Number, min: 0, default: 0 }, // original price, shown struck through
    images: [String],
    countInStock: { type: Number, required: true, min: 0, default: 0 },
    optionName: { type: String, default: 'Option', trim: true }, // "Size", "Colour"…
    variants: [variantSchema],
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }, // false = draft, hidden from the store
    sold: { type: Number, default: 0 },
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// With variants, the product's stock is always the sum of its options.
productSchema.pre('validate', function (next) {
  if (this.variants?.length) this.countInStock = this.variants.reduce((s, v) => s + (v.countInStock || 0), 0);
  next();
});

productSchema.index({ name: 1 });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ sold: -1 });

export default mongoose.model('Product', productSchema);
