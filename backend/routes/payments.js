const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Flouci API Configuration
const FLOUCI_API_URL = process.env.FLOUCI_API_URL || 'https://api.flouci.com/v1';
const FLOUCI_API_KEY = process.env.FLOUCI_API_KEY;
const FLOUCI_SECRET_KEY = process.env.FLOUCI_SECRET_KEY;

// Exchange Rate API Configuration
const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY;
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/TND';

// Helper function to get current exchange rates
async function getExchangeRates() {
    try {
        const response = await axios.get(EXCHANGE_API_URL);
        return response.data.rates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        throw new Error('Unable to fetch exchange rates');
    }
}

// Generate Flouci payment signature
function generatePaymentSignature(orderId, amount) {
    const data = `${orderId}|${amount}|${FLOUCI_API_KEY}`;
    return crypto.createHmac('sha256', FLOUCI_SECRET_KEY)
        .update(data)
        .digest('hex');
}

// Initiate payment with Flouci
router.post('/flouci/initiate', auth, async (req, res) => {
    try {
        const { items } = req.body;
        
        // Calculate total amount including commission
        const products = await Product.find({ _id: { $in: items.map(item => item.id) } });
        const subtotal = products.reduce((sum, product) => sum + product.basePrice, 0);
        const commission = subtotal * 0.15; // 15% commission
        const total = subtotal + commission;

        // Create order
        const order = new Order({
            user: req.user._id,
            items: products.map(product => ({
                product: product._id,
                price: product.basePrice,
                internationalPrice: product.internationalPrice
            })),
            subtotal,
            commission,
            total,
            status: 'pending'
        });
        await order.save();

        // Generate payment signature
        const signature = generatePaymentSignature(order._id, total);

        // Initialize Flouci payment
        const paymentResponse = await axios.post(`${FLOUCI_API_URL}/payment/init`, {
            app_token: FLOUCI_API_KEY,
            app_secret: FLOUCI_SECRET_KEY,
            amount: total,
            accept_card: true,
            session_timeout_secs: 1800,
            success_link: `${process.env.FRONTEND_URL}/payment/success`,
            fail_link: `${process.env.FRONTEND_URL}/payment/fail`,
            developer_tracking_id: order._id.toString(),
            signature
        });

        // Update order with payment details
        order.paymentId = paymentResponse.data.payment_id;
        await order.save();

        res.json({
            success: true,
            paymentUrl: paymentResponse.data.payment_url,
            orderId: order._id
        });
    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'initiation du paiement',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Verify payment status
router.get('/verify/:orderId', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }

        // Verify payment status with Flouci
        const response = await axios.get(`${FLOUCI_API_URL}/payment/verify/${order.paymentId}`, {
            headers: {
                'Authorization': `Bearer ${FLOUCI_API_KEY}`
            }
        });

        if (response.data.status === 'COMPLETED') {
            // Process international payments for each item
            const exchangeRates = await getExchangeRates();
            
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                
                // Convert TND to international currency
                const internationalAmount = item.price * exchangeRates[product.internationalPrice.currency];
                
                // Process international payment (implement your provider's API here)
                await processInternationalPayment(product, internationalAmount);
                
                // Update stock if needed
                if (product.stock > 0) {
                    product.stock -= 1;
                    await product.save();
                }
            }

            // Update order status
            order.status = 'completed';
            order.completedAt = new Date();
            await order.save();

            res.json({
                success: true,
                message: 'Paiement complété avec succès',
                order
            });
        } else {
            res.json({
                success: false,
                message: 'Paiement en attente ou échoué',
                status: response.data.status
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification du paiement',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Webhook for Flouci payment notifications
router.post('/webhook/flouci', async (req, res) => {
    try {
        const { payment_id, status, signature } = req.body;

        // Verify webhook signature
        const expectedSignature = generatePaymentSignature(payment_id, status);
        if (signature !== expectedSignature) {
            return res.status(400).json({
                success: false,
                message: 'Invalid signature'
            });
        }

        const order = await Order.findOne({ paymentId: payment_id });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update order status
        order.status = status.toLowerCase();
        if (status === 'COMPLETED') {
            order.completedAt = new Date();
        }
        await order.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing webhook',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Helper function to process international payments
async function processInternationalPayment(product, amount) {
    // Implement your international payment processing logic here
    // This could involve calling APIs for Netflix, Spotify, etc.
    switch (product.provider) {
        case 'Netflix':
            // Implement Netflix subscription API
            break;
        case 'Spotify':
            // Implement Spotify subscription API
            break;
        case 'Microsoft':
            // Implement Microsoft products API
            break;
        default:
            throw new Error('Unsupported provider');
    }
}

module.exports = router;
