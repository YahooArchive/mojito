#!/usr/bin/env node
/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

// This file is for YOU to run. chmod 755 to execute directly:
//      $ chmod 755 start.js
//      $ ./start.js
// If you want to modify your server, do it within 'server.js'

process.chdir(__dirname);

var app = require('./server.js');
app.listen(8666);

console.log('\nMojito started on http://localhost:8666');


