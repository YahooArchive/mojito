/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint nomen:true, node:true*/
/*global YUI*/

YUI().use('mojito-route-maker', 'test', function (Y) {
    var suite = new Y.Test.Suite('mojito-route-maker-tests'),
        A = Y.Assert,
        OA = Y.ObjectAssert,
        routesFixture,
        routeMaker;

    function setupFixtures() {
        var routes,
            fns;

        fns = [
            function (req, res, next) { next(); }
        ];

        routes = {
            get: [{
                path: '/admin/help',
                method: 'get',
                callbacks: [ fns ],
                keys: [],
                regexp: /^\/admin\/help\/?$/i,
                dispatch: {
                    call: 'admin.help',
                    params: { },
                    options: { }
                }
            }, {
                path: '/admin/:action',
                method: 'get',
                callbacks: [ fns ],
                keys: [
                    { name: 'action', optional: false }
                ],
                regexp: /^\/admin\/(?:([^\/]+?))\/?$/i,
                dispatch: {
                    call: 'admin.support',
                    params: { },
                    options: { }
                }
            }, {
                path: '/:type/support',
                method: 'get',
                callbacks: [ fns ],
                keys: [
                    { name: 'type', optional: false }
                ],
                regexp: /^\/(?:([^\/]+?))\/support\/?$/i,
                dispatch: {
                    call: 'admin.support',
                    params: { },
                    options: { }
                }
            }, {
                path: '/:foobar/:foo',
                method: 'get',
                callbacks: [ fns ],
                keys: [
                    { name: 'foobar', optional: false },
                    { name: 'foo', optional: false }
                ],
                regexp: /^\/(?:([^\/]+?))\/support\/?$/i,
                dispatch: {
                    call: 'foobar.foo',
                    params: { },
                    options: { }
                }
            }],
            post: [{
                path: '/:type/:action',
                method: 'post',
                callbacks: [ fns ],
                keys: [
                    { name: 'type', optional: false },
                    { name: 'action', optional: false }
                ],
                regexp: /^\/(?:([^\/]+?))\/(?:([^\/]+?))\/?$/i,
                dispatch: {
                    call: 'admin.submit',
                    params: { },
                    options: { }
                }
            }],
            'delete': []
        };

        routesFixture = routes;
    }

    suite.add(new Y.Test.Case({
        name: 'make() tests',

        _should: {
            error: {
                // 'test route maker use case #4 (-ve test)': true
                // 'test route maker where there is no match': true
            }
        },

        setUp: function () {
            setupFixtures();
            routeMaker = new Y.mojito.RouteMaker(routesFixture);
        },
        tearDown: function () {
        },

        //
        'test route maker where there is no match': function () {
            var url = routeMaker.make('admin.doesnotexist', 'delete', {});
            A.areEqual(null, url, 'wrong url for admin.doesnotexist');
        },
        // exact match
        // path: '/admin/help'
        // call: 'admin.help'
        'test route maker use case #1': function () {
            A.isFunction(routeMaker.make);

            var url = routeMaker.make('admin.help', 'get', {});
            A.areEqual('/admin/help', url, 'foo.index: bad URL');
        },
        //
        // path: '/admin/:action'
        // call: 'admin.support'
        'test route maker use case #2': function () {
            A.isFunction(routeMaker.make);
            var url = routeMaker.make('admin.support', 'get', {action: 'contactus'});
            A.areEqual('/admin/contactus', url, 'admin.support bad URL');
        },
        //
        // path: '/:type/support'
        // call: '/:type/support'
        'test route maker use case #3': function () {
            A.isFunction(routeMaker.make);
            var url = routeMaker.make('admin.support', 'get', {type: 'community'});
            A.areEqual('/community/support', url, 'admin.support: bad URL');
        },
        //
        //
        'test route maker use case #4 (+ve test)': function () {
            A.isFunction(routeMaker.make);
            var url = routeMaker.make('admin.submit', 'post', {type: 'community', action: 'submission'});
            A.areEqual('/community/submission', url, 'admin.submit: bad URL');
        },
        // method should be POST, not GET
        'test route maker use case #4 (-ve test)': function () {
            A.isFunction(routeMaker.make);
            var url = routeMaker.make('admin.submit', 'get', {type: 'community', action: 'submission'});
            A.areEqual(null, url, 'admin.submit: bad URL');
        },

        // make url with query params
        //
        // path: '/:type/support'
        // call: '/:type/support'
        'test route maker use case #5': function () {
            var url = routeMaker.make('admin.support', 'get', { type: 'community', foo: 'bar' });
            A.areEqual('/community/support?foo=bar', url, 'admin.support: bad URL');
        },

        // make url containing querystring overwrite params
        //
        // path: '/:type/support'
        // call: '/:type/support'
        'test route maker use case #6': function () {
            var url = routeMaker.make('admin.support?type=community', 'get', { foo: 'bar' });
            A.areEqual('/community/support', url, 'admin.support: bad URL');
        },

        // make url containing querystring with query params, even if query
        // params contains required keys
        //
        // path: '/:type/support'
        // call: '/:type/support'
        'test route maker use case #7': function () {
            var url = routeMaker.make('admin.support?type=community', 'get', { type: 'community', foo: 'bar' });
            A.areEqual('/community/support', url, 'admin.support: bad URL');
        },

        // make sure :foo and :foobar are replaced correctly
        //
        'test route maker use case #8': function () {
            var url = routeMaker.make('foobar.foo', 'get', { foo: 'world', foobar: 'hello' });
            A.areEqual('/hello/world', url, 'admin.submit: bad URL');
        },


        // route finder
        //
        // exact match
        'test route finder use case #1': function () {
            A.isFunction(routeMaker.find);
            var route = routeMaker.find('/admin/help', 'get');
            A.isNotUndefined(route, 'route not found for /admin/help');
            A.areEqual('/admin/help', route.path, 'wrong route.path for /admin/help');
        },

        //
        // path: /admin/:action
        // action = showrights
        'test route finder use case #2': function () {
            A.isFunction(routeMaker.find);
            var route = routeMaker.find('/admin/showrights', 'get');
            A.isNotUndefined(route, 'route not found for /admin/showrights');
            // A.areEqual('/admin/showrights', route.path, 'wrong route for /admin/showrights');
            // A.areEqual('showrights', route.dispatch.params.action,
            //             'wrong action for /admin/showrights');
            A.areEqual('showrights', route.params.action,
                        'wrong action for /admin/showrights');
        },
        //
        // path: /:type/:action
        // type = root
        // action = showrights
        //
        // verify: that this does not match use case #2
        'test route finder use case #3': function () {
            var route = routeMaker.find('/root/showrights', 'post');
            A.isNotUndefined(route, 'route not found for /root/showrights');
            // A.areEqual('/admin/showrights', route.path, 'wrong route for /admin/showrights');
            // A.areEqual('root', route.dispatch.params.type,
            //             'wrong :type for /root/showrights');
            // A.areEqual('showrights', route.dispatch.params.action,
            //             'wrong :action for /root/showrights');
            A.areEqual('root', route.params.type,
                        'wrong :type for /root/showrights');
            A.areEqual('showrights', route.params.action,
                        'wrong :action for /root/showrights');
        },

        //
        // path: /:type/:action
        // type = root
        // action = showrights
        //
        // verify: null is returned if no route is found for this uri
        // why: verb is 'get', should be 'post'
        'test route finder use case #4 (-ve test)': function () {
            var route = routeMaker.find('/root/showrights', 'get');
            A.isNull(route, 'no route expected for path GET /root/showrights');
        },

        //
        // path: /:type/:action
        // type = root
        // action = showrights
        //
        // verify: null is returned if no route is found for this uri
        // why: verb is 'get', should be 'post'
        'test route finder use case #5': function () {
            var route = routeMaker.find('/root/showrights', 'post');
            A.isNotUndefined(route, 'no route expected for path POST /root/showrights');
            A.areEqual('admin.submit', route.call,
                       '/root/showrights: wrong route.call');
        }


    }));

    Y.Test.Runner.add(suite);
});

