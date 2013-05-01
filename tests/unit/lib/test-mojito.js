/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, unparam: true, node:true */
/*global YUI*/

YUI().use('mojito', 'mojito-test-extra', 'test', function (Y) {

    var suite = new Y.Test.Suite('mojito tests'),
        path = require('path'),
        A = Y.Assert,
        V = Y.Mock.Value,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,

        mojito_src = Y.MOJITO_DIR + 'lib/mojito',
        Mojito = require(mojito_src),

        realServer,
        realConfig,
        realListen,
        listened,
        server,
        app;

    // workaround for issue with arrow when isatty===false
    process.stdout.isTTY = true;

    suite.add(new Y.Test.Case({

        name: 'Mojito object interface tests',

        setUp: function () {
            // Save original server type so we can mock it in tests.
            realServer = Mojito.Server;
        },

        tearDown: function () {
            // Restore the original server type.
            Mojito.Server = realServer;
            server = null;
        },

        'Mojito object is returned from require()': function () {
            A.isObject(Mojito);
        },

        'Mojito has a MOJITO_INIT timestamp': function () {
            A.isNumber(Mojito.MOJITO_INIT);
        },

        'Mojito.Server is a constructor function': function () {
            A.isFunction(Mojito.Server);
        },

        'Mojito.Server is returned from createServer': function () {

            // Mock the server to avoid YUI loader/Resource store issues.
            Mojito.Server = function () {};

            server = Mojito.createServer();
            A.isObject(server);
            A.isInstanceOf(Mojito.Server, server);
        },

        'createServer() properly passes options': function () {
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

        setUp: function () {
            // Mock the configure function so majority of tests don't have to.
            realConfig = Mojito.Server.prototype._configureAppInstance;
            Mojito.Server.prototype._configureAppInstance =
                function(app, opts) {};
        },

        tearDown: function () {
            // Restore the original configure function.
            Mojito.Server.prototype._configureAppInstance = realConfig;
        },

        'new Mojito.Server() creates an express server instance': function () {
            server = new Mojito.Server();
            A.isObject(server._app);
        },

        'new Mojito.Server() defaults options properly': function () {
            server = new Mojito.Server();
            A.isObject(server._options);
        },

        'new Mojito.Server() accepts options properly': function () {
            var options = {
                    port: 2222
                };

            server = new Mojito.Server(options);
            A.areEqual(server._options.port, 2222);
        },

        'new Mojito.Server() defaults port properly': function () {
            process.env.PORT = 2222;
            server = new Mojito.Server();
            A.areEqual(server._options.port, 2222);
        }

    }));

    suite.add(new Y.Test.Case({

        name: 'Mojito.Server start/stop tests',

        setUp: function () {
            // Mock the configure function so majority of tests don't have to.
            realConfig = Mojito.Server.prototype._configureAppInstance;
            Mojito.Server.prototype._configureAppInstance =
                function(app, opts) {};

            server = new Mojito.Server();
            app = server._app;
            realListen = app.listen;
            listened = false;
            app.listen = function () {
                listened = true;
            };
        },

        tearDown: function () {
            // Restore the original configure function.
            Mojito.Server.prototype._configureAppInstance = realConfig;

            app.listen = realListen;
        },

        'test close()': function () {
            var closed = false,
                closer;

            closer = app.close;
            app.close = function () {
                closed = true;
            };

            server.close();
            A.isTrue(closed);

            app.close = closer;
        },

        'Constructor configures the application instance': function () {
            var configured = false;

            Mojito.Server.prototype._configureAppInstance = function () {
                configured = true;
            };

            server = new Mojito.Server();
            A.isTrue(configured);
        },

        'configure YUI': function () {
            var mockY,
                mockStore,
                load,
                haveConfig,
                wantConfig;

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
                    getModulesConfig: function () {
                        return {
                            modules: {
                                'mojits-A': 'mojits-A-val',
                                'mojits-B': 'mojits-B-val'
                            }
                        };
                    },
                    getConfigShared: function () {
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

            load = server._configureYUI(mockY, mockStore);
            A.isArray(load);

            A.areSame(4, load.length);
            AA.contains('mojits-A', load);
            AA.contains('mojits-B', load);
            AA.contains('lang/datatype-date-format_xx-00', load);
            AA.contains('lang/datatype-date-format_yy-11', load);

            wantConfig = {
                modules: {
                    'mojits-A': 'mojits-A-val',
                    'mojits-B': 'mojits-B-val'
                }
            };
            Y.TEST_CMP(wantConfig, haveConfig);
        }

    }));

    suite.add(new Y.Test.Case({
        name: '_makeMiddewareList suite',
        setUp: function () {},
        tearDown: function () {},

        'test makeMwList, no app mw': function () {
            var actual,
                expected,
                mojito_list = ['mojito-mw1', 'mojito-mw2', 'mojito-mw3'];

            actual = Mojito.Server.prototype._makeMiddewareList([], mojito_list);
            expected = ['mojito-mw1', 'mojito-mw2', 'mojito-mw3'];
            AA.itemsAreEqual(expected, actual);

        },

        'test makeMwList, some generic app mw': function () {
            var actual,
                expected,
                app_list = ['chocolate', 'vanilla', 'strawberry'],
                mojito_list = ['mojito-mw1', 'mojito-mw2', 'mojito-mw3'];

            actual = Mojito.Server.prototype._makeMiddewareList(app_list, mojito_list);
            expected = app_list.concat(mojito_list);
            AA.itemsAreEqual(expected, actual);
        },

        'test makeMwList, some generic app mw by path': function () {
            var actual,
                expected,
                app_list = ['/foo/chocolate', './bar/vanilla', '../baz/strawberry'],
                mojito_list = ['mojito-mw1', 'mojito-mw2', 'mojito-mw3'];

            actual = Mojito.Server.prototype._makeMiddewareList(app_list, mojito_list);
            expected = app_list.concat(mojito_list);
            AA.itemsAreEqual(expected, actual);
        },

        'test makeMwList, app mw w/ custom mojito-*': function () {
            var actual,
                expected = ['chocolate', 'mojito-mint', 'vanilla'],
                app_list = ['chocolate', 'mojito-mint', 'vanilla'],
                mojito_list = ['mojito-mw1', 'mojito-mw2', 'mojito-mw3'];

            actual = Mojito.Server.prototype._makeMiddewareList(app_list, mojito_list);
            AA.itemsAreEqual(expected, actual);
        }

    }));

    suite.add(new Y.Test.Case({
        name: '_useMiddleware suite',
        setUp: function () {},
        tearDown: function () {},

        'test _useMiddleware, app mw w/ custom mojito-*': function () {
            var actual,
                mw = ['chocolate', 'mojito-mint', 'foo/mojito-cherry', 'vanilla'],
                mockapp = Y.Mock();

            Y.Mock.expect(mockapp, {
                method: 'use',
                parameters: [V.String]
            });

            function disp(something) {
                A.isNotUndefined(something);
            }

            try {
                Mojito.Server.prototype._useMiddleware(mockapp, disp, {}, {}, mw);
            } catch (err) {
            }
        }

    }));

    suite.add(new Y.Test.Case({
        name: 'listen test hack',

        'test listen 1': function () {
            var port = 1234,
                host = 'letterman',
                app = Y.Mock(),
                this_scope = {
                    _startupTime: 1358377484874,
                    _options: {verbose: true}
                },
                actual;

            actual = Mojito.Server.prototype.listen.call(this_scope, port, host, null);
            A.isUndefined(actual);
        },

        'test listen 2': function () {
            var port = 1234,
                host = 'letterman',
                cb,
                app = Y.Mock(),
                this_scope = {
                    _startupTime: null,
                    _options: {verbose: false}
                };

            cb = function(err, app) {};

            Y.Mock.expect(app, {
                method: 'listen',
                args: [port, host, V.Function]
            });

            this_scope._app = app;
            Mojito.Server.prototype.listen.call(this_scope, port, host, cb);

            Y.Mock.verify(app);
        },

        'test listen 3': function () {
            var port = 1234,
                host = 'letterman',
                app = Y.Mock(),
                this_scope = {
                    _startupTime: null,
                    _options: {verbose: false}
                };

            Y.Mock.expect(app, {
                method: 'listen',
                args: [port, host, V.Function]
            });

            this_scope._app = app;
            Mojito.Server.prototype.listen.call(this_scope, port, host, null);

            Y.Mock.verify(app);
        },

        'test listen 4': function () {
            var this_scope = {
                    _startupTime: null,
                    _options: {
                        verbose: false,
                        port: 9876,
                        host: 'conan'
                    }
                },
                actual;

            actual = Mojito.Server.prototype.listen.call(this_scope);
            A.isUndefined(actual);
        },


        'test listen 5': function () {
            var app = Y.Mock(),
                this_scope = {
                    _startupTime: null,
                    _options: {verbose: false}
                };

            Y.Mock.expect(app, {
                method: 'listen',
                args: [this_scope._options.port, this_scope._options.host, V.Function]
            });

            this_scope._app = app;

            Mojito.Server.prototype.listen.call(this_scope);
            Y.Mock.verify(app);
        },

        'test listen 6': function () {
            var port = 1234,
                host = 'letterman',
                this_scope = {
                    _startupTime: null,
                    _options: {verbose: false},
                    _app: {
                        listen: function(p, h, cb) {
                            A.areSame(port, p);
                            A.areSame(host, h);
                            A.isFunction(cb);
                            cb('fake error');
                        }
                    }
                };

            function handlerCb(err) {
                A.areSame('fake error', err);
            }

            Mojito.Server.prototype.listen.call(this_scope, port, host, handlerCb);
        },

        'test listen 7': function () {
            var port = 1234,
                host = 'letterman',
                cb = function(err, app) {},
                app = Y.Mock(),
                this_scope = {
                    _startupTime: null,
                    _options: {verbose: false},
                    _app: 'mocked'
                };

            Y.Mock.expect(app, {
                method: 'listen',
                args: [port, host, cb]
            });

            this_scope._app = app;
            Mojito.Server.prototype.listen.call(this_scope, port, host, cb);

            Y.Mock.verify(app);
        }

    }));

    suite.add(new Y.Test.Case({
        name: 'getWebPage tests',

        'test getWebPage 1': function () {
            var path = '??',
                this_scope = {
                    _startupTime: null,
                    _options: {
                        port: 9999999,
                        verbose: false
                    }
                };

            function cb(err, uri) {
                // this is not a good idea...
                A.areSame('ECONNREFUSED', err.code);
            }

            Mojito.Server.prototype.getWebPage.call(this_scope, path, {a: 1}, cb);
        },

        'test getWebPage 1.1': function () {
            var path = '??',
                this_scope = {
                    _startupTime: null,
                    _options: {
                        port: 9999999,
                        verbose: false
                    }
                };

            function cb(err, uri) {
                // this is not a good idea...
                A.areSame('ECONNREFUSED', err.code);
            }

            Mojito.Server.prototype.getWebPage.call(this_scope, null, cb);
            Mojito.Server.prototype.getWebPage.call(this_scope, [], cb);
        },

        'test getWebPage 1.2': function () {
            var path = '??',
                this_scope = {
                    _startupTime: null,
                    _options: {
                        port: 9999999,
                        verbose: false
                    }
                };

            function cb(err, uri) {
                // this is not a good idea...
                A.areSame('ECONNREFUSED', err.code);
            }

            Mojito.Server.prototype.getWebPage.call(this_scope, '', {});
        },

        'test getWebPage 2': function () {
            var path = '??',
                this_scope = {
                    _startupTime: null,
                    _options: {
                        port: 9999999,
                        verbose: false
                    }
                };

            function cb(err, uri) {
                // this is not a good idea...
                A.areSame('ECONNREFUSED', err.code);
            }

            Mojito.Server.prototype.getWebPage.call(this_scope, path, cb);
        },

        'test getWebPages': function () {
            var path = '??',
                this_scope = {
                    _startupTime: null,
                    _options: {
                        port: 999999,
                        verbose: false
                    }
                };

            function cb(err, uri) {
                A.areSame('oh noes.', err);
            }

            this_scope.getWebPage = function (uri, cb) {
                A.areSame('??', uri);
                A.isFunction(cb);
                cb('oh noes.');
            };

            Mojito.Server.prototype.getWebPages.call(this_scope, [path], cb);
        }
    }));

    suite.add(new Y.Test.Case({
        name: 'sm fn tests',

        'test getHttpServer': function () {
            var actual,
                expected = 'oh hai!',
                this_scope = {
                    _startupTime: null,
                    _options: {
                        port: 99999999,
                        verbose: true
                    }
                };

            this_scope._app = expected;

            actual = Mojito.Server.prototype.getHttpServer.call(this_scope);
            A.areSame(expected, actual);
        },

        'test _configureLogger': function () {
            var o = Y.Mock();

            o.config = {
                logLevel: null,
                logLevelOrder: ['info', 'error'],
                debug: true
            };

            o.Lang = Y.Lang;

            Y.Mock.expect(o, {
                method: 'use',
                args: ['base']
            });

            Y.Mock.expect(o, {
                method: 'applyConfig',
                args: [Y.Mock.Value.Object]
            });

            Y.Mock.expect(o, {
                method: 'on',
                args: ['yui:log', Y.Mock.Value.Function],
                run: function (name, fn) {
                    A.isTrue(fn({
                        cat: 'error',
                        msg: 'error message'
                    }));
                }
            });

            Mojito.Server.prototype._configureLogger(o);

            Y.Mock.verify(o);
        },

        'test close': function () {
            var actual,
                expected = 'oh hai!',
                this_scope = {
                    _startupTime: null,
                    _options: {
                        port: 99999999,
                        verbose: true
                    }
                };

            this_scope._app = Y.Mock();

            Y.Mock.expect(this_scope._app, {
                method: 'close',
                args: []
            });

            Mojito.Server.prototype.close.call(this_scope);
            Y.Mock.verify(this_scope._app);
        }
    }));

    suite.add(new Y.Test.Case({
        name: '_configureAppInstance suite',

        'test configureAppInstance': function () {
            var dispatcher,
                madeY,      // the Y instance made in mojito.js
                appwtf = {
                    store: {
                        getAllURLDetails: function () {
                            return {};
                        },
                        getAppConfig: function () {
                            A.isTrue(true);
                            return {
                                middleware: ['mojito-handler-dispatcher']
                            };
                        },
                        getStaticAppConfig: function () {
                            return {
                                perf: true,
                                middleware: ['mojito-handler-dispatcher']
                            };
                        },
                        getStaticContext: function () {
                            A.isTrue(true);
                        },
                        yui: {
                            getConfigShared: function () {
                                return {};
                            },
                            getModulesConfig: function () {
                                return {
                                    modules: {
                                        'mojito-hooks': {
                                            fullpath: __dirname + '/../../base/mojito-test.js'
                                        },
                                        'mojito-dispatcher': {
                                            fullpath: __dirname + '/../../base/mojito-test.js'
                                        }
                                    }
                                };
                            },
                            getYUIURLDetails: function () {
                                return {};
                            }
                        }
                    },
                    use: function (x) {
                        dispatcher = x;
                    }
                };

            Mojito.Server.prototype._configureLogger = function(y) {
                madeY = y;
            };
            Mojito.Server.prototype._configureAppInstance(appwtf);
            dispatcher({command: {}}, {}, function() {});
            A.isObject(madeY.mojito.Dispatcher.outputHandler, 'output handler object');
            A.isObject(madeY.mojito.Dispatcher.outputHandler.page, 'page object');
            A.isObject(madeY.mojito.Dispatcher.outputHandler.page.staticAppConfig, 'staticAppConfig object');
        }

    }));

    Y.Test.Runner.add(suite);
});
