const mongoose = require('mongoose');

const paymentAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  razorpayOrderId: { type: String, required: true, unique: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  }],
  amountPaise: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending', index: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

paymentAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PaymentAttempt', paymentAttemptSchema);
