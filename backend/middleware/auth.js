const jwt = require('jsonwebtoken');
const config = require('../config');

exports.auth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Token manquant' });
  try {
    req.user = jwt.verify(h.split(' ')[1], config.jwt.secret);
    next();
  } catch { res.status(401).json({ success: false, message: 'Token invalide' }); }
};

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Accès admin requis' });
  next();
};
