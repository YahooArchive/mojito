/*
* Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/**
This file is required by Manhattan hosting.
For more info, visit: 
http://devel.corp.yahoo.com/cocktails/mojito/manhattan_reqs_mojito_startup.html#mojito-v0-4-8-and-later-versions
**/

/*jslint anon:true, sloppy:true, nomen:true*/

process.chdir(__dirname);

/*
* Create the MojitoServer instance we'll interact with. Options can be passed
* using an object with the desired key/value pairs.
*/
var Mojito = require('mojito');
var app = Mojito.createServer();

module.exports = function(config, token) {
    process.emit('application-ready', token, app.getHttpServer());
};
