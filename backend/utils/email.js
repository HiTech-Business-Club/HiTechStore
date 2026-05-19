const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = config.email.user ? nodemailer.createTransport({
  host: config.email.host, port: config.email.port, secure: false,
  auth: { user: config.email.user, pass: config.email.pass },
}) : null;

exports.sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.log(`[DEV] Email to ${to}: ${subject}`);
    return;
  }
  try { await transporter.sendMail({ from: config.email.user, to, subject, html }); }
  catch (e) { console.warn(`[DEV] Email failed: ${e.message}`); }
};

exports.sendPurchaseConfirmation = async (order) => {
  const invoiceItems = `
    <tr>
      <td style="padding:10px;border:1px solid #ddd">${order.productName}</td>
      <td style="padding:10px;border:1px solid #ddd">${order.provider}</td>
      <td style="padding:10px;border:1px solid #ddd">1</td>
      <td style="padding:10px;border:1px solid #ddd">${order.priceTND.toFixed(2)} TND</td>
      <td style="padding:10px;border:1px solid #ddd">${order.commission.toFixed(2)} TND</td>
      <td style="padding:10px;border:1px solid #ddd;font-weight:bold">${order.finalPriceTND.toFixed(2)} TND</td>
    </tr>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #6c5ce7, #00cec9); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .invoice-table th { background: #f8f9fa; padding: 10px; border: 1px solid #ddd; text-align: left; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .confirmation-box { background: #e8f8f5; border: 2px solid #00cec9; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
        .confirmation-code { font-size: 24px; font-weight: bold; color: #00b894; letter-spacing: 2px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0">HiTech Store</h1>
          <p>Services Digitaux Premium</p>
        </div>
        <div class="content">
          <h2>Confirmation d'achat</h2>
          <p>Bonjour <strong>${order.customerInfo.firstName} ${order.customerInfo.lastName}</strong>,</p>
          <p>Votre achat a été traité avec succès !</p>
          
          <div class="confirmation-box">
            <p style="margin:0;color:#666">Code de confirmation</p>
            <div class="confirmation-code">${order.purchaseDetails?.confirmationCode || 'N/A'}</div>
            <p style="margin:10px 0 0;color:#666;font-size:12px">${order.purchaseDetails?.deliveryDetails || ''}</p>
          </div>

          <h3 style="margin-top:30px">Facture</h3>
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Fournisseur</th>
                <th>Qté</th>
                <th>Prix</th>
                <th>Commission</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceItems}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" style="text-align:right;padding:10px;border:1px solid #ddd"><strong>Total payé</strong></td>
                <td style="padding:10px;border:1px solid #ddd;font-weight:bold;font-size:18px;color:#00b894">${order.finalPriceTND.toFixed(2)} TND</td>
              </tr>
            </tfoot>
          </table>

          <h3 style="margin-top:30px">Détails de la commande</h3>
          <table style="width:100%;margin:10px 0">
            <tr><td><strong>Numéro de commande:</strong></td><td>${order.orderNumber}</td></tr>
            <tr><td><strong>Date:</strong></td><td>${new Date(order.createdAt).toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}</td></tr>
            <tr><td><strong>Statut:</strong></td><td style="color:#00b894">Livré</td></tr>
            <tr><td><strong>Email de livraison:</strong></td><td>${order.customerInfo.providerEmail}</td></tr>
          </table>
        </div>
        <div class="footer">
          <p>Merci pour votre confiance !</p>
          <p>HiTech Store - Services Digitaux Premium en Tunisie</p>
          <p>contact@hitechstore.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await this.sendEmail(order.customerInfo.email, `Confirmation d'achat - ${order.orderNumber}`, html);
  console.log(`[Email] Invoice sent to ${order.customerInfo.email} for order ${order.orderNumber}`);
};

exports.sendOrderConfirmation = exports.sendPurchaseConfirmation;