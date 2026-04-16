#!/bin/bash
set -e

echo "Deployment started ... ⏳⏳"

cd ~/

# copy the .env files
cp ~/frontend.env ~/Shree_Krishna_Bakers_2.0/frontend/.env
cp ~/backend.env ~/Shree_Krishna_Bakers_2.0/backend/.env

# go into repo FIRST
cd ~/Shree_Krishna_Bakers_2.0

# Pull latest code
git pull origin main
echo "Pulled successfully 👌"

echo "going for frontend"
cd frontend

echo "Installing Frontend Dependencies... ⏳"
npm install --yes
echo "Frontend Dependencies Installed 👌"

echo "Building Frontend... ⏳"
npm run build
echo "Frontend Built 👌"

echo "going for backend"
cd ../backend

echo "Installing Backend Dependencies... ⏳"
npm install --yes
echo "Backend Dependencies Installed 👌"

echo "Server Starting... ✨✨✨"
pm2 restart server || pm2 start server.js --name server
pm2 save