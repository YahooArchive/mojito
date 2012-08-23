/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito', 'test', function (Y) {

    var suite = new Y.Test.Suite('mojito tests'),
        path = require('path'),
        A = Y.Assert,
        OA = Y.ObjectAssert,
        Mojito = require(path.join(__dirname, '../../../lib/mojito')),
        realServer,
        realConfig;

    suite.add(new Y.Test.Case({

        name: 'Mojito',

        setUp: function() {
            // Save original server type so we can mock it in tests.
            realServer = Mojito.Server;
        },

        tearDown: function() {
            // Restore the original server type.
            Mojito.Server = realServer;
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
            var server;

            // Mock the server to avoid YUI loader/Resource store issues.
            Mojito.Server = function() {};

            server = Mojito.createServer();
            A.isObject(server);
            A.isInstanceOf(Mojito.Server, server);
        },

        'createServer() properly passes options': function() {
            var passed,
                options,
                server;

            // Mock the server type and capture options.
            Mojito.Server = function(options) {
                passed = options;
            };

            options = {'port': 2222};

            server = Mojito.createServer(options);
            OA.areEqual(options, passed);
        },

        'Mojito.include() SKIPPED - can not mock require()': function() {
            // Can't test include since it is a pure wrapper for require() which
            // is provided "module specific" by the loader.
        }
    }));

    suite.add(new Y.Test.Case({

        name: 'Mojito.Server',

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

        'Mojito.Server() creates an express server instance': function() {
            var instance;

            instance = new Mojito.Server();
            A.isObject(instance._app);
        },

        'setLogFormatter() accepts a log formatter': function() {
            var server,
                func;

            server = new Mojito.Server();
            func = function() {};
            server.setLogFormatter(func);

            OA.areEqual(func, server._logFormatter);
        },

        'setLogPublisher() accepts a log publisher': function() {
            var server,
                func;

            server = new Mojito.Server();
            func = function() {};
            server.setLogPublisher(func);

            OA.areEqual(func, server._logPublisher);
        },

        'setLogWriter() accepts a log writer': function() {
            var server,
                func;

            server = new Mojito.Server();
            func = function() {};
            server.setLogWriter(func);

            OA.areEqual(func, server._logWriter);
        }

    }));

    Y.Test.Runner.add(suite);
});
