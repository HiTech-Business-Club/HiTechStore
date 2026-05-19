# Guide d'Installation HiTech Store

Ce guide détaille l'installation et la configuration de la plateforme HiTech Store.

## Prérequis

- Node.js (v14 ou supérieur)
- MongoDB (v4.4 ou supérieur)
- Git
- PM2 (pour la production)

## Installation en Local

### 1. Cloner le Projet

```bash
git clone https://github.com/votre-repo/hitechstore.git
cd hitechstore
```

### 2. Configuration Backend

```bash
cd backend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Éditer le fichier .env avec vos configurations
nano .env
```

Configuration minimale du fichier .env :
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/hitechstore
JWT_SECRET=votre_secret_jwt
FLOUCI_API_KEY=votre_cle_api_flouci
FLOUCI_SECRET_KEY=votre_cle_secrete_flouci
```

### 3. Configuration Frontend

```bash
cd frontend

# Installer les dépendances
npm install
```

### 4. Base de Données

```bash
# Démarrer MongoDB
sudo service mongodb start

# Initialiser la base de données
node scripts/init-db.js
```

### 5. Démarrer l'Application

En développement :
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

En production :
```bash
# Installation de PM2
npm install -g pm2

# Démarrer le backend avec PM2
cd backend
pm2 start server.js --name hitechstore

# Configurer le démarrage automatique
pm2 startup
pm2 save
```

## Configuration du Serveur

### 1. Prérequis Serveur

- Ubuntu 20.04 LTS ou supérieur
- Nginx
- MongoDB
- Node.js et NPM
- PM2
- Certbot (pour SSL)

### 2. Installation des Dépendances

```bash
# Mettre à jour le système
sudo apt update
sudo apt upgrade -y

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt install -y nodejs

# Installer MongoDB
sudo apt install -y mongodb

# Installer Nginx
sudo apt install -y nginx

# Installer PM2
sudo npm install -g pm2

# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 3. Configuration Nginx

```bash
# Créer la configuration Nginx
sudo nano /etc/nginx/sites-available/hitechstore

# Ajouter la configuration suivante :
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Activer le site
sudo ln -s /etc/nginx/sites-available/hitechstore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Configuration SSL

```bash
sudo certbot --nginx -d votre-domaine.com
```

## Configuration Flouci

1. Créer un compte marchand sur Flouci
2. Obtenir les clés API dans le tableau de bord
3. Configurer les webhooks :
   - URL: https://votre-domaine.com/api/payments/webhook/flouci
   - Events: payment.success, payment.failed

## Sécurité

1. Firewall :
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

2. MongoDB :
```bash
# Éditer la configuration MongoDB
sudo nano /etc/mongodb.conf

# Activer l'authentification
security:
  authorization: enabled
```

3. Permissions :
```bash
# Créer un utilisateur dédié
sudo useradd -r -s /bin/false hitechstore
sudo chown -R hitechstore:hitechstore /var/www/hitechstore
```

## Maintenance

### Backups

```bash
# Backup MongoDB
mongodump --out /backup/$(date +%Y%m%d)

# Backup des fichiers
rsync -av /var/www/hitechstore /backup/files/
```

### Logs

```bash
# Logs PM2
pm2 logs hitechstore

# Logs Nginx
tail -f /var/log/nginx/error.log
```

### Mise à Jour

```bash
# Mettre à jour le code
cd /var/www/hitechstore
git pull

# Mettre à jour les dépendances
npm install

# Redémarrer l'application
pm2 restart hitechstore
```

## Dépannage

### Problèmes Courants

1. Erreur de connexion MongoDB :
```bash
# Vérifier le status
sudo systemctl status mongodb

# Redémarrer MongoDB
sudo systemctl restart mongodb
```

2. Erreur Nginx :
```bash
# Vérifier la syntaxe
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

3. Application Node.js plantée :
```bash
# Vérifier les logs
pm2 logs hitechstore

# Redémarrer l'application
pm2 restart hitechstore
```

## Support

Pour toute assistance :
- Email : support@hitechstore.com
- Documentation API : /docs/API.md
- Guide de déploiement : /docs/DEPLOYMENT.md
