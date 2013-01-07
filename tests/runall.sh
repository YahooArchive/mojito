#!/bin/sh -e
# -e causes sh to exit on any error; exit code is preserved

# get abs path to mojito base dir
basedir=$(cd $(dirname $0)/../ && pwd)

$basedir/bin/mojito jslint -p
$basedir/tests/run.js test -u --group server --driver nodejs
$basedir/tests/run.js test -u --group client --driver selenium
$basedir/tests/run.js test -f
