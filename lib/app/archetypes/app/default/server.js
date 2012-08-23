/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/


/**
 * Create and start a new Mojito server/application.
 */
var Mojito = require('mojito');
var app = Mojito.createServer();

module.exports = app.start();
