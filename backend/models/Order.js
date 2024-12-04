const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        internationalPrice: {
            amount: Number,
            currency: {
                type: String,
                enum: ['USD', 'EUR']
            }
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    commission: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentId: {
        type: String,
        unique: true,
        sparse: true
    },
    paymentMethod: {
        type: String,
        enum: ['flouci', 'card'],
        required: true,
        default: 'flouci'
    },
    paymentDetails: {
        transactionId: String,
        cardLast4: String,
        paymentStatus: String,
        paymentError: String
    },
    internationalTransactions: [{
        provider: {
            type: String,
            required: true,
            enum: ['Netflix', 'Spotify', 'Microsoft', 'PlayStation', 'Xbox', 'Steam']
        },
        transactionId: String,
        amount: Number,
        currency: String,
        status: String,
        createdAt: Date,
        error: String
    }],
    billingDetails: {
        name: String,
        email: String,
        phone: String,
        address: String
    },
    completedAt: Date,
    refundedAt: Date,
    activationCodes: [{
        service: {
            type: String,
            required: true
        },
        code: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'active', 'used', 'expired'],
            default: 'pending'
        },
        activatedAt: Date,
        expiresAt: Date
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ paymentId: 1 }, { unique: true, sparse: true });
orderSchema.index({ status: 1 });
orderSchema.index({ 'activationCodes.code': 1 });

// Virtual for order reference number
orderSchema.virtual('referenceNumber').get(function() {
    return `ORD-${this._id.toString().slice(-6).toUpperCase()}`;
});

// Methods
orderSchema.methods.calculateTotals = function() {
    this.subtotal = this.items.reduce((sum, item) => sum + item.price, 0);
    this.commission = this.subtotal * 0.15; // 15% commission
    this.total = this.subtotal + this.commission;
};

orderSchema.methods.markAsCompleted = async function() {
    this.status = 'completed';
    this.completedAt = new Date();
    await this.save();
};

orderSchema.methods.markAsFailed = async function(error) {
    this.status = 'failed';
    this.paymentDetails.paymentError = error;
    await this.save();
};

orderSchema.methods.processRefund = async function() {
    if (this.status !== 'completed') {
        throw new Error('Only completed orders can be refunded');
    }
    
    // Implement refund logic here
    this.status = 'refunded';
    this.refundedAt = new Date();
    await this.save();
};

// Add activation codes
orderSchema.methods.addActivationCodes = async function(codes) {
    codes.forEach(code => {
        this.activationCodes.push({
            service: code.service,
            code: code.code,
            expiresAt: code.expiresAt
        });
    });
    await this.save();
};

// Check if all services are activated
orderSchema.methods.isFullyActivated = function() {
    return this.items.length === this.activationCodes.filter(code => 
        code.status === 'active'
    ).length;
};

// Static methods
orderSchema.statics.findByPaymentId = function(paymentId) {
    return this.findOne({ paymentId });
};

orderSchema.statics.findPendingOrders = function() {
    return this.find({ 
        status: 'pending',
        createdAt: { 
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
    });
};

// Pre-save middleware
orderSchema.pre('save', function(next) {
    if (this.isNew) {
        this.calculateTotals();
    }
    next();
});

// Create model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
