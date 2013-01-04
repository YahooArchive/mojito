#!/usr/bin/env node
/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

// This file is for YOU to run. chmod 755 to execute directly:
//      $ chmod 755 start.js
//      $ ./start.js
// If you want to modify your server, do it within 'server.js'

process.chdir(__dirname);

var app = require('./server.js');

console.log('Mojito application "server_side" running on port 8666.');
app.listen(8666);
