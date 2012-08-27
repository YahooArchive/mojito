/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-server-tests', function(Y, NAME) {

    var path = require('path'),
        vm = require('vm'),
        fs = require('fs'),
        theServer = require(path.join(__dirname, '../../../lib/index.js')),
        MojitoServer = theServer.constructor,
        server,
        suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        OA = YUITest.ObjectAssert;

    suite.add(new YUITest.TestCase({

        name: 'HTTP server',

        setUp: function() {
            server = new MojitoServer();
        },

        tearDown: function() {
            server = null;
        },

        'MojitoServer object is returned from require()': function() {
            A.isObject(theServer);
        },

        'createServer creates an express app, installs it, and returns it': function() {
            var appInstalled;
            server.addMojitoToExpressApp = function(a) {
                appInstalled = true;
                // TODO: figure out how to test that this is a connect app
                A.isObject(a, 'no app!');
            };

            var app = server.createServer();

            A.isTrue(appInstalled, "app wasn't installed");
        },

        'setLogFormatter() accepts a log formatter': function() {
            server.setLogFormatter("myVal");
            A.areEqual("myVal", server._logFormatter, "setLogFormatter() did not set the expected private property");
        },

        'setLogPublisher() accepts a log publisher': function() {
            server.setLogPublisher("myVal");
            A.areEqual("myVal", server._logPublisher, "setLogPublisher() did not set the expected private property");
        },

        'setLogWriter() accepts a log writer': function() {
            server.setLogWriter("myVal");
            A.areEqual("myVal", server._logWriter, "setLogWriter() did not set the expected private property");
        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1');
