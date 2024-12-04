# Guide de Déploiement HiTech Store

Ce guide détaille le processus de déploiement de la plateforme HiTech Store en production.

## Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration du Serveur](#configuration-du-serveur)
3. [Déploiement](#déploiement)
4. [Configuration SSL](#configuration-ssl)
5. [Monitoring](#monitoring)
6. [Backup](#backup)
7. [Maintenance](#maintenance)

## Prérequis

### Matériel Recommandé
- CPU: 2 cœurs minimum
- RAM: 4GB minimum
- Stockage: 20GB minimum
- Bande passante: 100Mbps minimum

### Logiciels Requis
- Ubuntu 20.04 LTS ou supérieur
- Node.js 14.x ou supérieur
- MongoDB 4.4 ou supérieur
- Nginx
- PM2
- Git
- Certbot

## Configuration du Serveur

### 1. Mise à jour du système

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer les dépendances essentielles
sudo apt install -y curl git build-essential
```

### 2. Installation de Node.js

```bash
# Ajouter le repository NodeSource
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -

# Installer Node.js
sudo apt install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

### 3. Installation de MongoDB

```bash
# Importer la clé publique
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -

# Ajouter le repository MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

# Installer MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Démarrer MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 4. Installation de Nginx

```bash
# Installer Nginx
sudo apt install -y nginx

# Démarrer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Déploiement

### 1. Préparation

```bash
# Créer l'utilisateur de déploiement
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy

# Configurer SSH
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
```

### 2. Configuration du Projet

```bash
# Se connecter en tant qu'utilisateur deploy
sudo su - deploy

# Cloner le repository
git clone https://github.com/votre-repo/hitechstore.git
cd hitechstore

# Installer les dépendances
cd backend
npm install --production

# Configurer les variables d'environnement
cp .env.example .env
nano .env
```

### 3. Configuration PM2

```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Démarrer l'application
pm2 start server.js --name hitechstore

# Configuration du démarrage automatique
pm2 startup ubuntu
pm2 save
```

### 4. Configuration Nginx

```bash
# Créer la configuration Nginx
sudo nano /etc/nginx/sites-available/hitechstore

# Ajouter la configuration suivante:
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

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /static {
        alias /var/www/hitechstore/frontend/static;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}

# Activer le site
sudo ln -s /etc/nginx/sites-available/hitechstore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Configuration SSL

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d votre-domaine.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

## Monitoring

### 1. PM2 Monitoring

```bash
# Voir les logs
pm2 logs hitechstore

# Monitorer l'application
pm2 monit

# Status de l'application
pm2 status
```

### 2. Nginx Monitoring

```bash
# Voir les logs d'accès
tail -f /var/log/nginx/access.log

# Voir les logs d'erreur
tail -f /var/log/nginx/error.log
```

### 3. MongoDB Monitoring

```bash
# Status du service
sudo systemctl status mongod

# Logs MongoDB
tail -f /var/log/mongodb/mongod.log
```

## Backup

### 1. Base de Données

```bash
# Backup quotidien
#!/bin/bash
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d)
mongodump --out $BACKUP_DIR/$DATE

# Nettoyer les vieux backups (garder 7 jours)
find $BACKUP_DIR/* -type d -mtime +7 -exec rm -rf {} \;
```

### 2. Fichiers

```bash
# Backup des fichiers statiques
rsync -av /var/www/hitechstore/frontend/static /backup/files/
```

## Maintenance

### 1. Mise à Jour de l'Application

```bash
# Script de mise à jour
#!/bin/bash
cd /var/www/hitechstore

# Pull des changements
git pull origin main

# Installer les dépendances
cd backend
npm install --production

# Redémarrer l'application
pm2 restart hitechstore
```

### 2. Maintenance du Serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Nettoyer le cache
sudo apt autoremove
sudo apt clean
```

### 3. Rotation des Logs

```bash
# Configuration logrotate
sudo nano /etc/logrotate.d/hitechstore

/var/log/hitechstore/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Sécurité

### 1. Firewall

```bash
# Configurer UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 2. Fail2Ban

```bash
# Installer Fail2Ban
sudo apt install -y fail2ban

# Configurer Fail2Ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Redémarrer Fail2Ban
sudo systemctl restart fail2ban
```

## Dépannage

### Problèmes Courants

1. L'application ne démarre pas:
```bash
# Vérifier les logs PM2
pm2 logs hitechstore

# Vérifier les permissions
ls -la /var/www/hitechstore
```

2. Erreurs Nginx:
```bash
# Tester la configuration
sudo nginx -t

# Vérifier les logs
sudo tail -f /var/log/nginx/error.log
```

3. Problèmes de base de données:
```bash
# Vérifier le status
sudo systemctl status mongod

# Réparer la base de données
mongod --repair
```

## Support

Pour toute assistance technique:
- Email: devops@hitechstore.com
- Documentation: /docs/
- Logs: /var/log/hitechstore/
