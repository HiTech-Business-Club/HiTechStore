#!/bin/bash

# Configuration
APP_NAME="hitechstore"
DEPLOY_PATH="/var/www/$APP_NAME"
GIT_REPO="your-git-repo-url"
BRANCH="main"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting deployment process...${NC}"

# Create deployment directory if it doesn't exist
if [ ! -d "$DEPLOY_PATH" ]; then
    sudo mkdir -p $DEPLOY_PATH
    sudo chown $USER:$USER $DEPLOY_PATH
fi

# Navigate to deployment directory
cd $DEPLOY_PATH

# Backup current version if exists
if [ -d "current" ]; then
    echo "Backing up current version..."
    mv current "backup_$(date +%Y%m%d_%H%M%S)"
fi

# Clone repository
echo "Cloning repository..."
git clone -b $BRANCH $GIT_REPO current
cd current

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install --production

# Build frontend
echo "Building frontend..."
cd ../frontend
npm install
npm run build

# Copy environment files
echo "Setting up environment files..."
cp .env.example .env
# Here you would typically update .env with production values

# Start/Restart services
echo "Restarting services..."
pm2 delete $APP_NAME || true
pm2 start backend/server.js --name $APP_NAME

# Verify deployment
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment completed successfully!${NC}"
    echo "Application is now running on PM2 as '$APP_NAME'"
else
    echo -e "${RED}Deployment failed!${NC}"
    exit 1
fi

# Clean up old backups (keep last 5)
cd $DEPLOY_PATH
ls -dt backup_* | tail -n +6 | xargs -r rm -rf

echo "Deployment process finished!"
