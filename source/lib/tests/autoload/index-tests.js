/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-server-tests', function(Y, NAME) {

    var path = require('path'),
        vm = require('vm'),
        fs = require('fs'),
        theServer = require(path.join(__dirname, '../../index.js')),
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

        'TODO: addMojitoToExpressApp installs the static handler first': function() {
            A.skip();
//            var useCount = 0;
//            var used;
//            var app = {
//                use: function(handle) {
//                    if (useCount === 0) {
//                        used = true;
//                        A.areSame('static', handle, 'static handler was not first');
//                    }
//                    useCount++;
//                }
//            };
//
//            var SH = global.StaticHandler;
//
//            global.StaticHandler = {
//                handle: function() {
//                    return 'static';
//                }
//            };
//
//            server.addMojitoToExpressApp(app);
//
//            A.isTrue(used, "static handler was never used");
//
//            global.StaticHandler = SH;
        },

        'TODO: addMojitoToExpressApp installs the body parser second': function() {
            A.skip();

//            var useCount = 0;
//            var used;
//            var app = {
//                use: function(handle) {
//                    if (useCount === 1) {
//                        used = true;
//                        A.areSame('bodyParser', handle, 'bodyParser was not second');
//                    }
//                    useCount++;
//                }
//            };
//
//            var EX = global.express;
//
//            global.express = {
//                bodyParser: function() {
//                    return 'bodyParser';
//                },
//                cookieParser: function() {
//                    return 'cookieParser';
//                }
//            };
//
//            server.addMojitoToExpressApp(app);
//
//            A.isTrue(used, "bodyParser was never used");
//
//            global.express = EX;
        },

        'TODO: addMojitoToExpressApp installs the cookie parser third': function() {
            A.skip();

//            var useCount = 0;
//            var used;
//            var app = {
//                use: function(handle) {
//                    if (useCount === 2) {
//                        used = true;
//                        A.areSame('cookieParser', handle, 'cookieParser was not third');
//                    }
//                    useCount++;
//                }
//            };
//
//            var EX = global.express;
//
//            global.express = {
//                bodyParser: function() {
//                    return 'bodyParser';
//                },
//                cookieParser: function() {
//                    return 'cookieParser';
//                }
//            };
//
//            server.addMojitoToExpressApp(app);
//
//            A.isTrue(used, "bodyParser was never used");
//
//            global.express = EX;
        },

        'TODO: addMojitoToExpressApp installs the request contextualizer fourth': function() {
            A.skip();

//            var useCount = 0;
//            var used;
//            var app = {
//                use: function(handle) {
//                    if (useCount === 3) {
//                        used = true;
//                        A.areSame('rc', handle, 'RequestContextualizer was not fourth');
//                    }
//                    useCount++;
//                }
//            };
//
//            var RC = global.RequestContextualizer;
//
//            global.RequestContextualizer = {
//                handle: function() {
//                    return 'rc';
//                }
//            };
//
//            server.addMojitoToExpressApp(app);
//
//            A.isTrue(used, "RequestContextualizer was never used");
//
//            global.RequestContextualizer = RC;
        },

        'TODO: addMojitoToExpressApp installs the tunnel server fifth': function() {
            A.skip();
//            var useCount = 0;
//            var used;
//            var app = {
//                use: function(handle) {
//                    if (useCount === 4) {
//                        used = true;
//                        A.areSame('tc', handle, 'TunnelServer was not fifth');
//                    }
//                    useCount++;
//                }
//            };
//
//            var TC = global.TunnelServer;
//
//            global.TunnelServer = {
//                handle: function() {
//                    return 'tc';
//                }
//            };
//
//            server.addMojitoToExpressApp(app);
//
//            A.isTrue(used, "TunnelServer was never used");
//
//            global.TunnelServer = TC;
        },

        'addMojitoToExpressApp only installs 7 middlewares': function() {
            A.skip();  //FIX: this test reloads files, resetting test coverage
//            var useCount = 0;
//            var app = {
//                use: function() {
//                    useCount++;
//                }
//            };
//
//            server.addMojitoToExpressApp(app);
//
//            A.areSame(7, useCount, "Should be 7 middlewares installed");
//
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
