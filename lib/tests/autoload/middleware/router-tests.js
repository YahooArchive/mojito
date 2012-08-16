/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-middleware-router-tests', function(Y, NAME) {

    var path = require('path'),
        suite = new YUITest.TestSuite(NAME),
        factory = require(path.join(__dirname, '../../../app/middleware/mojito-router')),
        A = YUITest.Assert,
        AA = YUITest.ArrayAssert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'Handler route matching',

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
        
        
    }));
    
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
        var route = factory.getRoute(input.method || 'GET', input.url, new Y.mojito.RouteMaker(routes));
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

    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-route-maker']});
