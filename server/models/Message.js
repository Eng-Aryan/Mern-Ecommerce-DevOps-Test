import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 120 },
    email: { type: String, required: [true, 'Email is required'], lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'] },
    subject: { type: String, default: '', trim: true, maxlength: 200 },
    message: { type: String, required: [true, 'Message is required'], trim: true, maxlength: 4000 },
    status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
