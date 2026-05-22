#!/bin/bash

# HiTech Store - Auto Install Script
# Version: 1.1.0

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ██████╗ ███████╗████████╗██████╗  ██████╗ ███████╗        ║"
echo "║   ██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗██╔════╝        ║"
echo "║   ██████╔╝█████╗     ██║   ██████╔╝██║   ██║███████╗        ║"
echo "║   ██╔══██╗██╔══╝     ██║   ██╔══██╗██║   ██║╚════██║        ║"
echo "║   ██║  ██║███████╗   ██║   ██║  ██║╚██████╔╝███████║        ║"
echo "║   ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝        ║"
echo "║                                                           ║"
echo "║          Auto Install - Services Digitaux Premium         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Configuration
PROJECT_NAME="hitechstore-v4"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

# Check if running from project root
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Erreur: Veuillez lancer ce script depuis le répertoire racine du projet${NC}"
    exit 1
fi

echo -e "${YELLOW}Vérification des prérequis...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Erreur: Node.js n'est pas installé${NC}"
    echo "Installez Node.js: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Erreur: Node.js version 18+ requise (actuelle: v${NODE_VERSION})${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js v$(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Erreur: npm n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} npm $(npm -v)"

# Check MongoDB (optional - will use localhost default)
echo -e "${YELLOW}Vérification de MongoDB...${NC}"
if command -v mongod &> /dev/null; then
    echo -e "${GREEN}✓${NC} MongoDB trouvé"
else
    echo -e "${YELLOW}⚠${NC} MongoDB non trouvé - Utilisation de localhost:27017 par défaut"
    echo "  Installez MongoDB ou utilisez MongoDB Atlas"
fi

echo ""
echo -e "${YELLOW}Installation des dépendances...${NC}"

# Install backend dependencies
if [ -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}Suppression des anciennes dépendances...${NC}"
    rm -rf "$BACKEND_DIR/node_modules"
fi

cd "$BACKEND_DIR"
npm install --legacy-peer-deps 2>&1 | tail -5
echo -e "${GREEN}✓${NC} Dépendances backend installées"

# Create .env file if not exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Création du fichier de configuration .env${NC}"
    cp .env.example .env 2>/dev/null || echo "PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/hitechstore_v4
JWT_SECRET=hitechstore-v4-secret-key-$(date +%s)
JWT_EXPIRE=72h
FRONTEND_URL=http://localhost:3000
COMMISSION_RATE=15
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200" > .env
    echo -e "${GREEN}✓${NC} Fichier .env créé"
else
    echo -e "${GREEN}✓${NC} Fichier .env existant"
fi

cd ..

echo ""
echo -e "${YELLOW}Seed de la base de données...${NC}"
cd "$BACKEND_DIR"
npm run seed

echo ""
echo -e "${YELLOW}Démarrage du serveur...${NC}"

# Start server in background
node server.js > /tmp/hitechstore.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Check if server is running
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                    🎉 INSTALLATION RÉUSSIE! 🎉              ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "  ${GREEN}Store:${NC}   http://localhost:3000"
    echo -e "  ${GREEN}Admin:${NC}  http://localhost:3000/admin"
    echo -e "  ${GREEN}About:${NC}  http://localhost:3000/about.html"
    echo ""
    echo -e "${YELLOW}Comptes de test:${NC}"
    echo "  Consultez le fichier seed.js pour les identifiants par défaut"
    echo ""
    echo -e "${BLUE}Pour arrêter le serveur:${NC} kill $SERVER_PID"
    echo -e "${BLUE}Pour voir les logs:${NC} tail -f /tmp/hitechstore.log"
    echo ""
else
    echo -e "${RED}Erreur: Le serveur n'a pas pu démarrer${NC}"
    echo "Vérifiez les logs: /tmp/hitechstore.log"
    exit 1
fi