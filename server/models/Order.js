import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        variant: { type: mongoose.Schema.Types.ObjectId },
        variantLabel: String,
        sku: String,
        name: String,
        image: String,
        price: Number,
        qty: { type: Number, required: true, min: 1 },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: String,
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    shippingMethod: { type: String, enum: ['standard', 'express'], default: 'standard' },
    paymentMethod: { type: String, enum: ['COD', 'Stripe'], default: 'COD' },
    itemsPrice: Number,
    shippingPrice: Number,
    taxPrice: Number,
    discount: { type: Number, default: 0 },
    couponCode: String,
    totalPrice: Number,
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    paymentResult: { id: String, status: String },
    status: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Processing' },
    statusHistory: [{ status: String, note: String, at: { type: Date, default: Date.now }, _id: false }],
    carrier: { type: String, default: '' },
    trackingNumber: { type: String, default: '' },
    customerNote: { type: String, default: '', maxlength: 500 },
    adminNote: { type: String, default: '', maxlength: 1000 },
    deliveredAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
