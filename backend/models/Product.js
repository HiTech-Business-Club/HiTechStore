const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: ['streaming', 'gaming', 'software', 'other'] },
  originalPrice: { type: Number, required: true },
  originalCurrency: { type: String, default: 'USD' },
  commissionRate: { type: Number, default: 15 },
  provider: { type: String, required: true },
  providerUrl: { type: String, default: '' },
  duration: { type: String, enum: ['1_month', '3_months', '6_months', '12_months', 'lifetime'], default: '1_month' },
  features: [{ type: String }],
  image: { type: String, default: '' },
  available: { type: Boolean, default: true },
  stock: { type: Number, default: -1 },
  isTrending: { type: Boolean, default: false },
  isPromo: { type: Boolean, default: false },
  promoOriginalPrice: { type: Number },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ category: 1, available: 1 });
productSchema.index({ name: 'text', description: 'text' });

productSchema.virtual('priceTND').get(function () {
  return this.originalPrice;
});

productSchema.virtual('finalPrice').get(function () {
  return this.originalPrice * (1 + this.commissionRate / 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
