#!/bin/bash
echo "install dependencies"
npm install

# run node in background
echo "start pm2"
npm install pm2@latest -g
pm2 start server.js
