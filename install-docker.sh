#!/bin/bash

# HiTech Store - Docker Quick Install
# Usage: curl -sL https://raw.githubusercontent.com/HiTech-Business-Club/HiTechStore/main/install-docker.sh | bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          HiTech Store - Docker Installation v1.1.0            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Erreur: Docker n'est pas installé${NC}"
    echo "Installez Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Erreur: Docker Compose n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker Compose"

# Create temp directory
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

echo -e "${YELLOW}Téléchargement du projet...${NC}"
curl -sL https://github.com/HiTech-Business-Club/HiTechStore/archive/refs/heads/main.tar.gz -o project.tar.gz
tar -xzf project.tar.gz
cd HiTechStore-main

echo -e "${YELLOW}Démarrage des containers...${NC}"
docker-compose up -d --build

echo -e "${YELLOW}Attente du démarrage...${NC}"
sleep 10

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    🎉 INSTALLATION TERMINÉE! 🎉               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${GREEN}Store:${NC}   http://localhost:3000"
echo -e "  ${GREEN}Admin:${NC}  http://localhost:3000/admin"
echo ""
echo -e "${YELLOW}Comptes:${NC}"
echo "  Consultez le fichier seed.js pour les identifiants par défaut"
echo ""
echo -e "${BLUE}Pour arrêter:${NC} docker-compose down"
echo -e "${BLUE}Pour voir les logs:${NC} docker-compose logs -f"

rm -rf "$TMP_DIR"