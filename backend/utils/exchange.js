const axios = require('axios');
const config = require('../config');

let cache = { rates: {}, lastUpdate: 0 };

async function getRates() {
  if (Date.now() - cache.lastUpdate < 3600000 && cache.rates.USD) return cache.rates;
  try {
    const res = await axios.get(config.exchangeApi, { timeout: 10000 });
    cache.rates = res.data.rates;
    cache.lastUpdate = Date.now();
    return cache.rates;
  } catch (e) {
    console.warn('Exchange rate fetch failed, using cache:', e.message);
    return cache.rates.USD ? cache.rates : { USD: 1, EUR: 1.08, GBP: 1.27, TND: 3.1 };
  }
}

async function convertToTND(amount, fromCurrency = 'USD') {
  if (fromCurrency === 'TND') return amount;
  const rates = await getRates();
  const usdAmount = amount / (rates[fromCurrency] || 1);
  const tndRate = rates.TND || 3.1;
  return Math.round(usdAmount * tndRate * 100) / 100;
}

module.exports = { getRates, convertToTND };
