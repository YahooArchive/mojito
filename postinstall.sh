#!/bin/sh
npm=$(which npm ynpm | grep ^/ | head -1)
global_prefix=$($npm prefix -g)
global_mojitolib=$global_lib/lib/node_modules/mojito
current_prefix=$($npm prefix)

if [[ $global_prefix = $current_prefix && -d $global_mojitolib ]]
then
    cat <<FOO >&2
mojito: You have installed mojito globally (i.e. "npm install --global mojito").
mojito: Installing mojito globally is deprecated. Instead you should install
mojito: the package "mojito-cli" (i.e. "npm install --global mojito-cli").
mojito: Note that usage of the "mojito" command from the command line should be
mojito: unchanged.

FOO

fi
