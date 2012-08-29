#!/bin/bash

echo "Starting YUI install: `pwd`"

cd "$(dirname "$0")"

echo "cd: `pwd`"

# Building NPM module
cd ../
echo "NPM Build Dir: `pwd`"
wait
echo "Installing NPM Modules"
npm install -loglevel silent
wait

# Building YUI module
cd ./yui-src/build-npm;
echo "YUI NPM Build Dir: `pwd`"
wait
echo "Installing YUI NPM Module"
npm install -loglevel silent
wait
cd ../../

# Linking YUI module
echo "Linking YUI NPM..."
wait
rm -rf ./node_modules/yui
ln -s ../yui-src/build-npm ./node_modules/yui

echo "YUI NPM Install Complete"
echo ""