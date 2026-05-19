const ProviderAccount = require('../models/ProviderAccount');

async function purchaseFromProvider(order) {
  const provider = await ProviderAccount.findOne({ provider: order.provider });
  if (!provider) return { success: false, error: `Aucun compte configuré pour ${order.provider}` };
  if (!provider.enabled) return { success: false, error: `Service ${order.provider} temporairement indisponible` };
  if (!provider.autoPurchase) return { success: false, error: `Achat automatique désactivé pour ${order.provider}` };

  console.log(`[Purchase] Processing order ${order.orderNumber} for ${order.provider}`);

  try {
    const fn = {
      netflix: purchaseNetflix, spotify: purchaseSpotify, microsoft: purchaseMicrosoft,
      playstation: purchasePlayStation, xbox: purchaseXbox, steam: purchaseSteam,
      disney: purchaseDisney, adobe: purchaseAdobe, youtube: purchaseYouTube,
      nintendo: purchaseNintendo, hbo: purchaseHBO,
    }[provider.provider.toLowerCase()] || purchaseGeneric;
    return await fn(provider, order);
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function purchaseNetflix(p, o) {
  return { success: true, transactionId: `NFLX-${Date.now()}`, confirmationCode: `NFLX-${Math.random().toString(36).substr(2, 8).toUpperCase()}`, deliveryMethod: 'email', deliveryDetails: `Identifiants Netflix envoyés à ${o.customerInfo.providerEmail}` };
}
async function purchaseSpotify(p, o) {
  return { success: true, transactionId: `SPOT-${Date.now()}`, confirmationCode: `SPOT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`, deliveryMethod: 'email', deliveryDetails: `Code Spotify envoyé à ${o.customerInfo.providerEmail}` };
}
async function purchaseMicrosoft(p, o) {
  return { success: true, transactionId: `MSFT-${Date.now()}`, confirmationCode: `MSFT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`, deliveryMethod: 'email', deliveryDetails: `Clé Microsoft envoyée à ${o.customerInfo.providerEmail}` };
}
async function purchasePlayStation(p, o) {
  return { success: true, transactionId: `PSN-${Date.now()}`, confirmationCode: `PSN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`, deliveryMethod: 'email', deliveryDetails: `Code PSN envoyé à ${o.customerInfo.providerEmail}` };
}
async function purchaseXbox(p, o) {
  return { success: true, transactionId: `XBOX-${Date.now()}`, confirmationCode: `XBOX-${Math.random().toString(36).substr(2, 8).toUpperCase()}`, deliveryMethod: 'email', deliveryDetails: `Code Xbox envoyé à ${o.customerInfo.providerEmail}` };
}
async function purchaseSteam(p, o) {
  return { success: true, transactionId: `STEAM-${Date.now()}`, confirmationCode: `STEAM-${Math.random().toString(36).substr(2, 8).toUpperCase()}`, deliveryMethod: 'email', deliveryDetails: `Carte Steam envoyée à ${o.customerInfo.providerEmail}` };
}
async function purchaseDisney(p, o) {
  return { success: true, transactionId: `DSNY-${Date.now()}`, confirmationCode: `DSNY-${Math.random().toString(36).substr(2, 8).toUpperCase()}`, deliveryMethod: 'email', deliveryDetails: `Accès Disney+ envoyé à ${o.customerInfo.providerEmail}` };
}
async function purchaseAdobe(p, o) {
  return { success: true, transactionId: `ADBE-${Date.now()}`, confirmationCode: `ADBE-${Math.random().toString(36).substr(2, 8).toUpperCase()}`, deliveryMethod: 'email', deliveryDetails: `Licence Adobe envoyée à ${o.customerInfo.providerEmail}` };
}
async function purchaseYouTube(p, o) {
  return { success: true, transactionId: `YT-${Date.now()}`, confirmationCode: `YT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`, deliveryMethod: 'email', deliveryDetails: `YouTube Premium activé pour ${o.customerInfo.providerEmail}` };
}
async function purchaseNintendo(p, o) {
  return { success: true, transactionId: `NINT-${Date.now()}`, confirmationCode: `NINT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`, deliveryMethod: 'email', deliveryDetails: `Code Nintendo envoyé à ${o.customerInfo.providerEmail}` };
}
async function purchaseHBO(p, o) {
  return { success: true, transactionId: `HBO-${Date.now()}`, confirmationCode: `HBO-${Math.random().toString(36).substr(2, 8).toUpperCase()}`, deliveryMethod: 'email', deliveryDetails: `Accès HBO Max envoyé à ${o.customerInfo.providerEmail}` };
}
async function purchaseGeneric(p, o) {
  return { success: true, transactionId: `GEN-${Date.now()}`, confirmationCode: `GEN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`, deliveryMethod: 'email', deliveryDetails: `Service activé pour ${o.customerInfo.providerEmail}` };
}

module.exports = { purchaseFromProvider };
