const TrendingItem = require('../models/TrendingItem');
const Product = require('../models/Product');
const { convertToTND } = require('../utils/exchange');

const TRENDING_DEALS = [
  { title: 'Netflix Premium 4K', provider: 'Netflix', category: 'streaming', description: '4K Ultra HD, 4 écrans', originalPrice: 22.99, currency: 'USD', features: ['4K HDR', '4 écrans simultanés', 'Téléchargements hors ligne', 'Audio spatial'], image: 'https://img.icons8.com/color/96/netflix.png', isPromo: false },
  { title: 'Spotify Family', provider: 'Spotify', category: 'streaming', description: '6 comptes Premium famille', originalPrice: 16.99, currency: 'USD', features: ['6 comptes Premium', 'Sans publicité', 'Téléchargements hors ligne', 'Qualité audio supérieure'], image: 'https://img.icons8.com/fluency/96/spotify.png', isPromo: false },
  { title: 'Disney+ Bundle', provider: 'Disney', category: 'streaming', description: 'Disney+ Hulu ESPN+', originalPrice: 14.99, currency: 'USD', features: ['Disney, Marvel, Star Wars', 'Hulu inclus', 'ESPN+ sports', '4K UHD'], image: 'https://img.icons8.com/fluency/96/disney-plus.png', isPromo: true, promoPrice: 9.99 },
  { title: 'Xbox Game Pass Ultimate', provider: 'Xbox', category: 'gaming', description: 'Game Pass + Gold + EA Play', originalPrice: 16.99, currency: 'USD', features: ['Centaines de jeux', 'Xbox Live Gold inclus', 'EA Play inclus', 'Cloud Gaming'], image: 'https://img.icons8.com/fluency/96/xbox.png', isPromo: false },
  { title: 'PS Plus Premium', provider: 'PlayStation', category: 'gaming', description: 'Cloud Gaming + Classiques', originalPrice: 17.99, currency: 'USD', features: ['Cloud Gaming streaming', 'Classiques PS1-PS3', 'Jeux mensuels', 'Essais de jeu'], image: 'https://img.icons8.com/fluency/96/ps.png', isPromo: false },
  { title: 'Steam Deck Verified Games', provider: 'Steam', category: 'gaming', description: 'Pack jeux Steam Deck', originalPrice: 49.99, currency: 'USD', features: ['Compatible Steam Deck', 'Jeux AAA optimisés', 'Indés sélectionnés', 'Accès anticipé'], image: 'https://img.icons8.com/fluency/96/steam.png', isPromo: true, promoPrice: 29.99 },
  { title: 'Microsoft 365 Family', provider: 'Microsoft', category: 'software', description: 'Office + 1TB OneDrive 6 pers.', originalPrice: 99.99, currency: 'USD', features: ['Word, Excel, PowerPoint', '1TB OneDrive par personne', '6 utilisateurs', 'Copilot IA inclus'], image: 'https://img.icons8.com/fluency/96/microsoft.png', isPromo: false },
  { title: 'Adobe Creative Cloud', provider: 'Adobe', category: 'software', description: 'Toutes les apps Adobe', originalPrice: 54.99, currency: 'USD', features: ['Photoshop, Illustrator', '20+ applications créatives', '100GB cloud storage', 'Adobe Fonts inclus'], image: 'https://img.icons8.com/color/96/adobe-acrobat.png', isPromo: true, promoPrice: 34.99 },
  { title: 'YouTube Premium', provider: 'YouTube', category: 'streaming', description: 'Sans pub + YouTube Music', originalPrice: 13.99, currency: 'USD', features: ['Sans publicité', 'YouTube Music Premium', 'Téléchargements offline', 'Lecture en arrière-plan'], image: 'https://img.icons8.com/fluency/96/youtube.png', isPromo: false },
  { title: 'Nintendo Switch Online', provider: 'Nintendo', category: 'gaming', description: 'Jeux classiques + Online', originalPrice: 19.99, currency: 'USD', features: ['NES, SNES, N64 classiques', 'Jeu en ligne', 'Sauvegardes cloud', 'Offres exclusives'], image: 'https://img.icons8.com/color/96/nintendo.png', isPromo: false },
  { title: 'Windows 11 Pro', provider: 'Microsoft', category: 'software', description: 'Licence permanente', originalPrice: 199.99, currency: 'USD', features: ['Licence originale permanente', 'Activation à vie', 'Mises à jour gratuites', 'BitLocker encryption'], image: 'https://img.icons8.com/color/96/windows.png', isPromo: true, promoPrice: 89.99 },
  { title: 'HBO Max Ad-Free', provider: 'HBO', category: 'streaming', description: 'Séries et films HBO', originalPrice: 15.99, currency: 'USD', features: ['Sans publicité', '4K Ultra HD', 'Contenu HBO exclusif', 'Téléchargements offline'], image: 'https://img.icons8.com/fluency/96/hbo.png', isPromo: false },
];

async function discoverTrending() {
  console.log('[Auto-Discovery] Scanning for trending products and promotions...');
  await TrendingItem.deleteMany({});

  const items = TRENDING_DEALS.map(d => ({
    title: d.title,
    provider: d.provider,
    category: d.category,
    description: d.description,
    originalPrice: d.isPromo ? d.promoPrice : d.originalPrice,
    originalCurrency: d.currency,
    promoPrice: d.isPromo ? d.promoPrice : null,
    features: d.features,
    image: d.image || '',
    isPromo: d.isPromo,
    url: `https://www.${d.provider.toLowerCase()}.com`,
  }));

  await TrendingItem.insertMany(items);
  console.log(`[Auto-Discovery] Found ${items.length} trending items (${items.filter(i => i.isPromo).length} promotions)`);

  for (const item of items) {
    const exists = await Product.findOne({ name: item.title });
    if (!exists) {
      const priceTND = await convertToTND(item.originalPrice, item.originalCurrency);
      await Product.create({
        name: item.title,
        description: item.description,
        category: item.category,
        originalPrice: priceTND,
        originalCurrency: 'TND',
        provider: item.provider,
        providerUrl: item.url,
        features: item.features,
        image: item.image,
        isTrending: true,
        isPromo: item.isPromo,
        promoOriginalPrice: item.isPromo ? await convertToTND(item.promoPrice, item.originalCurrency) : null,
        available: true,
        sortOrder: item.isPromo ? -1 : 0,
      });
      console.log(`[Auto-Discovery] Added: ${item.title}`);
    }
  }
}

module.exports = { discoverTrending };
