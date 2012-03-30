/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var mojito = require('mojito');
var app = require('express').createServer();


// add your changes here


// add mojito to the Express app
mojito.addMojitoToExpressApp(app);

// return the Express app
module.exports = app;

