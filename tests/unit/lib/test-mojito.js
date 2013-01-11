/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, unparam: true, node:true */
/*global YUI*/

YUI().use('mojito', 'test', function (Y) {

    var suite = new Y.Test.Suite('mojito tests'),
        path = require('path'),
        A = Y.Assert,
        V = Y.Mock.Value,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,

        mojito_src = path.join(__dirname, '../../../lib/mojito'),
        Mojito = require(mojito_src),

        realServer,
        realConfig,
        realListen,
        listened,
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
                function(app, opts) {};
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
            listened = false;
            app.listen = function() {
                listened = true;
            };
        },

        tearDown: function() {
            app.listen = realListen;
        },

        'test close()': function() {
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
            Mojito.Server.prototype._configureAppInstance = realConfig;
        },

        'configure YUI': function() {
            var mockY,
                mockStore,
                load = [],
                haveConfig,
                wantConfig,
                res;

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

            res = server._configureYUI(mockY, mockStore, load);
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

    suite.add(new Y.Test.Case({
        name: 'makeMwList suite',
        setUp: function() {},
        tearDown: function() {},

        'test makeMwList, no app mw': function () {
            var actual,
                expected,
                mojito_list = ['mojito-mw1', 'mojito-mw2', 'mojito-mw3'];

            actual = Mojito.Server.prototype._makeMwList([], mojito_list);
            expected = ['mojito-mw1', 'mojito-mw2', 'mojito-mw3'];
            AA.itemsAreEqual(expected, actual);

        },

        'test makeMwList, some generic app mw': function () {
            var actual,
                expected,
                app_list = ['chocolate', 'vanilla', 'strawberry'],
                mojito_list = ['mojito-mw1', 'mojito-mw2', 'mojito-mw3'];

            actual = Mojito.Server.prototype._makeMwList(app_list, mojito_list);
            expected = app_list.concat(mojito_list);
            AA.itemsAreEqual(expected, actual);
        },

        'test makeMwList, some generic app mw by path': function () {
            var actual,
                expected,
                app_list = ['/foo/chocolate', './bar/vanilla', '../baz/strawberry'],
                mojito_list = ['mojito-mw1', 'mojito-mw2', 'mojito-mw3'];

            actual = Mojito.Server.prototype._makeMwList(app_list, mojito_list);
            expected = app_list.concat(mojito_list);
            AA.itemsAreEqual(expected, actual);
        },

        'test makeMwList, app mw w/ custom mojito-*': function () {
            var actual,
                expected = ['chocolate', 'mojito-mint', 'vanilla'],
                app_list = ['chocolate', 'mojito-mint', 'vanilla'],
                mojito_list = ['mojito-mw1', 'mojito-mw2', 'mojito-mw3'];

            actual = Mojito.Server.prototype._makeMwList(app_list, mojito_list);
            AA.itemsAreEqual(expected, actual);
        }

    }));

    suite.add(new Y.Test.Case({
        name: '_useMw suite',
        setUp: function() {},
        tearDown: function() {},

        'test _useMw, app mw w/ custom mojito-*': function () {
            var actual,
                mw = ['chocolate', 'mojito-mint', '/foo/mojito-cherry', 'vanilla'],
                mockapp = Y.Mock();

            Y.Mock.expect(mockapp, {
                method: 'use',
                parameters: [V.String]
            });

            function disp(something) {
                A.isNotUndefined(something);
            }

            try {
                Mojito.Server.prototype._useMw(mockapp, disp, {}, {}, mw);
            } catch (err) {
            }
        }

    }));

    suite.add(new Y.Test.Case({
        name: 'listen test hack',
        
        'test listen 1': function () {
            var port = 1234,
                host = 'letterman',
                cb,
                app = Y.Mock();

            cb = function(err, app) {
            	
            }

            this._startupTime = +new Date();
            this._options = {verbose: true};

            Y.Mock.expect(app, {
            	method: 'listen',
            	arguments: [port, host, cb]
            });

        	Mojito.Server.prototype.listen.call(this, port, host, cb);
        },

        'test listen 2': function () {
            var port = 1234,
                host = 'letterman',
                cb,
                app = Y.Mock();

            cb = function(err, app) {
            	A.isObject(err);
            	A.isUndefined(app);
            	A.areSame("TypeError: Cannot call method 'listen' of undefined", err.toString());
            }

            this._startupTime = null;
            this._options = {verbose: false};

            Y.Mock.expect(app, {
            	method: 'listen',
            	arguments: [port, host, cb]
            });

        	Mojito.Server.prototype.listen.call(this, port, host, cb);
        },

        'test listen 3': function () {
            var port = 1234,
                host = 'letterman',
                app = Y.Mock();

            this._startupTime = null;
            this._options = {verbose: false};

            Y.Mock.expect(app, {
            	method: 'listen',
            	arguments: [port, host, cb]
            });

        	Mojito.Server.prototype.listen.call(this, port, host, null);
        },

        'test listen 3': function () {
            var port = 1234,
                host = 'letterman',
                cb = function(err, app) {},
                app = Y.Mock();

            Y.Mock.expect(app, {
            	method: 'listen',
            	arguments: [port, host, cb]
            });

        	Mojito.Server.prototype.listen.call(this, port, host, cb);

            this._startupTime = null;
        	Mojito.Server.prototype.listen.call(this, port, host, cb);
        }

    }));

    suite.add(new Y.Test.Case({
        name: '_configureAppInstance suite',

        'test configureAppInstance': function () {
            A.isTrue(true);        
        },

        'test configureAppInstance': function () {
            var appwtf = {
                    store: {
                        getAppConfig: function() {
                            A.isTrue(true);
                            return {
                                debugMemory: true,
                                middleware: ['mojito-router'],
                                perf: {}
                            };
                        },
                        getStaticContext: function(){
                            A.isTrue(true);
                        },
                        yui: {
                            getConfigAllMojits: function() {
                                return {};
                            },
                            getConfigShared: function() {
                                return {};
                            },
                        }
                     },
                    use: function() {}
                };

            Y.namespace('mojito.Dispatcher').init = function(store) {
                Y.isObject(store);
                return {
                    dispatch: function (cmd, outputHandler) {}
                };
            }

            try {
                Mojito.Server.prototype._configureAppInstance(appwtf);
            } catch (err) {}
        }

    }));

    Y.Test.Runner.add(suite);
});
