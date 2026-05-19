# HiTech Store - Services Digitaux Premium

Plateforme e-commerce tunisienne pour l'achat de services numériques internationaux (Netflix, Spotify, Microsoft, etc.) avec paiement en Dinars Tunisiens (TND).

![Version](https://img.shields.io/badge/version-4.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 Fonctionnalités

### Store Client
- 🎨 **Design moderne et futuriste** - Thème sombre avec glassmorphism
- 🛒 **Achat automatique en 1 étape** - Le client choisit, paie en TND et reçoit instantanément
- 📝 **Formulaire de checkout complet** - Informations personnelles + compte service provider
- 📧 **Confirmation automatique** - Email avec facture détaillée et code de confirmation
- 💰 **Prix transparent** = Prix original converti en TND + 15% commission

### Panel Administrateur
- 📊 **Dashboard** - Stats en temps réel, revenus, commandes récentes
- 📦 **Gestion produits** - CRUD complet, gestion des stocks
- 🧾 **Gestion commandes** - Suivi, changement de statut
- 👥 **Gestion utilisateurs** - Rôles (user/admin), activation/désactivation
- 🏢 **Comptes fournisseurs** - Configuration des comptes internationaux pour achat auto
- 🔥 **Tendances & Promotions** - Découverte automatique quotidienne des offres tendances
- ⚙️ **Configuration paiement** - Gestion Flouci et autres moyens de paiement

### Achat Automatique
- Le backend achète automatiquement le service sur le site officiel
- Livraison instantanée par email
- Confirmation avec code unique

## 🐳 Docker (Optionnel)

```bash
# Installation rapide avec Docker
curl -sL https://raw.githubusercontent.com/HiTech-Business-Club/HiTechStore/main/install-docker.sh | bash

# Ou manuellement:
docker-compose up -d
```

Accéder à:
- **Store:** http://localhost:3000
- **Admin:** http://localhost:3000/admin

### Commandes Docker

| Commande | Description |
|----------|-------------|
| `docker-compose up -d` | Démarrer les services |
| `docker-compose down` | Arrêter les services |
| `docker-compose logs -f` | Voir les logs |

---

## ⚡ Installation Rapide (Curl)

```bash
# Installation en une ligne
curl -sL https://raw.githubusercontent.com/HiTech-Business-Club/HiTechStore/main/install-quick.sh | bash
```

---

## 🛠️ Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Backend | Node.js + Express.js |
| Base de données | MongoDB + Mongoose |
| Authentification | JWT |
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Design | Bootstrap 5 + Custom CSS |
| Emails | Nodemailer |

---

## 📁 Structure du Projet

```
hitechstore-v4/
├── backend/
│   ├── config/          # Configuration (DB, JWT, etc.)
│   ├── models/          # Modèles MongoDB (User, Product, Order, etc.)
│   ├── routes/          # API routes (auth, products, orders, admin)
│   ├── middleware/     # Auth, validation, error handling
│   ├── services/       # Auto-discovery, purchase engine
│   ├── utils/          # Helpers (email, exchange rates)
│   ├── server.js       # Point d'entrée
│   └── seed.js         # Script de seeded données
├── frontend/
│   ├── static/
│   │   ├── css/        # Styles (store.css, admin.css)
│   │   └── js/         # Scripts (store.js, admin.js)
│   └── templates/
│       ├── pages/     # Page d'accueil store
│       └── admin/      # Panel admin
└── README.md
```

---

## 🚦 Guide de Démarrage

### Prérequis
- Node.js 18+
- MongoDB 6+ (local ou Atlas)
- npm ou yarn

### Installation

```bash
# Cloner le projet
git clone https://github.com/HiTech-Business-Club/HiTechStore.git
cd hitechstore-v4

# Installer les dépendances
cd backend
npm install
```

### Configuration

Créer un fichier `.env` dans `backend/`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/hitechstore_v4
JWT_SECRET=votre-secret-key-securisee
JWT_EXPIRE=72h
COMMISSION_RATE=15

# Email (optionnel pour dev)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-password

# Flouci (paiement)
FLOUCI_API_KEY=your-api-key
FLOUCI_SECRET_KEY=your-secret-key
```

### Démarrage

```bash
# Seed de la base de données (création admin, produits, providers)
npm run seed

# Démarrer le serveur
npm start
```

Accéder à:
- **Store:** http://localhost:3000
- **Admin:** http://localhost:3000/admin

### Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@hitechstore.com | Admin123! |
| Client | client@test.com | Client123! |

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Products
- `GET /api/products` - Liste produits (avec filtres: category, trending, promo)
- `GET /api/products/:id` - Détail produit
- `POST /api/products` - Créer produit (admin)
- `PUT /api/products/:id` - Modifier produit (admin)
- `DELETE /api/products/:id` - Supprimer produit (admin)

### Orders
- `POST /api/orders/purchase` - Achat automatique (1 étape)
- `GET /api/orders/my-orders` - Mes commandes
- `GET /api/orders/:orderNumber` - Détail commande

### Admin (JWT + role admin requis)
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/users` - Liste utilisateurs
- `GET /api/admin/orders` - Liste commandes
- `GET /api/admin/providers` - Comptes fournisseurs
- `GET /api/admin/trending` - Items tendance
- `POST /api/admin/trending/discover` - Lancer découverte
- `POST /api/admin/trending/import/:id` - Importer item tendance

---

## 🔄 Flux d'Achat

```
1. Client選擇produit
2. Client remplit formulaire:
   - Nom, Prénom, Email, Téléphone
   - Email du compte service (ex: netflix@email.com)
3. Backend calcule: Prix TND + 15% commission
4. Paiement en TND (simulation)
5. Backend achète automatiquement sur site officiel
6. Confirmation email avec:
   - Numéro de commande
   - Code de confirmation
   - Facture détaillée
   - Détails de livraison
```

---

## ⚙️ Auto-Discovery

Le système découvre automatiquement les tendances chaque jour à 6h00 (cron job):

- Scan des services populaires (Netflix, Spotify, Microsoft, etc.)
- Détection des promotions
- Import automatique en 1 clic depuis le panel admin
- 12 services种子és par défaut

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit vos changements (`git commit -m 'Ajouter une feature'`)
4. Push vers la branche (`git push origin feature/ma-feature`)
5. Créer une Pull Request

---

## 📝 License

MIT License - Voir le fichier LICENSE pour plus de détails.

---

## 📧 Contact

- Email: contact@hitechstore.com
- GitHub: https://github.com/HiTech-Business-Club/HiTechStore

---

<p align="center">Fait avec ❤️ par HiTech Business Club</p>