const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { purchaseFromProvider } = require('../services/purchaseEngine');
const { sendPurchaseConfirmation } = require('../utils/email');

function calculatePricing(product) {
  const commissionRate = product.commissionRate || 15;
  const priceTND = product.originalPrice;
  const commission = Math.round(priceTND * commissionRate / 100 * 100) / 100;
  const finalPriceTND = Math.round((priceTND + commission) * 100) / 100;
  return { priceTND, commission, finalPriceTND };
}

function generateOrderNumber() {
  return `HTS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

function buildOrderData(product, user, customerInfo, status) {
  const { priceTND, commission, finalPriceTND } = calculatePricing(product);
  return {
    orderNumber: generateOrderNumber(),
    user: user.id,
    product: product._id,
    productName: product.name,
    provider: product.provider,
    originalPrice: product.originalPrice,
    originalCurrency: product.originalCurrency || 'TND',
    priceTND,
    commission,
    finalPriceTND,
    status,
    customerInfo: {
      firstName: customerInfo.firstName,
      lastName: customerInfo.lastName,
      email: customerInfo.email,
      phone: customerInfo.phone || '',
      address: customerInfo.address || '',
      providerEmail: customerInfo.providerEmail,
      providerPassword: customerInfo.providerPassword || '',
      notes: customerInfo.notes || '',
    },
  };
}

async function processPurchase(order) {
  const result = await purchaseFromProvider(order);
  if (result.success) {
    order.status = 'delivered';
    order.purchaseDetails = {
      purchasedAt: new Date(),
      transactionId: result.transactionId,
      confirmationCode: result.confirmationCode,
      deliveryMethod: result.deliveryMethod,
      deliveryDetails: result.deliveryDetails,
    };
    await order.save();
    await sendPurchaseConfirmation(order);
  } else {
    order.status = 'failed';
    order.purchaseDetails = { error: result.error };
    await order.save();
  }
  return result;
}

const orderValidation = [
  body('productId').isMongoId().withMessage('Produit requis'),
  body('customerInfo.firstName').notEmpty().withMessage('Prénom requis'),
  body('customerInfo.lastName').notEmpty().withMessage('Nom requis'),
  body('customerInfo.email').isEmail().withMessage('Email requis'),
  body('customerInfo.providerEmail').isEmail().withMessage('Email du compte service requis'),
];

router.post('/checkout', auth, orderValidation, validate,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.body.productId);
    if (!product || !product.available) return res.status(404).json({ success: false, message: 'Produit non disponible' });

    const { priceTND, commission, finalPriceTND } = calculatePricing(product);
    const order = await Order.create(buildOrderData(product, req.user, req.body.customerInfo, 'pending'));

    res.status(201).json({
      success: true,
      data: { orderNumber: order.orderNumber, productName: product.name, provider: product.provider, priceTND, commission, finalPriceTND, duration: product.duration },
    });
  })
);

router.post('/pay', auth,
  [body('orderNumber').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ orderNumber: req.body.orderNumber, user: req.user.id });
    if (!order) return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    if (order.status !== 'pending') return res.status(400).json({ success: false, message: `Commande déjà ${order.status}` });

    order.status = 'processing';
    await order.save();

    const result = await purchaseFromProvider(order);

    if (result.success) {
      order.status = 'delivered';
      order.purchaseDetails = {
        purchasedAt: new Date(),
        transactionId: result.transactionId,
        confirmationCode: result.confirmationCode,
        deliveryMethod: result.deliveryMethod,
        deliveryDetails: result.deliveryDetails,
      };
      await order.save();
      await sendPurchaseConfirmation(order);
      res.json({ success: true, data: { orderNumber: order.orderNumber, confirmationCode: result.confirmationCode, deliveryDetails: result.deliveryDetails } });
    } else {
      order.status = 'failed';
      order.purchaseDetails = { error: result.error };
      await order.save();
      res.status(500).json({ success: false, message: result.error });
    }
  })
);

router.get('/my-orders', auth, asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).populate('product', 'name image').sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: orders });
}));

router.get('/:orderNumber', auth, asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber, user: req.user.id }).lean();
  if (!order) return res.status(404).json({ success: false, message: 'Commande non trouvée' });
  res.json({ success: true, data: order });
}));

router.post('/purchase', auth, orderValidation, validate,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.body.productId);
    if (!product || !product.available) return res.status(404).json({ success: false, message: 'Produit non disponible' });

    const { priceTND, commission, finalPriceTND } = calculatePricing(product);
    const order = await Order.create(buildOrderData(product, req.user, req.body.customerInfo, 'processing'));

    const result = await processPurchase(order);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: {
          orderNumber: order.orderNumber,
          productName: product.name,
          provider: product.provider,
          priceTND,
          commission,
          finalPriceTND,
          confirmationCode: result.confirmationCode,
          deliveryDetails: result.deliveryDetails,
          deliveryEmail: order.customerInfo.providerEmail,
        },
      });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  })
);

module.exports = router;
