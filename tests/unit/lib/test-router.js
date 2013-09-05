/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*global YUI, require, __dirname*/

YUI().use('test', function (Y) {
    var A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,
        libpath = require('path'),
        mockery = require('mockery'),
        suite = new Y.Test.Suite('lib/router tests'),
        mojitoRoot,
        router,
        app,
        mojito,
        routes01Mock = { admin: { path: '/admin', call: 'admin.help' } },
        routes02Mock = { help:  { path: '/help',  call: 'help.index' } };

    suite.add(new Y.Test.Case({
        'setUp': function () {
            var utilMock;

            utilMock = {
                readConfig: function (path) {
                    var o;
                    if (path === "routes01.json") {
                        o = [{
                            settings: [ "master" ],
                            admin: {
                                path: '/admin',
                                call: 'admin.help'
                            }
                        }];
                    } else if (path === "routes02.json") {
                        o = [{
                            settings: [ "master" ],
                            help: {
                                path: '/help',
                                call: 'help.index'
                            }
                        }];
                    } else {
                        o = { };
                    }
                    return o;
                }
            };

            mockery.enable({
                warnOnReplace: false,
                warnOnUnregistered: false,
                useCleanCache: true
            });
            mockery.registerMock('./util', utilMock);

            mojitoRoot = libpath.resolve(__dirname, '../../..');
            router = require('../../../lib/router');

            // fake express app instance
            app = {
                mojito: {
                    options: {
                        // set to empty string because our util.readConfig()
                        // mock expect 'routes01.json'
                        root: ''
                    }
                }
            };
            router._app = app;
        },
        'tearDown': function () {
            mockery.deregisterMock('./util');
            mockery.disable();

            app = undefined;
            router._app = undefined;
        },

        'test readConfigYCB': function () {
            A.isFunction(router.readConfigYCB);

            var o;
            
            o = router.readConfigYCB('routes01.json');
            OA.areEqual(routes01Mock.admin,
                       o.admin,
                       'routes01.json did not match');
        },

        'test buildRoute': function () {
            A.isFunction(router.buildRoute);

            var o;

            o = router.buildRoute('foo', {
                path: '/foo',
                call: 'foo.bar'
            });

            A.areEqual('foo', o.name, 'missing name');
            A.areEqual(true, o.verbs.GET, 'missing verbs');
        },

        'test getRoutes': function () {
            A.isFunction(router.getRoutes);

            var o,
                fix;

            fix = {
                admin: {
                    name: "admin",
                    path: "/admin",
                    call: "admin.help",
                    verbs: { GET: true }
                }
            };

            o = router.getRoutes('routes01.json');

            A.areEqual(fix.admin.name, o.admin.name, 'wrong name');
            A.areEqual(fix.admin.path, o.admin.path, 'wrong path');
            A.areEqual(fix.admin.call, o.admin.call, 'wrong call');
            OA.areEqual(fix.admin.verbs, o.admin.verbs, 'wrong verbs');


        },

        'test attachRoutes': function () {
            A.isFunction(router.attachRoutes);

            var o,
                adminCalled = false,
                helpCalled = false,
                mapCalled = false,
                postCalled = false;


            router._app.map = function (path, name) {
                mapCalled = true;
                // verify that name and path matches
                if (path === '/admin') {
                    A.areEqual('admin', name, 'name should be "admin"');
                } else if (path === '/help') {
                    A.areEqual('help', name, 'name should be "help"');
                } else {
                    A.isTrue(false, 'invalid path: ' + path);
                }

            };

            router._app.get = function (path, fn) {
                if (path === "/admin") {
                    A.isFunction(fn, 'fn should be a function');
                    adminCalled = true;
                } else if (path === "/help") {
                    A.isFunction(fn, 'fn should be a function');
                    helpCalled = true;
                } else {
                    A.isFalse(true, 'unexpected path: ' + path);
                }
            };

            app.post = function () {
                postCalled = true;
            };

            o = router.attachRoutes([
                'routes01.json',
                'routes02.json'
            ]);

            A.areEqual(true, adminCalled, '/admin handler was not installed');
            A.areEqual(true, helpCalled, '/help handler was not installed');
            A.areEqual(false, postCalled, 'app.post() should not have been called');
        }

    }));

    Y.Test.Runner.add(suite);
});

