#!/bin/bash

echo "Starting YUI install: `pwd`"

cd "$(dirname "$0")"

echo "cd: `pwd`"

# YUI bleeding
git clone git://github.com/yui/yui3.git yui-src
wait
cd ./yui-src/
make npm
wait
cd ../

# Building YUI module
cd ./yui-src/build-npm;
echo "YUI NPM Build Dir: `pwd`"
wait
echo "Installing YUI NPM Module"
npm install -loglevel silent
wait
cd  ../../

# Linking YUI module
echo "Linking YUI NPM..."
wait
rm -rf ./mojito/node_modules/yui
ln -s ./yui-src/build-npm ./mojito/node_modules/yui

echo "YUI NPM Install Complete"
echo ""