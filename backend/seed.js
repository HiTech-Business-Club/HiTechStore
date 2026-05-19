const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');
const Product = require('./models/Product');
const ProviderAccount = require('./models/ProviderAccount');
const TrendingItem = require('./models/TrendingItem');
const { discoverTrending } = require('./services/autoDiscovery');

const seed = async () => {
  try {
    await mongoose.connect(config.mongo.uri);
    console.log('MongoDB connected');

    await User.deleteMany({});
    await Product.deleteMany({});
    await ProviderAccount.deleteMany({});
    await TrendingItem.deleteMany({});

    await User.create({ firstName: 'Admin', lastName: 'HiTech', email: 'admin@hitechstore.com', password: 'Admin123!', role: 'admin', verified: true });
    console.log('Admin: admin@hitechstore.com / Admin123!');

    await User.create({ firstName: 'Client', lastName: 'Test', email: 'client@test.com', password: 'Client123!', role: 'user', verified: true });
    console.log('Client: client@test.com / Client123!');

    const providers = [
      { provider: 'Netflix', displayName: 'Netflix', category: 'streaming', officialUrl: 'https://www.netflix.com', currency: 'USD', enabled: true, accountEmail: '', accountPassword: '', paymentMethod: 'credit_card', autoPurchase: true },
      { provider: 'Spotify', displayName: 'Spotify', category: 'streaming', officialUrl: 'https://www.spotify.com', currency: 'USD', enabled: true, accountEmail: '', accountPassword: '', paymentMethod: 'credit_card', autoPurchase: true },
      { provider: 'Microsoft', displayName: 'Microsoft', category: 'software', officialUrl: 'https://www.microsoft.com', currency: 'USD', enabled: true, accountEmail: '', accountPassword: '', paymentMethod: 'credit_card', autoPurchase: true },
      { provider: 'PlayStation', displayName: 'PlayStation', category: 'gaming', officialUrl: 'https://www.playstation.com', currency: 'USD', enabled: true, accountEmail: '', accountPassword: '', paymentMethod: 'credit_card', autoPurchase: true },
      { provider: 'Xbox', displayName: 'Xbox', category: 'gaming', officialUrl: 'https://www.xbox.com', currency: 'USD', enabled: true, accountEmail: '', accountPassword: '', paymentMethod: 'credit_card', autoPurchase: true },
      { provider: 'Steam', displayName: 'Steam', category: 'gaming', officialUrl: 'https://store.steampowered.com', currency: 'USD', enabled: true, accountEmail: '', accountPassword: '', paymentMethod: 'credit_card', autoPurchase: true },
      { provider: 'Disney', displayName: 'Disney+', category: 'streaming', officialUrl: 'https://www.disneyplus.com', currency: 'USD', enabled: true, accountEmail: '', accountPassword: '', paymentMethod: 'credit_card', autoPurchase: true },
      { provider: 'Adobe', displayName: 'Adobe', category: 'software', officialUrl: 'https://www.adobe.com', currency: 'USD', enabled: true, accountEmail: '', accountPassword: '', paymentMethod: 'credit_card', autoPurchase: true },
      { provider: 'YouTube', displayName: 'YouTube Premium', category: 'streaming', officialUrl: 'https://www.youtube.com/premium', currency: 'USD', enabled: true, accountEmail: '', accountPassword: '', paymentMethod: 'credit_card', autoPurchase: true },
      { provider: 'Nintendo', displayName: 'Nintendo', category: 'gaming', officialUrl: 'https://www.nintendo.com', currency: 'USD', enabled: true, accountEmail: '', accountPassword: '', paymentMethod: 'credit_card', autoPurchase: true },
      { provider: 'HBO', displayName: 'HBO Max', category: 'streaming', officialUrl: 'https://www.max.com', currency: 'USD', enabled: true, accountEmail: '', accountPassword: '', paymentMethod: 'credit_card', autoPurchase: true },
    ];
    await ProviderAccount.insertMany(providers);
    console.log(`${providers.length} provider accounts created`);

    await discoverTrending();
    console.log('Trending products discovered');

    console.log('Seed completed!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
