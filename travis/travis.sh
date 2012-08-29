#!/bin/bash

echo "Starting a Travis Build"

cd "$(dirname "$0")"

cd ../

./travis/before.sh
wait
./travis/install.sh
wait
npm test