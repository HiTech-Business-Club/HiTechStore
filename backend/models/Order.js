const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  provider: String,
  originalPrice: Number,
  originalCurrency: String,
  priceTND: Number,
  commission: Number,
  finalPriceTND: Number,
  status: { type: String, enum: ['pending', 'processing', 'purchased', 'delivered', 'failed', 'refunded'], default: 'pending' },
  customerInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    providerEmail: String,
    providerPassword: String,
    notes: String,
  },
  purchaseDetails: {
    purchasedAt: Date,
    transactionId: String,
    confirmationCode: String,
    deliveryMethod: String,
    deliveryDetails: String,
    error: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
