/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-url-addon', 'test', 'querystring', function(Y) {

    var suite = new Y.Test.Suite('mojito-url-addon tests'),
        cases = {},
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,
        RouteMaker;

    cases = {
        name: 'make url tests',

        setUp: function() {
            // Capture the real RouteMaker
            RouteMaker = Y.mojito.RouteMaker;
        },

        tearDown: function() {
            //  Put Y.mojito.RouteMaker back to the real RouteMaker
            Y.mojito.RouteMaker = RouteMaker;
        },

        'test find url (get)': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    find: function(url, verb) {
                        A.areSame('myid.myaction', url);
                        A.areSame('get', verb);
                        return 'ohhai url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });

            url = addon.find('myid.myaction?foo=bar', 'get');

            A.areSame('ohhai url', url);
        },

        'test find url (get) using real RouteMaker': function() {

            var addon, url, routes = {
                'aroute': {
                    'call': 'foo',
                    'path': '/a/b/c/',
                    'verbs': ['get']
                }
            };

            //need to use real find() which needs real RouteMaker
            Y.mojito.RouteMaker = RouteMaker;

            addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: routes }
            });

            url = addon.find('/a/b/c/', 'get');

            // url = {
            //     "call": "foo",
            //     "path": "/a/b/c/",
            //     "verbs": {
            //         "GET": true
            //     },
            //     "name": "aroute",
            //     "params": {},
            //     "regex": {},
            //     "query": {},
            //     "requires": {},
            //     "ext_match": "^/a/b/c/$",
            //     "int_match": "^$"
            // }

            A.areSame('foo', url.call);
            A.areSame('/a/b/c/', url.path);
            OA.ownsNoKeys(url.params);
        },

        'test find http://url?with=params (get) using real RouteMaker': function() {

            var addon, url, routes = {
                'aroute': {
                    'call': 'foo',
                    'path': '/a/b/c/',
                    'verbs': ['get']
                }
            };

            //need to use real find() which needs real RouteMaker
            Y.mojito.RouteMaker = RouteMaker;

            addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: routes }
            });

            url = addon.find('http://xyz.com/a/b/c/?a=1&b=2', 'get');

            A.areSame('foo', url.call);
            A.areSame('/a/b/c/', url.path);
            OA.ownsNoKeys(url.params);
        },
        'test find url (post)': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    find: function(url, verb) {
                        A.areSame('myid.myaction', url);
                        A.areSame('post', verb);
                        return 'ohhai url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });

            url = addon.find('myid.myaction', 'post');

            A.areSame('ohhai url', url);
        },

        'test make url (get)': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    make: function(query, verb) {
                        A.areSame('myid.myaction?foo=bar', query);
                        A.areSame('get', verb);
                        return 'ohhai url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });


            url = addon.make('myid', 'myaction', 'foo=bar', 'get');

            A.areSame('ohhai url', url);

        },

        'test make url (get) plus qry param': function() {
            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    make: function(query, verb) {
                        A.areSame('myid.myaction?foo=bar', query);
                        A.areSame('get', verb);
                        return 'ohhai url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });


            url = addon.make('myid', 'myaction', 'foo=bar', 'get', {a:1, b:2});

            A.areSame('ohhai url?a=1&b=2', url);
        },

        'test make url (post)': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    make: function(query, verb) {
                        A.areSame('myid.myaction?foo=bar', query);
                        A.areSame('post', verb);
                        return 'ohhai url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });


            url = addon.make('myid', 'myaction', 'foo=bar', 'post');

            A.areSame('ohhai url', url);

        },

        'test make url default params and method': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    make: function(query, verb) {
                        A.areSame('myid.myaction', query);
                        A.isUndefined(verb);
                        return 'ohhai url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });


            url = addon.make('myid', 'myaction');

            A.areSame('ohhai url', url);

        },

        'test make handles object params as well as string params': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    make: function(query, verb) {
                        A.areSame('myid.myaction?foo=bar', query);
                        A.areSame('get', verb);
                        return 'ohhai url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });


            url = addon.make('myid', 'myaction', {foo:'bar'}, 'get');

            A.areSame('ohhai url', url);

        }

    };

    suite.add(new Y.Test.Case(cases));
    Y.Test.Runner.add(suite);
});
