const { validationResult } = require('express-validator');
module.exports = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ success: false, message: 'Données invalides', errors: errs.array().map(e => e.msg) });
  next();
};
