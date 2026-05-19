const express = require('express');
const router = express.Router();
const { query, param, body } = require('express-validator');
const { auth, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const Product = require('../models/Product');

router.get('/', asyncHandler(async (req, res) => {
  const { category, sort, search, trending, promo, page, limit } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const filter = { available: true };
  if (category) filter.category = category;
  if (trending === 'true') filter.isTrending = true;
  if (promo === 'true') filter.isPromo = true;
  if (search) filter.$text = { $search: search };
  let sortOpt = { sortOrder: 1, createdAt: -1 };
  if (sort === 'price_asc') sortOpt = { originalPrice: 1 };
  if (sort === 'price_desc') sortOpt = { originalPrice: -1 };
  const [products, total] = await Promise.all([Product.find(filter).sort(sortOpt).skip((pageNum - 1) * limitNum).limit(limitNum).lean(), Product.countDocuments(filter)]);
  res.json({ success: true, data: { products, pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalItems: total } } });
}));

router.get('/:id', [param('id').isMongoId()], validate, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) return res.status(404).json({ success: false, message: 'Produit non trouvé' });
  res.json({ success: true, data: product });
}));

router.post('/', auth, adminOnly, [body('name').trim().notEmpty(), body('description').trim().notEmpty(), body('category').isIn(['streaming', 'gaming', 'software', 'other']), body('originalPrice').isFloat({ min: 0 }), body('provider').notEmpty()], validate,
  asyncHandler(async (req, res) => {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  })
);

router.put('/:id', auth, adminOnly, [param('id').isMongoId()], validate, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: 'Produit non trouvé' });
  res.json({ success: true, data: product });
}));

router.delete('/:id', auth, adminOnly, [param('id').isMongoId()], validate, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Produit non trouvé' });
  res.json({ success: true, message: 'Produit supprimé' });
}));

module.exports = router;
