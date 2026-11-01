import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressFields = {
  fullName: String,
  phone: String,
  address: String,
  city: String,
  postalCode: String,
  country: String,
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    phone: { type: String, default: '', trim: true },
    password: { type: String, required: true, minlength: [6, 'Password must be at least 6 characters'], select: false },
    isAdmin: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    shippingAddress: addressFields, // mirrors the default saved address
    addresses: [{ label: { type: String, default: 'Home' }, isDefault: { type: Boolean, default: false }, ...addressFields }],
    resetToken: { type: String, select: false },
    resetExpires: { type: Date, select: false },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);
