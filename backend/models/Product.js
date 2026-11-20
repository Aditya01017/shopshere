const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  price: { type: Number, required: true, min: 0, max: 1000000 },
  category: { type: String, required: true, trim: true, maxlength: 100 },
  stock: { type: Number, required: true, min: 0, max: 1000000, validate: Number.isInteger },
  imageUrl: { type: String, required: true, maxlength: 2048 },
  ratings: { type: Number, min: 0, max: 5, default: 0 },
  numReviews: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
