const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { auth, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ProviderAccount = require('../models/ProviderAccount');
const TrendingItem = require('../models/TrendingItem');
const { discoverTrending } = require('../services/autoDiscovery');

router.use(auth, adminOnly);

// Dashboard stats
router.get('/stats', asyncHandler(async (req, res) => {
  const [totalUsers, totalProducts, totalOrders, revenue, recentOrders, lowStock, trendingCount, promoCount] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: 'delivered' } }, { $group: { _id: null, total: { $sum: '$finalPriceTND' } } }]),
    Order.find().populate('user', 'firstName lastName email').sort({ createdAt: -1 }).limit(10).lean(),
    Product.find({ stock: { $gt: 0, $lt: 5 } }).select('name stock').limit(10).lean(),
    Product.countDocuments({ isTrending: true }),
    Product.countDocuments({ isPromo: true }),
  ]);
  res.json({ success: true, data: { totalUsers, totalProducts, totalOrders, totalRevenue: revenue[0]?.total || 0, recentOrders, lowStock, trendingCount, promoCount } });
}));

// Users
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: users });
}));

router.put('/users/:id', [param('id').isMongoId()], validate, asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.role) updates.role = req.body.role;
  if (req.body.firstName) updates.firstName = req.body.firstName;
  if (req.body.lastName) updates.lastName = req.body.lastName;
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password').lean();
  if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
  res.json({ success: true, data: user });
}));

router.delete('/users/:id', [param('id').isMongoId()], validate, asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
  res.json({ success: true, message: 'Utilisateur supprimé' });
}));

// Orders
router.get('/orders', asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'firstName lastName email').populate('product', 'name').sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, data: { orders, pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalItems: total } } });
}));

router.put('/orders/:id/status', [param('id').isMongoId(), body('status').isIn(['pending', 'processing', 'purchased', 'delivered', 'failed', 'refunded'])], validate,
  asyncHandler(async (req, res) => {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('user', 'firstName lastName email').lean();
    if (!order) return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    res.json({ success: true, data: order });
  })
);

// Provider accounts
router.get('/providers', asyncHandler(async (req, res) => {
  const providers = await ProviderAccount.find().sort({ provider: 1 }).lean();
  res.json({ success: true, data: providers });
}));

router.post('/providers',
  [body('provider').notEmpty(), body('displayName').notEmpty(), body('officialUrl').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const provider = await ProviderAccount.create(req.body);
    res.status(201).json({ success: true, data: provider });
  })
);

router.put('/providers/:id', [param('id').isMongoId()], validate, asyncHandler(async (req, res) => {
  const provider = await ProviderAccount.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!provider) return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });
  res.json({ success: true, data: provider });
}));

router.delete('/providers/:id', [param('id').isMongoId()], validate, asyncHandler(async (req, res) => {
  const provider = await ProviderAccount.findByIdAndDelete(req.params.id);
  if (!provider) return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });
  res.json({ success: true, message: 'Fournisseur supprimé' });
}));

// Trending / Auto-discovery
router.get('/trending', asyncHandler(async (req, res) => {
  const items = await TrendingItem.find().sort({ isPromo: -1, discoveredAt: -1 }).lean();
  res.json({ success: true, data: items });
}));

router.post('/trending/discover', asyncHandler(async (req, res) => {
  await discoverTrending();
  const items = await TrendingItem.find().sort({ isPromo: -1 }).lean();
  res.json({ success: true, data: items, message: 'Découverte terminée' });
}));

router.post('/trending/import/:id', [param('id').isMongoId()], validate, asyncHandler(async (req, res) => {
  const item = await TrendingItem.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Item non trouvé' });
  const exists = await Product.findOne({ name: item.title });
  if (exists) return res.status(400).json({ success: false, message: 'Produit déjà existant' });
  await Product.create({
    name: item.title, description: item.description, category: item.category,
    originalPrice: item.originalPrice, originalCurrency: item.originalCurrency,
    provider: item.provider, providerUrl: item.url, features: item.features,
    isTrending: true, isPromo: item.isPromo, available: true,
  });
  item.imported = true;
  await item.save();
  res.json({ success: true, message: 'Produit importé' });
}));

// Settings (read-only, configured via environment)
router.get('/settings', asyncHandler(async (req, res) => {
  res.json({ success: true, data: { commissionRate: config.commission?.rate || 15, currency: 'TND' } });
}));

module.exports = router;
