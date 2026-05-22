const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');
const cron = require('node-cron');
const config = require('./config');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const oauthRoutes = require('./routes/oauth');
const errorHandler = require('./middleware/errorHandler');
const { discoverTrending } = require('./services/autoDiscovery');

const app = express();

app.use(compression());
app.use(cors({ origin: config.frontend.url || '*' }));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.max, message: { success: false, message: 'Trop de requêtes' } });
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use('/static', express.static(path.join(__dirname, '../frontend/static')));

app.get('/api/health', async (_req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    success: true, 
    status: 'ok', 
    uptime: process.uptime(),
    mongodb: mongoStatus,
    timestamp: new Date().toISOString()
  });
});

app.get('/about', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/templates/pages/about.html')));
app.get('/demo', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/templates/pages/demo.html')));
app.get('/about.html', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/templates/pages/about.html')));
app.get('/demo.html', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/templates/pages/demo.html')));
app.get('/product/:id', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/templates/pages/product.html')));

app.use(errorHandler);

app.get('/admin*', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/templates/admin/dashboard.html')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/templates/pages/index.html')));

const startServer = async () => {
  try {
    await mongoose.connect(config.mongo.uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected');

    cron.schedule('0 6 * * *', async () => {
      console.log('[Cron] Running daily auto-discovery...');
      try { await discoverTrending(); } catch (e) { console.error('Auto-discovery failed:', e.message); }
    });

    const server = app.listen(config.port, () => console.log(`Server running on http://localhost:${config.port}`));

    process.on('SIGTERM', () => { console.log('SIGTERM received, closing...'); mongoose.connection.close(); server.close(() => process.exit(0)); });
    process.on('SIGINT', () => { console.log('SIGINT received, closing...'); mongoose.connection.close(); server.close(() => process.exit(0)); });
  } catch (err) {
    console.error('Server start failed:', err.message);
    process.exit(1);
  }
};

startServer();
module.exports = app;
