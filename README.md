<!--
  HiTech Store v4 - Modern Interactive README
  View online: https://github.com/HiTech-Business-Club/HiTechStore
-->

<div align="center">

![Banner](https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0f,100:13131d&height=300&section=header&text=HiTech%20Store&fontSize=80&animation=fadeIn&fontAlignY=35&desc=Services%20Num%C3%A9riques%20Premium%20%E2%80%A2%20Multi-Langue&descAlignY=55&descSize=24)

[![Version](https://img.shields.io/badge/version-4.0.0-7c5cfc?style=flat&labelColor=0a0a0f&color=7c5cfc)](https://github.com/HiTech-Business-Club/HiTechStore/releases)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&labelColor=0a0a0f&color=339933)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat&labelColor=0a0a0f&color=47A248)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&labelColor=0a0a0f&color=2496ED)](https://docker.com)
[![i18n](https://img.shields.io/badge/i18n-FR%20%7C%20EN%20%7C%20AR-f59e0b?style=flat&labelColor=0a0a0f&color=f59e0b)]()
[![License](https://img.shields.io/badge/License-MIT-ffffff?style=flat&labelColor=0a0a0f&color=7c5cfc)](LICENSE)

**Plateforme e-commerce pour l'achat de services numériques internationaux avec paiement en Dinars Tunisiens (TND). Support multi-langue (FR/EN/AR) avec RTL.**

</div>

---

## Démarrage Rapide

```bash
# Docker (Recommandé)
curl -sL https://raw.githubusercontent.com/HiTech-Business-Club/HiTechStore/main/install-docker.sh | bash

# Installation locale
curl -sL https://raw.githubusercontent.com/HiTech-Business-Club/HiTechStore/main/install-quick.sh | bash
```

**URLs:** [Store](http://localhost:3000) • [Admin](http://localhost:3000/admin) • [About](http://localhost:3000/about)

---

## Fonctionnalités

### Store Client
| Feature | Description |
|---------|-------------|
| Multi-Langue | FR / EN / AR avec RTL automatique |
| Design | Thème sombre glassmorphism, animations fluides |
| Produits | Logos de marque, page détail complète |
| 1-Click Purchase | Achat automatique en une étape |
| Email Auto | Confirmation avec code unique |
| Prix Transparent | Service + TVA en TND |
| OAuth | Google, GitHub, Apple, Facebook |

### Panel Admin
| Module | Features |
|--------|----------|
| Dashboard | Stats temps réel, revenus, commandes |
| Products | CRUD complet, images, stocks |
| Orders | Suivi, changement statut |
| Users | Rôles user/admin, activation |
| Trending | Découverte automatique quotidienne |
| Providers | Comptes internationaux |

---

## Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend         │  Backend         │  Database            │
│  ─────────        │  ───────         │  ────────            │
│  HTML5/CSS3       │  Node.js 20      │  MongoDB 7           │
│  Vanilla JS       │  Express.js      │  Mongoose            │
│  Bootstrap 5      │  JWT Auth        │  Atlas/Local         │
│  i18n (FR/EN/AR)  │  Passport.js     │                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Installation

### Prérequis
- **Node.js** 18+ & **npm**
- **MongoDB** 6+ (local ou [Atlas](https://atlas.mongodb.com))
- Optionnel: **Docker** & **Docker Compose**

### Installation Manuelle

```bash
# 1. Cloner le projet
git clone https://github.com/HiTech-Business-Club/HiTechStore.git
cd HiTechStore

# 2. Installer les dépendances
cd backend && npm install

# 3. Configuration
cp .env.example .env
# Éditer .env avec vos configs

# 4. Seed + Démarrage
npm run seed && npm start
```

### Docker

```bash
docker-compose up -d
```

---

## Configuration (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/hitechstore_v4

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=72h

# Commission
COMMISSION_RATE=15

# Email (optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# OAuth (optionnel)
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
GITHUB_CLIENT_ID=your-id
GITHUB_CLIENT_SECRET=your-secret
FACEBOOK_APP_ID=your-id
FACEBOOK_APP_SECRET=your-secret
```

---

## Multi-Langue

Le support multilingue est intégré avec les langues suivantes :

| Langue | Code | Direction |
|--------|------|-----------|
| Français | `fr` | LTR (défaut) |
| English | `en` | LTR |
| العربية | `ar` | RTL |

**Fonctionnement:**
- Sélecteur de langue dans la navbar (bouton globe)
- Persistance dans `localStorage`
- Détection automatique de la langue du navigateur
- Layout RTL automatique pour l'arabe
- Police Tajawal pour l'arabe

**Fichiers de traduction:** `frontend/static/i18n/{fr,en,ar}.json`

---

## Comptes Test

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hitechstore.com` | `Admin123!` |
| Client | `client@test.com` | `Client123!` |

---

## API Endpoints

### Authentication
```
POST   /api/auth/register     → Inscription
POST   /api/auth/login        → Connexion
GET    /api/auth/me           → Profil utilisateur
```

### OAuth
```
GET    /api/oauth/google      → Google OAuth
GET    /api/oauth/github      → GitHub OAuth
GET    /api/oauth/apple       → Apple OAuth
GET    /api/oauth/facebook    → Facebook OAuth
GET    /api/oauth/status      → Status des providers
```

### Products
```
GET    /api/products          → Liste (filtres: category, trending, promo, search)
GET    /api/products/:id      → Détail produit
POST   /api/products          → Créer (admin)
PUT    /api/products/:id      → Modifier (admin)
DELETE /api/products/:id      → Supprimer (admin)
```

### Orders
```
POST   /api/orders/checkout   → Créer commande (pending)
POST   /api/orders/pay        → Payer commande existante
POST   /api/orders/purchase   → Achat en 1 étape
GET    /api/orders/my-orders  → Mes commandes
GET    /api/orders/:number    → Détail commande
```

### Admin (JWT + role:admin)
```
GET    /api/admin/stats       → Dashboard stats
GET    /api/admin/users       → Liste utilisateurs
PUT    /api/admin/users/:id   → Modifier utilisateur
GET    /api/admin/orders      → Liste commandes
PUT    /api/admin/orders/:id/status → Changer statut
GET    /api/admin/providers   → Comptes fournisseurs
POST   /api/admin/providers   → Ajouter fournisseur
GET    /api/admin/trending    → Items tendance
POST   /api/admin/trending/discover → Lancer découverte
GET    /api/admin/settings    → Paramètres système
```

---

## Pages

| URL | Description |
|-----|-------------|
| `/` | Store principal avec sections par catégorie |
| `/product/:id` | Page détail produit avec image, features, pricing |
| `/admin` | Panel d'administration |
| `/about` | Page à propos |
| `/demo` | Page de démonstration |

---

## Structure du Projet

```
HiTechStore/
├── backend/
│   ├── config/            # Configuration centralisée
│   ├── middleware/         # Auth, validation, error handler
│   ├── models/            # User, Product, Order, ProviderAccount, TrendingItem
│   ├── routes/            # auth, oauth, products, orders, admin
│   ├── services/          # purchaseEngine, autoDiscovery
│   ├── utils/             # email, exchange rates, asyncHandler
│   ├── server.js          # Point d'entrée Express
│   └── seed.js            # Seeder base de données
├── frontend/
│   ├── static/
│   │   ├── css/           # variables, store, admin, product-detail, about, demo
│   │   ├── js/            # store, admin, product-detail, i18n
│   │   └── i18n/          # fr.json, en.json, ar.json
│   └── templates/
│       ├── pages/         # index, product, about, demo
│       └── admin/         # dashboard
├── docker-compose.yml
├── Dockerfile
└── install*.sh
```

---

## Auto-Discovery

Le système découvre automatiquement les tendances chaque jour à **06h00** (cron job):

- 12 services seedés avec logos de marque
- Scan des services populaires (Netflix, Spotify, Microsoft...)
- Détection des promotions en temps réel
- Import automatique en 1 clic depuis le panel admin

---

## Contribution

```bash
# 1. Fork le projet
# 2. Créer une branche
git checkout -b feature/awesome-feature

# 3. Commit et push
git commit -m "Add awesome feature"
git push origin feature/awesome-feature

# 4. Créer une Pull Request
```

---

## License

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

---

## Contact

- **Email:** contact@hitechstore.tn
- **GitHub:** [HiTech-Business-Club/HiTechStore](https://github.com/HiTech-Business-Club/HiTechStore)
- **Issues:** [Ouvrir un issue](https://github.com/HiTech-Business-Club/HiTechStore/issues)

---

<div align="center">

Si ce projet vous a aidé, donnez une étoile!

Fait avec par [HiTech Business Club](https://github.com/HiTech-Business-Club)

</div>
