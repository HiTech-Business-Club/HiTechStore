const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Le prénom est requis'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Le nom est requis'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'L\'email est requis'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez fournir un email valide']
    },
    password: {
        type: String,
        required: [true, 'Le mot de passe est requis'],
        minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
        select: false
    },
    phone: {
        type: String,
        required: [true, 'Le numéro de téléphone est requis'],
        match: [/^[0-9]{8}$/, 'Veuillez fournir un numéro de téléphone valide']
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    preferences: {
        language: {
            type: String,
            enum: ['fr', 'ar', 'en'],
            default: 'fr'
        },
        currency: {
            type: String,
            enum: ['TND', 'USD', 'EUR'],
            default: 'TND'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: true
            }
        }
    },
    addresses: [{
        type: {
            type: String,
            enum: ['billing', 'shipping'],
            required: true
        },
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: 'Tunisia'
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check if password matches
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Method to generate verification token
userSchema.methods.generateVerificationToken = function() {
    const token = crypto.randomBytes(20).toString('hex');
    
    this.verificationToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
        
    this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    return token;
};

// Method to generate password reset token
userSchema.methods.generateResetPasswordToken = function() {
    const token = crypto.randomBytes(20).toString('hex');
    
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
        
    this.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
    
    return token;
};

// Method to handle failed login attempts
userSchema.methods.handleFailedLogin = async function() {
    this.loginAttempts += 1;
    
    if (this.loginAttempts >= 5) {
        this.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
    }
    
    await this.save();
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    this.lastLogin = Date.now();
    await this.save();
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
