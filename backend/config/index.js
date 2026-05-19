const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongo: { uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hitechstore_v4' },
  jwt: { secret: process.env.JWT_SECRET || 'dev-secret', expire: process.env.JWT_EXPIRE || '72h' },
  email: { host: process.env.EMAIL_HOST, port: parseInt(process.env.EMAIL_PORT, 10) || 587, secure: false, user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  frontend: { url: process.env.FRONTEND_URL || 'http://localhost:3000' },
  commission: { rate: parseFloat(process.env.COMMISSION_RATE) || 15 },
  rateLimit: { windowMs: 15 * 60 * 1000, max: 200 },
  exchangeApi: process.env.EXCHANGE_API || 'https://api.exchangerate-api.com/v4/latest/USD',
};
