/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var m = require('mojito');

// you can access log formatter, writer, or publisher for the server here

//m.setLogPublisher(function() {
//    console.log(arguments);
//});

module.exports = m.createServer();
