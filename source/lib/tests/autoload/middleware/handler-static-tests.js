/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-middleware-handler-static-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        path = require('path'),
        staticHandler = require(path.join(__dirname, '../../../app/middleware/mojito-handler-static'));

}, '0.0.1');
