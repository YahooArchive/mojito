/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-url-addon', 'test', function(Y) {

    var suite = new Y.Test.Suite('mojito-url-addon tests'),
        cases = {},
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,
        rm;

    cases = {
        name: 'make url tests',

        setUp: function() {
            // Capture the real RouteMaker
            rm = Y.mojito.RouteMaker;
        },

        tearDown: function() {
            //  Put Y.mojito.RouteMaker back to the real RouteMaker
            Y.mojito.RouteMaker = rm;
        },
        
        'test find url (get)': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    find: function(url, verb) {
                        A.areSame('myid.myaction', url, 'wrong route query to route finder');
                        A.areSame('get', verb, 'wrong verb to route finder');
                        return 'ohhai url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });

            url = addon.find('myid.myaction?foo=bar', 'get');

            A.areSame('ohhai url', url, 'wrong url from find function');
        },

        'test find url (post)': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    find: function(url, verb) {
                        A.areSame('myid.myaction', url, 'wrong route query to route finder');
                        A.areSame('post', verb, 'wrong verb to route finder');
                        return 'ohhai url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });

            url = addon.find('myid.myaction', 'post');

            A.areSame('ohhai url', url, 'wrong url from find function');
        },

        'test make url (get)': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    make: function(query, verb) {
                        A.areSame('myid.myaction?foo=bar', query, 'wrong route query to route maker');
                        A.areSame('get', verb, 'wrong verb to route maker');
                        return 'ohhai url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });


            url = addon.make('myid', 'myaction', 'foo=bar', 'get');

            A.areSame('ohhai url', url, 'wrong url from make function');

        },
        
        'test make url (get) plus qry param': function() {
            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    make: function(query, verb) {
                        A.areSame('myid.myaction?foo=bar', query, 'wrong route query to route maker');
                        A.areSame('get', verb, 'wrong verb to route maker');
                        return 'ohhai url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });


            url = addon.make('myid', 'myaction', 'foo=bar', 'get', {a:1, b:2});

            A.areSame('ohhai url?a=1&b=2', url, 'wrong url from make function');
        },

        'test make url (post)': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    make: function(query, verb) {
                        A.areSame('myid.myaction?foo=bar', query, 'wrong route query to route maker');
                        A.areSame('post', verb, 'wrong verb to route maker');
                        return 'ohhai url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });


            url = addon.make('myid', 'myaction', 'foo=bar', 'post');

            A.areSame('ohhai url', url, 'wrong url from make function');

        },

        'test make url default params and method': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    make: function(query, verb) {
                        A.areSame('myid.myaction', query, 'wrong route query to route maker');
                        A.isUndefined(verb, 'wrong verb to route maker');
                        return 'ohhai url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });


            url = addon.make('myid', 'myaction');

            A.areSame('ohhai url', url, 'wrong url from make function');

        },
        
        'test make handles object params as well as string params': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    make: function(query, verb) {
                        A.areSame('myid.myaction?foo=bar', query, 'wrong route query to route maker');
                        A.areSame('get', verb, 'wrong verb to route maker');
                        return 'ohhai url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });


            url = addon.make('myid', 'myaction', {foo:'bar'}, 'get');

            A.areSame('ohhai url', url, 'wrong url from make function');

        }
        
    };

    suite.add(new Y.Test.Case(cases));
    Y.Test.Runner.add(suite);
});
