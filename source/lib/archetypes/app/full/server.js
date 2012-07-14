/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/


/**
 * Starts a new Mojito server instance.
 */
var mojito = require('mojito');
new mojito.constructor().createServer().listen(80);
