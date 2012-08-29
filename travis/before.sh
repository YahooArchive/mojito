#!/bin/bash

echo "Before Script: `pwd`"

cd "$(dirname "$0")"

echo "cd: `pwd`"

if [ -n "$TRAVIS" ]; then
    echo "Installing Shifter.."
    npm -g install shifter -loglevel silent
fi

# YUI bleeding
cd ../
echo "Cloning YUI Repository"
git clone git://github.com/yui/yui3.git yui-src
wait
cd ./yui-src/src/yui
echo "Making YUI NPM Module"
make npm
wait
