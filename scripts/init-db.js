require('dotenv').config({ path: '../backend/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Product } = require('../backend/models/Product');
const { User } = require('../backend/models/User');

// Initial products data
const products = [
    {
        name: "Netflix Premium",
        description: "Accès Premium à Netflix avec 4K Ultra HD et 4 écrans simultanés",
        category: "streaming",
        basePrice: 45.00,
        provider: "Netflix",
        duration: "1_month",
        image: "/images/products/netflix-premium.jpg",
        features: [
            "4K Ultra HD",
            "4 écrans simultanés",
            "Téléchargements illimités",
            "Sans publicité"
        ],
        internationalPrice: {
            amount: 14.99,
            currency: "USD"
        }
    },
    {
        name: "Spotify Premium",
        description: "Musique illimitée sans publicité avec Spotify Premium",
        category: "streaming",
        basePrice: 25.00,
        provider: "Spotify",
        duration: "1_month",
        image: "/images/products/spotify-premium.jpg",
        features: [
            "Musique sans publicité",
            "Téléchargement hors ligne",
            "Qualité audio supérieure",
            "Mode shuffle illimité"
        ],
        internationalPrice: {
            amount: 9.99,
            currency: "USD"
        }
    },
    {
        name: "Microsoft 365 Personnel",
        description: "Suite Microsoft Office complète pour 1 utilisateur",
        category: "software",
        basePrice: 220.00,
        provider: "Microsoft",
        duration: "12_months",
        image: "/images/products/microsoft-365.jpg",
        features: [
            "Word, Excel, PowerPoint",
            "1TB OneDrive",
            "Outlook Premium",
            "Support technique"
        ],
        internationalPrice: {
            amount: 69.99,
            currency: "USD"
        }
    },
    {
        name: "PlayStation Plus Essential",
        description: "Abonnement PlayStation Plus Essential",
        category: "gaming",
        basePrice: 85.00,
        provider: "PlayStation",
        duration: "3_months",
        image: "/images/products/ps-plus.jpg",
        features: [
            "Jeux mensuels gratuits",
            "Multijoueur en ligne",
            "Réductions exclusives",
            "Stockage cloud"
        ],
        internationalPrice: {
            amount: 24.99,
            currency: "USD"
        }
    }
];

// Initial admin user
const adminUser = {
    firstName: "Admin",
    lastName: "User",
    email: "admin@hitechstore.com",
    password: "Admin123!",
    phone: "12345678",
    role: "admin"
};

async function initDatabase() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB successfully');

        // Clear existing data
        console.log('Clearing existing data...');
        await Promise.all([
            Product.deleteMany({}),
            User.deleteMany({})
        ]);
        console.log('Existing data cleared');

        // Insert products
        console.log('Inserting products...');
        await Product.insertMany(products);
        console.log('Products inserted successfully');

        // Create admin user
        console.log('Creating admin user...');
        const hashedPassword = await bcrypt.hash(adminUser.password, 10);
        await User.create({
            ...adminUser,
            password: hashedPassword,
            isVerified: true
        });
        console.log('Admin user created successfully');

        console.log('Database initialization completed successfully!');
        console.log('\nAdmin credentials:');
        console.log('Email:', adminUser.email);
        console.log('Password:', adminUser.password);

    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run initialization
initDatabase();

// Add indexes
async function createIndexes() {
    try {
        // Product indexes
        await Product.collection.createIndex({ category: 1 });
        await Product.collection.createIndex({ provider: 1 });
        await Product.collection.createIndex({ 
            name: 'text', 
            description: 'text' 
        });
        await Product.collection.createIndex({ basePrice: 1 });

        // User indexes
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ phone: 1 });
        await User.collection.createIndex({ role: 1 });

        console.log('Indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
}

// Create database backup
const backup = `
// MongoDB Backup Commands

// Backup entire database
mongodump --uri="${process.env.MONGODB_URI}" --out=./backup/$(date +%Y%m%d)

// Backup specific collections
mongodump --uri="${process.env.MONGODB_URI}" --collection=products --out=./backup/$(date +%Y%m%d)
mongodump --uri="${process.env.MONGODB_URI}" --collection=users --out=./backup/$(date +%Y%m%d)

// Restore database
mongorestore --uri="${process.env.MONGODB_URI}" ./backup/[DATE]

// Export collections to JSON
mongoexport --uri="${process.env.MONGODB_URI}" --collection=products --out=./backup/products.json
mongoexport --uri="${process.env.MONGODB_URI}" --collection=users --out=./backup/users.json

// Import collections from JSON
mongoimport --uri="${process.env.MONGODB_URI}" --collection=products --file=./backup/products.json
mongoimport --uri="${process.env.MONGODB_URI}" --collection=users --file=./backup/users.json
`;

// Write backup commands to file
const fs = require('fs');
fs.writeFileSync('../docs/database-backup.md', backup);

// Export functions for external use
module.exports = {
    initDatabase,
    createIndexes
};
