module.exports = (err, req, res, _next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Erreur serveur' });
};
