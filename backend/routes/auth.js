const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const config = require('../config');

router.post('/register',
  [body('firstName').trim().notEmpty(), body('lastName').trim().notEmpty(), body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 6 })],
  validate,
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, address, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
    const user = await User.create({ firstName, lastName, email, phone, address, password });
    const token = jwt.sign({ id: user._id.toString(), role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expire });
    res.status(201).json({ success: true, token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } });
  })
);

router.post('/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    const token = jwt.sign({ id: user._id.toString(), role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expire });
    res.json({ success: true, token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } });
  })
);

router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
  res.json({ success: true, user });
}));

router.put('/profile', auth, asyncHandler(async (req, res) => {
  const updates = {};
  ['firstName', 'lastName', 'phone', 'address'].forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).lean();
  res.json({ success: true, user });
}));

module.exports = router;
