#!/bin/sh -ex
# -e exits on any error; exit code is preserved

fail() {
    echo $2 >&2
    exit $1
}

# bail if selenium isn't running
ps aux | egrep -q '[j]ava.+selenium' || fail 9 'no selenium server, exiting'

# tests subdir
cd $(dirname $0)

test=$1
echo "running test: $test"

if [ "$test" = "unit" ] 
then

# lint
../bin/mojito jslint -p

# unit tests
../tests/run.js test -u --reuseSession --path unit

else
# func tests
../tests/run.js test -f --path func --reuseSession
fi
