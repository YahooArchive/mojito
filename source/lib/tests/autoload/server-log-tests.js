/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-server-log-tests', function(Y, NAME) {

    var path = require('path'),
        suite = new YUITest.TestSuite(NAME),
        serverLog = require(path.join(__dirname, '../../server-log'));

}, '0.0.1');
