const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Le nom du produit est requis'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'La description du produit est requise']
    },
    category: {
        type: String,
        required: [true, 'La catégorie est requise'],
        enum: ['streaming', 'gaming', 'software'],
        index: true
    },
    basePrice: {
        type: Number,
        required: [true, 'Le prix de base est requis'],
        min: [0, 'Le prix ne peut pas être négatif']
    },
    commissionRate: {
        type: Number,
        default: 15,
        min: [0, 'La commission ne peut pas être négative'],
        max: [100, 'La commission ne peut pas dépasser 100%']
    },
    image: {
        type: String,
        required: [true, 'L\'image du produit est requise']
    },
    currency: {
        type: String,
        required: true,
        default: 'TND',
        enum: ['TND', 'USD', 'EUR']
    },
    internationalPrice: {
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            required: true,
            enum: ['USD', 'EUR']
        }
    },
    provider: {
        type: String,
        required: [true, 'Le fournisseur est requis'],
        enum: ['Netflix', 'Spotify', 'Microsoft', 'PlayStation', 'Xbox', 'Steam']
    },
    duration: {
        type: String,
        required: [true, 'La durée de l\'abonnement est requise'],
        enum: ['1_month', '3_months', '6_months', '12_months', 'lifetime']
    },
    features: [{
        type: String
    }],
    available: {
        type: Boolean,
        default: true
    },
    stock: {
        type: Number,
        default: -1 // -1 means unlimited
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for final price (including commission)
productSchema.virtual('finalPrice').get(function() {
    return this.basePrice * (1 + this.commissionRate / 100);
});

// Index for searching
productSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to ensure international price is set
productSchema.pre('save', async function(next) {
    if (!this.internationalPrice.amount) {
        // Here you would typically fetch current exchange rates
        // For now, using a simple conversion (1 USD = 3.2 TND approximately)
        const exchangeRate = 3.2;
        this.internationalPrice = {
            amount: this.basePrice / exchangeRate,
            currency: 'USD'
        };
    }
    next();
});

// Method to check availability
productSchema.methods.isAvailable = function() {
    return this.available && (this.stock === -1 || this.stock > 0);
};

// Method to calculate price in different currencies
productSchema.methods.getPriceInCurrency = async function(targetCurrency) {
    // Here you would typically fetch current exchange rates from an API
    const exchangeRates = {
        TND: 1,
        USD: 1/3.2,
        EUR: 1/3.5
    };
    
    const baseAmount = this.finalPrice;
    return baseAmount * exchangeRates[targetCurrency];
};

// Static method to find available products by category
productSchema.statics.findByCategory = function(category) {
    return this.find({ 
        category, 
        available: true,
        $or: [{ stock: -1 }, { stock: { $gt: 0 } }]
    });
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
