#!/bin/sh -e

# usage: $0 [optional arrow args]
# run all arrow tests from cwd and just display the results

err() {
    echo "error: $2"; exit $1
}
which pgrep arrow >/dev/null || err 1 "missing executable(s)"
pgrep -f arrow_server >/dev/null || err 3 'arrow_server not running'
pgrep -f selenium >/dev/null || err 5 'selenium not running'

opts="--driver=selenium --reuseSession=true --logLevel=WARN $@"
find . -name '*descriptor.json' | xargs -t arrow $opts | egrep '^ |..32m[0-9]+'
