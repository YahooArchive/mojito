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
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,
        Mojito = require(path.join(__dirname, '../../../lib/mojito')),
        realServer,
        realConfig,
        realListen,
        server,
        app;

    function cmp(x, y, msg) {
        var i;
        if (Y.Lang.isArray(x)) {
            A.isArray(x, msg || 'first arg should be an array');
            A.isArray(y, msg || 'second arg should be an array');
            A.areSame(x.length, y.length, msg || 'arrays are different lengths');
            for (i = 0; i < x.length; i += 1) {
                cmp(x[i], y[i], msg);
            }
            return;
        }
        if (Y.Lang.isObject(x)) {
            A.isObject(x, msg || 'first arg should be an object');
            A.isObject(y, msg || 'second arg should be an object');
            A.areSame(Object.keys(x).length, Object.keys(y).length, msg || 'object keys are different lengths');
            for (i in x) {
                if (x.hasOwnProperty(i)) {
                    cmp(x[i], y[i], msg);
                }
            }
            return;
        }
        A.areSame(x, y, msg || 'args should be the same');
    }

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
            };
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
            };

            server = new Mojito.Server();
            A.isTrue(configured);
        },

        'configure YUI': function() {
            var mockY, mockStore, load = [];
            var haveConfig, wantConfig;
            mockY = {
                merge: Y.merge,
                applyConfig: function(cfg) {
                    haveConfig = cfg;
                }
            };
            mockStore = {
                yui: {
                    langs: {
                        'xx-00': true,
                        'yy-11': true
                    },
                    getConfigAllMojits: function() {
                        return {
                            modules: {
                                'mojits-A': 'mojits-A-val',
                                'mojits-B': 'mojits-B-val'
                            }
                        };
                    },
                    getConfigShared: function() {
                        return {
                            modules: {
                                'shared-A': 'shared-A-val',
                                'shared-B': 'shared-B-val'
                            }
                        };
                    }
                }
            };

            A.isFunction(server._configureYUI);

            var res = server._configureYUI(mockY, mockStore, load);
            A.isUndefined(res);

            A.areSame(6, load.length);
            AA.contains('mojits-A', load);
            AA.contains('mojits-B', load);
            AA.contains('shared-A', load);
            AA.contains('shared-B', load);
            AA.contains('lang/datatype-date-format_xx-00', load);
            AA.contains('lang/datatype-date-format_yy-11', load);

            wantConfig = {
                modules: {
                    'mojits-A': 'mojits-A-val',
                    'mojits-B': 'mojits-B-val',
                    'shared-A': 'shared-A-val',
                    'shared-B': 'shared-B-val'
                }
            };
            cmp(wantConfig, haveConfig);
        }

    }));

    Y.Test.Runner.add(suite);
});