/*
YUI().use('mojito-route-maker', 'mojito-test-extra', 'test', function(Y) {
    var A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,
        cases = {},

        factory = require(Y.MOJITO_DIR + 'lib/app/middleware/mojito-router');

    cases = {
        name: 'router middleware tests',

        'dynamic id and action': function() {
            autoRouteMatchTester(
                { url: '/MY_ID/MY_ACTION' },
                { call: ['MY_ID', 'MY_ACTION'], path: '/:id/:m-action' }
            );
        },

        'static id and action with in-url variable converted to param': function() {
            var match = autoRouteMatchTester({
                url: '/weather/23456/'
            }, {
                call: ['mojit_weather', 'index'],
                path: "/weather/:zip/",
                params: { zip: '23456' }
            });

            A.areSame(match.query.zip, '23456');
        },

        'static url with ending wildcard': function() {
            autoRouteMatchTester(
                { url: '/weather/booyah' },
                { call: ['mojit_weather','index'], path: '/weather/*' }
            );

            autoRouteMatchTester(
                { url: '/weather/' },
                { call: ['mojit_weather','index'], path: '/weather/*' }
            );
        },

        'static id and dynamic action': function() {
            autoRouteMatchTester({
                url: '/weathergo/booyah'
            }, {
                call: ['mojit_weather','booyah'],
                path: '/weathergo/:action',
                params: {}
            });
        },

        'dynamic id, dynamic action, with ending variable converted to param (GET)': function() {
            var match = autoRouteMatchTester(
                { url: '/mojit-base-here/mojit-action-here/whatever' },
                {
                    call: ['mojit-base-here','mojit-action-here'],
                    path: '/:mojit-base/:mojit-action/:variable' ,
                    params: { variable: 'whatever' }
                }
            );

            A.areSame(match.query['mojit-base'], 'mojit-base-here');
            A.areSame(match.query['mojit-action'], 'mojit-action-here');
        },

        'dynamic id, dynamic action, with ending variable converted to param (POST)': function() {
            var match = autoRouteMatchTester(
                {   url: '/mojit-base-here/mojit-action-here/whatever',
                    method: 'post'
                },
                {
                    call: ['mojit-base-here','mojit-action-here'],
                    path: '/:mojit-base/:mojit-action/:variable' ,
                    params: { variable: 'whatever' }
                }
            );

            A.areSame(match.query['mojit-base'], 'mojit-base-here');
            A.areSame(match.query['mojit-action'], 'mojit-action-here');
        },

        'dynamic id plus ending wildcard (GET)': function() {
            var match = autoRouteMatchTester({
                    url: '/amoduleid/anything'
                }, {
                    call: ['amoduleid','index'], path: '/:mojit-base/*'
                }, {
                    "_default_module": {
                        "verbs": ["get","post","put"],
                        "path": "/:mojit-base/*",
                        "call": "{mojit-base}.index"
                    }
                });

            A.areSame(match.query['mojit-base'], 'amoduleid');
        },

        'dynamic id plus ending wildcard (POST)': function() {
            var match = autoRouteMatchTester({
                    url: '/amoduleid/anything',
                    method: 'post'
                }, {
                    call: ['amoduleid','index'], path: '/:mojit-base/*'
                }, {
                    "_default_module": {
                        "verbs": ["get","post","put"],
                        "path": "/:mojit-base/*",
                        "call": "{mojit-base}.index"
                    }
                });

            A.areSame(match.query['mojit-base'], 'amoduleid');
        },

        'dynamic id plus ending wildcard (PUT)': function() {
            var match = autoRouteMatchTester(
                { url: '/amoduleid/anything', method: 'put' },
                { call: ['amoduleid','index'], path: '/:mojit-base/*' }
            );

            A.areSame(match.query['mojit-base'], 'amoduleid');
        },

        'totally static url': function() {
            autoRouteMatchTester(
                { url: '/index.html' },
                { call: ['YMVC_default','index'], path: '/index.html' }
            );
        },

        'totally wild url': function() {
            autoRouteMatchTester(
                { url: '/whateverest' },
                { call: ['super','cuban'], path: '/*' }
            );
        },

        'url with querystring': function() {
            var match = autoRouteMatchTester({
                url: '/weather/63336/?foo=bar'
            }, {
                call: ['mojit_weather','index'],
                path: '/weather/:zip/',
                params: { zip: '63336' }
            });

            A.areSame('63336', match.query.zip);
            A.isUndefined(match.query.foo);
        },

        'router find URL weather zip and rad': function() {
            var match = autoRouteMatchTester({
                url: '/weather/at/23456/within/23/'
            }, {
                call: ['mojit_weather','index'],
                path: '/weather/at/:zip/within/:rad/',
                params: { zip: '23456', rad: '23' }
            });

            A.areSame('23456', match.query.zip, "Bad route param for zip");
            A.areSame('23', match.query.rad, "Bad route param for rad");
        },

        'router find URL weather zip and rad and page': function() {
            var match = autoRouteMatchTester({
                url: '/weather/at/23456/within/23/section/2'
            }, {
                call: ['mojit_weather','index'],
                path: '/weather/at/:zip/within/:rad/section/:page',
                params: { zip: '23456', rad: '23', page: '2' }
            });

            A.areSame('23456', match.query.zip, "Bad route param for zip");
            A.areSame('23', match.query.rad, "Bad route param for rad");
            A.areSame('2', match.query.page, "Bad route param for page");
        }

    };

    function getRoutes() {
        return {
            "weather_url_zip_rad_page": {
                "verbs": ["get"],
                "path": "/weather/at/:zip/within/:rad/section/:page",
                "call": "mojit_weather.index"
            },
            "weather_url_zip_rad": {
                "verbs": ["get"],
                "path": "/weather/at/:zip/within/:rad/",
                "call": "mojit_weather.index"
            },
            "weather_url_zip": {
                "verbs": ["get"],
                "path": "/weather/:zip/",
                "regex": {"zip":"[0-9]+"},
                "call": "mojit_weather.index"
            },
            "weather_url_dynamic_action": {
                "verbs": ["get"],
                "path": "/weathergo/:action",
                "call": "mojit_weather.{action}"
            },
            "weather_url": {
                "verbs": ["get"],
                "path": "/weather/*",
                "call": "mojit_weather.index"
            },
            "_default_module_action":{
                "verbs": ["get","post"],
                "path": "/:id/:m-action",
                "call": "{id}.{m-action}"
            },
            "_default_module_action with value":{
                "verbs": ["get","post"],
                "path": "/:mojit-base/:mojit-action/:variable",
                "call": "{mojit-base}.{mojit-action}"
            },
            "_default_module":{
                "verbs": ["get","post","put"],
                "path": "/:mojit-base/*",
                "call": "{mojit-base}.index"
            },
            "_index_html":{
                "path": "/index.html",
                "call": "YMVC_default.index"
            },
            "_index":{
                "path": "/*",
                "call": "super.cuban"
            }
        };
    }

    function autoRouteMatchTester(input, expected, routes) {
        routes = routes || getRoutes();
        var store = {
            getRoutes: function() {
                return routes;
            },
            getAppConfig: function() {
                return {};
            }
        };
        factory({
            Y:          Y,
            context:    {},
            store:      store,
            logger:     function() {}
        });
        var route = factory.getRoute(input.method || 'GET', input.url, new Y.mojito.RouteMaker(routes, true));
        A.isNotNull(route, 'No match was found for route');
        A.areSame(expected.call[0], route.call[0], "Bad first call value");
        A.areSame(expected.call[1], route.call[1], "Bad second call value");
        A.areSame(expected.path, route.path, "Bad path value");

        if (expected.params) {
            if (Y.Object.size(expected.params) === 0) {
                A.isTrue(Y.Object.size(route.params) === 0, "match params had too many values");
            } else {
                A.isObject(route.params, "Expected params, but found none");
                A.areSame(Y.Object.size(expected.params), Y.Object.size(route.params), "Wrong param object size");
                Object.keys(expected.params).forEach(function(p) {
                    A.areSame(expected.params[p], route.params[p], "Bad param value");
                });
            }
        }

        return route;
    }

    Y.Test.Runner.add(new Y.Test.Case(cases));
});
*/

