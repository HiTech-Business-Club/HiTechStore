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

router.post('/checkout', auth,
  [
    body('productId').isMongoId().withMessage('Produit requis'),
    body('customerInfo.firstName').notEmpty().withMessage('Prénom requis'),
    body('customerInfo.lastName').notEmpty().withMessage('Nom requis'),
    body('customerInfo.email').isEmail().withMessage('Email requis'),
    body('customerInfo.providerEmail').isEmail().withMessage('Email du compte service requis'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.body.productId);
    if (!product || !product.available) return res.status(404).json({ success: false, message: 'Produit non disponible' });

    const commissionRate = product.commissionRate || 15;
    const priceTND = product.originalPrice;
    const commission = Math.round(priceTND * commissionRate / 100 * 100) / 100;
    const finalPriceTND = Math.round((priceTND + commission) * 100) / 100;

    const orderNumber = `HTS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const order = await Order.create({
      orderNumber,
      user: req.user.id,
      product: product._id,
      productName: product.name,
      provider: product.provider,
      originalPrice: product.originalPrice,
      originalCurrency: product.originalCurrency || 'TND',
      priceTND,
      commission,
      finalPriceTND,
      status: 'pending',
      customerInfo: {
        firstName: req.body.customerInfo.firstName,
        lastName: req.body.customerInfo.lastName,
        email: req.body.customerInfo.email,
        phone: req.body.customerInfo.phone || '',
        address: req.body.customerInfo.address || '',
        providerEmail: req.body.customerInfo.providerEmail,
        providerPassword: req.body.customerInfo.providerPassword || '',
        notes: req.body.customerInfo.notes || '',
      },
    });

    res.status(201).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        productName: product.name,
        provider: product.provider,
        priceTND,
        commission,
        finalPriceTND,
        duration: product.duration,
      },
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

router.post('/purchase', auth,
  [
    body('productId').isMongoId().withMessage('Produit requis'),
    body('customerInfo.firstName').notEmpty().withMessage('Prénom requis'),
    body('customerInfo.lastName').notEmpty().withMessage('Nom requis'),
    body('customerInfo.email').isEmail().withMessage('Email requis'),
    body('customerInfo.providerEmail').isEmail().withMessage('Email du compte service requis'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.body.productId);
    if (!product || !product.available) return res.status(404).json({ success: false, message: 'Produit non disponible' });

    const commissionRate = product.commissionRate || 15;
    const priceTND = product.originalPrice;
    const commission = Math.round(priceTND * commissionRate / 100 * 100) / 100;
    const finalPriceTND = Math.round((priceTND + commission) * 100) / 100;

    const orderNumber = `HTS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const order = await Order.create({
      orderNumber,
      user: req.user.id,
      product: product._id,
      productName: product.name,
      provider: product.provider,
      originalPrice: product.originalPrice,
      originalCurrency: product.originalCurrency || 'TND',
      priceTND,
      commission,
      finalPriceTND,
      status: 'processing',
      customerInfo: {
        firstName: req.body.customerInfo.firstName,
        lastName: req.body.customerInfo.lastName,
        email: req.body.customerInfo.email,
        phone: req.body.customerInfo.phone || '',
        address: req.body.customerInfo.address || '',
        providerEmail: req.body.customerInfo.providerEmail,
        providerPassword: req.body.customerInfo.providerPassword || '',
        notes: req.body.customerInfo.notes || '',
      },
    });

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
      order.status = 'failed';
      order.purchaseDetails = { error: result.error };
      await order.save();
      res.status(500).json({ success: false, message: result.error });
    }
  })
);

module.exports = router;
