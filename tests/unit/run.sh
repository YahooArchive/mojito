#!/bin/bash

curr_dir=`pwd`
echo $curr_dir

SELENIUMDIR=$1
REPORTDIR=$2

echo "selenium jar file dir: $SELENIUMDIR"
echo "report dir: $REPORTDIR"

arrow_server &
java -jar $SELENIUMDIR/selenium-server-standalone-2.22.0.jar &
sleep 10
arrow_selenium --open=firefox
status=$?
if [ "$?" = "0" ]; then
    cd $curr_dir
    arrow unit-test-descriptor.json --browser=reuse --report=true --reportFolder=$REPORTDIR
else
    exit 1
fi

