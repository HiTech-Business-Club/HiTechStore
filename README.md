<!--
  HiTech Store - Modern Interactive README
  View online: https://github.com/HiTech-Business-Club/HiTechStore
-->

<div align="center">

![Banner](https://capsule-render.vercel.app/api?type=waving&color=0:1a1a2e,100:16213e&height=300&section=header&text=HiTech%20Store&fontSize=80&animation=fadeIn&fontAlignY=35&desc=Plateforme%20E-commerce%20pour%20Services%20Num%C3%A9riques&descAlignY=55&descSize=24)

[![Version](https://img.shields.io/badge/version-1.2.0-6366f1?style=flat&labelColor=1e1e2e&color=6366f1)](https://github.com/HiTech-Business-Club/HiTechStore/releases)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&labelColor=1e1e2e&color=339933)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat&labelColor=1e1e2e&color=47A248)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&labelColor=1e1e2e&color=2496ED)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-ffffff?style=flat&labelColor=1e1e2e&color=6366f1)](LICENSE)

**Plateforme e-commerce pour l'achat de services numériques internationaux (Netflix, Spotify, Microsoft, etc.) avec paiement en Dinars Tunisiens (TND).**

</div>

---

## 🚀 Démarrage Rapide

```bash
# ⚡ Option 1: Docker (Recommandé)
curl -sL https://raw.githubusercontent.com/HiTech-Business-Club/HiTechStore/main/install-docker.sh | bash

# ⚡ Option 2: Installation locale
curl -sL https://raw.githubusercontent.com/HiTech-Business-Club/HiTechStore/main/install-quick.sh | bash
```

**URLs:** • [Store](http://localhost:3000) • [Admin](http://localhost:3000/admin) • [About](http://localhost:3000/about.html)

---

## ✨ Fonctionnalités

<details>
<summary><b>🛒 Store Client</b></summary>

| Feature | Description |
|---------|-------------|
| 🎨 Design | Thème sombre glassmorphism moderne |
| ⚡ 1-Click Purchase | Achat automatique en une étape |
| 📧 Email Auto | Confirmation avec code unique |
| 💰 Prix Transparent | TND + 15% commission |

</details>

<details>
<summary><b>⚙️ Panel Admin</b></summary>

| Module | Features |
|--------|----------|
| 📊 Dashboard | Stats temps réel, revenus, commandes |
| 📦 Products | CRUD complet, stocks |
| 🧾 Orders | Suivi, changement statut |
| 👥 Users | Rôles user/admin, activation |
| 🔥 Trending | Découverte automatique quotidienne |
| 🏢 Providers | Comptes internationaux (Netflix, Spotify...) |

</details>

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend         │  Backend         │  Database            │
│  ─────────        │  ───────         │  ────────            │
│  HTML5/CSS3       │  Node.js 20      │  MongoDB 7           │
│  Vanilla JS       │  Express.js      │  Mongoose            │
│  Bootstrap 5      │  JWT Auth        │  Atlas/Local         │
│                   │  Passport.js     │                      │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────┐        ┌─────────────┐      ┌────────────┐
    │  Nodemailer   │     │  Puppeteer   │     │  Cron Jobs  │
    └─────────┘        └─────────────┘      └────────────┘
```

---

## 📦 Installation

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
cp backend/.env.example backend/.env
# Éditer .env avec vos configs

# 4. Seed + Démarrage
npm run seed && npm start
```

### Docker

```bash
# Lancer MongoDB + App
docker-compose up -d

# Arrêter
docker-compose down
```

---

## ⚙️ Configuration (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/hitechstore_v4

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=72h

# Paiement
COMMISSION_RATE=15
FLOUCI_API_KEY=your-key

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OAuth (optionnel)
GOOGLE_CLIENT_ID=your-id
GITHUB_CLIENT_ID=your-id
```

---

## 🔐 Comptes Test

| Role | Email | Password |
|------|-------|----------|
| 🅰️ Admin | `admin@hitechstore.com` | `Admin123!` |
| 👤 Client | `client@test.com` | `Client123!` |

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register     → Inscription
POST   /api/auth/login        → Connexion
GET    /api/auth/me           → Profil utilisateur
GET    /api/auth/google      → Google OAuth
GET    /api/auth/github      → GitHub OAuth
```

### Products
```
GET    /api/products          → Liste (filter: category, trending, promo)
GET    /api/products/:id      → Détail
POST   /api/products          → Créer (admin)
PUT    /api/products/:id      → Modifier (admin)
DELETE /api/products/:id      → Supprimer (admin)
```

### Orders
```
POST   /api/orders/purchase   → Achat automatique 1 étape
GET    /api/orders/my-orders  → Mes commandes
GET    /api/orders/:number    → Détail commande
```

### Admin (JWT + role:admin)
```
GET    /api/admin/stats       → Dashboard stats
GET    /api/admin/users       → Liste utilisateurs
GET    /api/admin/orders      → Liste commandes
GET    /api/admin/providers   → Comptes fournisseurs
GET    /api/admin/trending    → Items tendance
POST   /api/admin/trending/discover → Lancer découverte
```

---

## 🔄 Flux d'Achat Automatique

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Client     │───▶│   Paiement   │───▶│  Achat Auto  │
│  séléctionne │    │     TND      │    │   Provider   │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                    ┌──────────────┐            │
                    │    Email     │◀──────────┘
                    │ Confirmation │
                    └──────────────┘
```

---

## 📂 Structure du Projet

```
HiTechStore/
├── backend/
│   ├── config/          # DB, JWT config
│   ├── models/          # User, Product, Order, ProviderAccount
│   ├── routes/          # auth, products, orders, admin, oauth
│   ├── middleware/     # auth, validation
│   ├── services/       # purchaseEngine, autoDiscovery
│   ├── utils/          # email, exchange rates
│   ├── server.js       # Entry point
│   └── seed.js         # Database seeder
├── frontend/
│   ├── static/         # CSS, JS
│   └── templates/      # HTML pages
├── docker-compose.yml  # MongoDB + App
├── Dockerfile          # Container image
├── install*.sh         # Installation scripts
└── README.md
```

---

## 🔥 Auto-Discovery

Le système découvre automatiquement les tendances chaque jour à **06h00** (cron job):

- Scan des services populaires (Netflix, Spotify, Microsoft...)
- Détection des promotions en temps réel
- Import automatique en 1 clic depuis le panel admin
- 12 services种子és par défaut

---

## 🤝 Contribution

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

## 📄 License

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

---

## 📧 Contact

• **Email:** contact@hitechstore.com  
• **GitHub:** [HiTech-Business-Club/HiTechStore](https://github.com/HiTech-Business-Club/HiTechStore)  
• **Issues:** [Ouvrir un issue](https://github.com/HiTech-Business-Club/HiTechStore/issues)

---

<div align="center">

⭐⭐⭐⭐⭐ _Si ce projet vous a aidé, donnez une étoile!_

_Fait avec ❤️ par [HiTech Business Club](https://github.com/HiTech-Business-Club)_

</div>