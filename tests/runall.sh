#!/bin/sh -ex
# -e exits on any error; exit code is preserved

fail() {
    echo $2 >&2
    exit $1
}

# bail if selenium isn't running
ps aux | egrep -q '[j]ava.+selenium' || fail 9 'no selenium server, exiting'

# get abs path to mojito base dir
basedir=$(cd $(dirname $0)/../ && pwd)

# lint
$basedir/bin/mojito jslint -p

# unit tests
$basedir/tests/run.js test -u --group server --driver nodejs
$basedir/tests/run.js test -u --group client --driver selenium

# cli tests are distinct for now; ideally these should be unit tests
$basedir/tests/run.js test -c --driver nodejs

# func tests
$basedir/tests/run.js test -f
