/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true */
/*global YUI*/

YUI().use('mojito', 'test', function (Y) {

    var suite = new Y.Test.Suite('mojito tests'),
        path = require('path'),
        A = Y.Assert,
        OA = Y.ObjectAssert,
        Mojito = require(path.join(__dirname, '../../../lib/mojito')),
        noop = function() {},
        realServer,
        realConfig,
        realListen,
        server,
        app;

    suite.add(new Y.Test.Case({

        name: 'Mojito object interface tests',

        setUp: function() {
            // Save original server type so we can mock it in tests.
            realServer = Mojito.Server;
        },

        tearDown: function() {
            // Restore the original server type.
            Mojito.Server = realServer;
            server = null;
        },

        'Mojito object is returned from require()': function() {
            A.isObject(Mojito);
        },

        'Mojito has a MOJITO_INIT timestamp': function() {
            A.isNumber(Mojito.MOJITO_INIT);
        },

        'Mojito.Server is a constructor function': function() {
            A.isFunction(Mojito.Server);
        },

        'Mojito.Server is returned from createServer': function() {

            // Mock the server to avoid YUI loader/Resource store issues.
            Mojito.Server = function() {};

            server = Mojito.createServer();
            A.isObject(server);
            A.isInstanceOf(Mojito.Server, server);
        },

        'createServer() properly passes options': function() {
            var passed,
                options;

            // Mock the server type and capture options.
            Mojito.Server = function(options) {
                passed = options;
            };

            options = {'port': 2222};

            server = Mojito.createServer(options);
            OA.areEqual(options, passed);
        }

    }));

    suite.add(new Y.Test.Case({

        name: 'Mojito.Server general interface tests',

        setUp: function() {
            // Mock the configure function so majority of tests don't have to.
            realConfig = Mojito.Server.prototype._configureAppInstance;
            Mojito.Server.prototype._configureAppInstance =
                function(app, opts) {
                };
        },

        tearDown: function() {
            // Restore the original configure function.
            Mojito.Server.prototype._configureAppInstance = realConfig;
        },

        'new Mojito.Server() creates an express server instance': function() {
            server = new Mojito.Server();
            A.isObject(server._app);
        },
        
        'new Mojito.Server() defaults options properly': function() {
            server = new Mojito.Server();
            A.isObject(server._options);
        },
        
        'new Mojito.Server() accepts options properly': function() {
            var options = {
                    port: 2222
                };

            server = new Mojito.Server(options);
            A.areEqual(server._options.port, 2222);
        },
 
        'new Mojito.Server() defaults port properly': function() {
            process.env.PORT = 2222;
            server = new Mojito.Server();
            A.areEqual(server._options.port, 2222);
        },

        'setLogFormatter() accepts a log formatter': function() {
            server = new Mojito.Server();
            server.setLogFormatter(noop);

            OA.areEqual(noop, server._logFormatter);
        },

        'setLogPublisher() accepts a log publisher': function() {
            server = new Mojito.Server();
            server.setLogPublisher(noop);

            OA.areEqual(noop, server._logPublisher);
        },

        'setLogWriter() accepts a log writer': function() {
            server = new Mojito.Server();
            server.setLogWriter(noop);

            OA.areEqual(noop, server._logWriter);
        }
    }));

    suite.add(new Y.Test.Case({

        name: 'Mojito.Server start/stop tests',

        setUp: function() {
            server = new Mojito.Server();
            app = server._app;
            realListen = app.listen;
            app.listen = function() {
                listened = true;
            }
        },

        tearDown: function() {
            app.listen = realListen;
        },

        'close() ': function() {
            var closed = false,
                closer;

            closer = app.close;
            app.close = function() {
                closed = true;
            };

            server.close();
            A.isTrue(closed);

            app.close = closer;
        },

        'Constructor configures the application instance': function() {
            var configured = false;

            Mojito.Server.prototype._configureAppInstance = function() {
                configured = true;
            }

            server = new Mojito.Server();
            A.isTrue(configured);
        },

    }));

    Y.Test.Runner.add(suite);
});
