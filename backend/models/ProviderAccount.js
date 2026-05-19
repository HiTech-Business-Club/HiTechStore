const mongoose = require('mongoose');

const providerAccountSchema = new mongoose.Schema({
  provider: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  category: { type: String, required: true },
  officialUrl: { type: String, required: true },
  currency: { type: String, default: 'USD' },
  enabled: { type: Boolean, default: true },
  accountEmail: { type: String, default: '' },
  accountPassword: { type: String, default: '' },
  paymentMethod: { type: String, enum: ['credit_card', 'paypal', 'gift_card', 'manual'], default: 'credit_card' },
  cardNumber: { type: String, default: '' },
  cardExpiry: { type: String, default: '' },
  cardCvv: { type: String, default: '' },
  cardHolder: { type: String, default: '' },
  paypalEmail: { type: String, default: '' },
  notes: { type: String, default: '' },
  autoPurchase: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ProviderAccount', providerAccountSchema);
