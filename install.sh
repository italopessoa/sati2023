#!/bin/bash
echo "install node"
touch .bashrc
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. /.nvm/nvm.sh
nvm install --lts

echo "install dependencies"
npm install

# run node in background
echo "start pm2"
npm install pm2@latest -g
pm2 start server.js
