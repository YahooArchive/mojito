/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-url-addon-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        rm,
        OA = YUITest.ObjectAssert;
    
    suite.add(new YUITest.TestCase({
    
        name: 'make tests',

        setUp: function() {
            //  Capture the real RouteMaker
            rm = Y.mojito.RouteMaker;
        },

        tearDown: function() {
            //  Put Y.mojito.RouteMaker back to the real RouteMaker
            Y.mojito.RouteMaker = rm;
        },
        
        'find url (get)': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    find: function(url, verb) {
                        A.areSame('myid.myaction', url, 'wrong route query to route finder');
                        A.areSame('get', verb, 'wrong verb to route finder');
                        return 'the damn url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });

            url = addon.find('myid.myaction?foo=bar', 'get');

            A.areSame('the damn url', url, 'wrong url from find function');
        },

        'find url (post)': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    find: function(url, verb) {
                        A.areSame('myid.myaction', url, 'wrong route query to route finder');
                        A.areSame('post', verb, 'wrong verb to route finder');
                        return 'the damn url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });

            url = addon.find('myid.myaction', 'post');

            A.areSame('the damn url', url, 'wrong url from find function');
        },

        'make url (get)': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    make: function(query, verb) {
                        A.areSame('myid.myaction?foo=bar', query, 'wrong route query to route maker');
                        A.areSame('get', verb, 'wrong verb to route maker');
                        return 'the damn url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });


            url = addon.make('myid', 'myaction', 'foo=bar', 'get');

            A.areSame('the damn url', url, 'wrong url from make function');

        },

        'make url (post)': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    make: function(query, verb) {
                        A.areSame('myid.myaction?foo=bar', query, 'wrong route query to route maker');
                        A.areSame('post', verb, 'wrong verb to route maker');
                        return 'the damn url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });


            url = addon.make('myid', 'myaction', 'foo=bar', 'post');

            A.areSame('the damn url', url, 'wrong url from make function');

        },

        'make url default params and method': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    make: function(query, verb) {
                        A.areSame('myid.myaction', query, 'wrong route query to route maker');
                        A.isUndefined(verb, 'wrong verb to route maker');
                        return 'the damn url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });


            url = addon.make('myid', 'myaction');

            A.areSame('the damn url', url, 'wrong url from make function');

        },
        
        'make handles object params as well as string params': function() {

            Y.mojito.RouteMaker = function(rtes) {
                A.areSame('routes', rtes);
                return {
                    make: function(query, verb) {
                        A.areSame('myid.myaction?foo=bar', query, 'wrong route query to route maker');
                        A.areSame('get', verb, 'wrong verb to route maker');
                        return 'the damn url';
                    }
                };
            };
            var addon = new Y.mojito.addons.ac.url(null, null, {
                app: { config: {}, routes: 'routes' }
            });


            url = addon.make('myid', 'myaction', {foo:'bar'}, 'get');

            A.areSame('the damn url', url, 'wrong url from make function');

        }
        
    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: [
    'mojito-url-addon'
]});
