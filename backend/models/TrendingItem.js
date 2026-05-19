const mongoose = require('mongoose');

const trendingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  provider: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  originalPrice: { type: Number },
  originalCurrency: { type: String, default: 'USD' },
  promoPrice: { type: Number },
  url: { type: String },
  image: { type: String },
  features: [{ type: String }],
  isPromo: { type: Boolean, default: false },
  source: { type: String, default: 'auto-discovery' },
  imported: { type: Boolean, default: false },
  discoveredAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('TrendingItem', trendingSchema);
