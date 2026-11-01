import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema(
  { email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'] } },
  { timestamps: true }
);

export default mongoose.model('Subscriber', subscriberSchema);
