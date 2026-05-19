#!/bin/bash

# HiTech Store - Quick Install via Curl
# Usage: curl -sL https://raw.githubusercontent.com/HiTech-Business-Club/HiTechStore/main/install-quick.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           HiTech Store - Installation Rapide v1.1.0           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Detect OS
OS=$(uname -s)
echo -e "${YELLOW}Système:${NC} $OS"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Erreur: Node.js n'est pas installé${NC}"
    echo "Installez Node.js: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node -v)"

# Create temp directory
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

echo -e "${YELLOW}Téléchargement du projet...${NC}"
curl -sL https://github.com/HiTech-Business-Club/HiTechStore/archive/refs/heads/main.tar.gz -o project.tar.gz
tar -xzf project.tar.gz
cd HiTechStore-main

echo -e "${YELLOW}Installation des dépendances...${NC}"
cd backend
npm install --legacy-peer-deps 2>&1 | tail -3

# Create .env
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/hitechstore_v4
JWT_SECRET=hitechstore-secret-$(date +%s)
JWT_EXPIRE=72h
FRONTEND_URL=http://localhost:3000
COMMISSION_RATE=15
EOF
fi

echo -e "${YELLOW}Seed de la base de données...${NC}"
npm run seed

echo -e "${YELLOW}Démarrage du serveur...${NC}"
node server.js &
sleep 3

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    🎉 INSTALLATION TERMINÉE! 🎉              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${GREEN}Store:${NC}   http://localhost:3000"
echo -e "  ${GREEN}Admin:${NC}  http://localhost:3000/admin"
echo ""
echo -e "${YELLOW}Comptes:${NC}"
echo "  Admin:   admin@hitechstore.com / Admin123!"
echo "  Client: client@test.com / Client123!"

# Clean up
cd /
rm -rf "$TMP_DIR"