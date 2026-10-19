import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    brand: { type: String, default: '', trim: true },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    comparePrice: { type: Number, min: 0, default: 0 }, // original price, shown struck through
    images: [String],
    countInStock: { type: Number, required: true, min: 0, default: 0 },
    featured: { type: Boolean, default: false },
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 1 });
productSchema.index({ category: 1, price: 1 });

export default mongoose.model('Product', productSchema);
