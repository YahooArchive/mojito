/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-debug-api', 'mojito-test-extra', 'test', function(Y) {
    var path = require('path'),
        suite = new YUITest.TestSuite('mojito-middleware-debug-tests'),
        // debug_interface = require(path.join(__dirname, '../../../app/middleware/mojito-debug')),
        debug_interface = require(Y.MOJITO_DIR + 'lib/app/middleware/mojito-debug'),
        A = YUITest.Assert;

    suite.add(new YUITest.TestCase({
        name: 'Debug middlewar',

        'create handler no debug': function() {
            var store = {
                    getRoutes: function() {
                        return routes;
                    },
                    getAppConfig: function() {
                        return {};
                    }
                },
                config = {
                    Y: Y,
                    store: store
                },
                handler = debug_interface(config),
                req = {};

            A.isNotUndefined(handler, 'middleware is null');

            handler(req, {}, function() {A.pass("handle req success");});

            A.isNotNull(req.debug, 'api is null');

            req.debug.addFlag('foo');
            req.debug.on('foo', function() {A.fail("debugger should be off");});
            A.isUndefined(req.debug.getInstrumentationErrors(), 'debugger should be off');
            A.isUndefined(req.command, 'tried to load debugger when it was off');
        },

        'create handler with debug': function() {
            var store = {
                    getRoutes: function() {
                        return routes;
                    },
                    getAppConfig: function() {
                        return {
                            debug: {
                                queryParam: 'debug',
                                debugPath: '/debug',
                                debugMojit: '@Debug'
                            }
                        };
                    }
                },
                config = {
                    Y: Y,
                    store: store
                },
                handler = debug_interface(config),
                req = {
                    url: '/foo'
                };

            A.isNotUndefined(handler, 'middleware is null');

            handler(req, {}, function() {A.pass("handle req success");});

            A.isNotUndefined(req.debug, 'api is null');

            req.debug.addFlag("foo");
            req.debug.on("foo", function() {A.fail("debugger is on");});
            A.isUndefined(req.debug.getInstrumentationErrors(), 'debug on without query param');
            A.isUndefined(req.command, 'tried to load debugger when query param missing');
        },

        'debug direct': function() {
            var store = {
                    getRoutes: function() {
                        return routes;
                    },
                    getAppConfig: function() {
                        return {
                            debug: {
                                queryParam: 'debug',
                                debugPath: '/debug',
                                debugMojit: '@Debug.index'
                            }
                        };
                    }
                },
                config = {
                    Y: Y,
                    store: store
                },
                handler = debug_interface(config),
                req = {
                    url: '/debug/foo'
                };

            A.isNotUndefined(handler, 'middleware is null');

            handler(req, {}, function() {A.pass("handle req success");});

            A.isNull(req.url, 'null request on direct call');
        },

        'create handler with debug query param': function() {
            var app_config = {
                    debug: {
                        queryParam: 'debug',
                        debugPath: '/debug',
                        debugMojit: '@Debug.index'
                    }
                },
                store = {
                    getRoutes: function() {
                        return routes;
                    },
                    getAppConfig: function() {
                        return app_config;
                    }
                },
                config = {
                    Y: Y,
                    store: store
                },
                handler = debug_interface(config),
                req = {
                    url: '/foo?debug=help'
                };

            A.isNotUndefined(handler, 'middleware is null');

            handler(req, {}, function() {A.pass("handle req success");});

            A.isNotUndefined(req.debug, 'api is null');

            req.debug.addFlag("foo");
            req.debug.on("foo", function() {A.pass("debugger is on");});
            A.isUndefined(req.debug.getInstrumentationErrors(), 'instrumentation error');
            A.isNotUndefined(req.command, 'failed to detect query param');
            A.areEqual('/debug/foo?debug=help', req.url, 'redirect url wrong');
            A.areEqual('Debug', req.command.instance.type, 'wrong debug mojit type');
            A.areEqual('index', req.command.action, 'wrong mojit action');

            req = {
                url: '/foo?debug=help'
            };
            app_config.debug.debugMojit = 'Debug.index2';
            handler = debug_interface(config);
            handler(req, {}, function() {A.pass("handle req success");});
            A.isNotUndefined(req.command, 'failed to detect query param');
            A.areEqual('Debug', req.command.instance.base, 'wrong debug mojit base');
            A.areEqual('index2', req.command.action, 'wrong mojit action');
        },

        'create handler with request validator': function() {
            var app_config = {
                    debug: {
                        queryParam: 'debug',
                        debugPath: '/debug',
                        debugMojit: '@Debug.index',
                        debugAllowed: 'my_validate_module.handler'
                    }
                },
                store = {
                    getRoutes: function() {
                        return routes;
                    },
                    getAppConfig: function() {
                        return app_config;
                    }
                },
                config = {
                    Y: Y,
                    store: store
                },
                handler = debug_interface(config),
                req = {
                    url: '/foo'
                };

            Y.add('my_validate_module', function(Y) {
                function ValidateRequest(req) {
                    return false;
                };
                Y.namespace('mojito-middleware-debug-tests').handler = ValidateRequest;
            });


            A.isNotUndefined(handler, 'middleware is null');

            handler(req, {}, function() {A.pass("handle req success");});

            A.isNotUndefined(req.debug, 'api is null');

            A.areEqual('/foo', req.url, 'redirect url wrong');

            Y.add('my_validate_module2', function(Y) {
                function ValidateRequest(req) {
                    return true;
                };
                Y.namespace('mojito-middleware-debug-tests').handler = ValidateRequest;
            });

            req = {
                url: '/foo?debug=help'
            };
            app_config.debug.debugAllowed = 'my_validate_module2.handler';
            handler = debug_interface(config);
            handler(req, {}, function() {A.pass("handle req success");});

            A.isNotUndefined(req.debug, 'api is null');

            A.areEqual('/debug/foo?debug=help', req.url, 'redirect url wrong');
        }
    }));

    YUITest.TestRunner.add(suite);
});
