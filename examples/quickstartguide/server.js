/*
* Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/**
This file helps you to configure hosting environment for your mojito application.
For more info, please visit:
http://developer.yahoo.com/cocktails/mojito/docs/topics/mojito_hosting_container_reqs.html
**/

/*jslint anon:true, sloppy:true, nomen:true*/

process.chdir(__dirname);

/*
* Create the MojitoServer instance we'll interact with. Options can be passed
* using an object with the desired key/value pairs.
*/
var Mojito = require('mojito');
var app = Mojito.createServer();

// ---------------------------------------------------------------------------
// Different hosting environments require different approaches to starting the
// server. Adjust below to match the requirements of your hosting environment.
// ---------------------------------------------------------------------------

module.exports = app.listen();