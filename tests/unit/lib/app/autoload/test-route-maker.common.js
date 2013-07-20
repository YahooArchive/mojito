/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint nomen:true, node:true*/
/*global YUI*/

YUI().use('mojito-route-maker', 'mojito-util', 'test', 'dump', function (Y) {
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
                // regexp: /^\/(?:([^\/]+?))\/support\/?$/i,
                regexp: /^\/(?:([^\/]+?))\/(?:([^\/]+?))\/?$/i,
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
            routeMaker = new Y.mojito.RouteMaker(routesFixture, true);
        },
        tearDown: function () {
        },

        // verify: make() returns "null" if not "query" is not found
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
            A.areEqual('/admin/help', url, '#1.1 admin.help: bad URL');

            url = routeMaker.make('admin.help?foz=baz&foo=bar&', 'get', {});
            A.areEqual('/admin/help?foz=baz&foo=bar', url, '#1.2 admin.help: bad query');

            url = routeMaker.make('admin.help?foo=bar&foz=baz&', 'get', {src: 'TEST'});
            A.areEqual('/admin/help?foz=baz&foo=bar', url, '#1.3 admin.help: bad query');

            url = routeMaker.make('admin.help?', 'get', {src: 'TEST'});
            A.areEqual('/admin/help?src=TEST', url, '#1.4 admin.help: bad query');

        },
        //
        // path: '/admin/:action'
        // call: 'admin.support'
        'test route maker use case #2': function () {
            A.isFunction(routeMaker.make);
            var url = routeMaker.make('admin.support', 'get', {action: 'contactus'});
            A.areEqual('/admin/contactus', url, '#2.1 admin.support bad URL');

            url = routeMaker.make('admin.support?action=contactus', 'get', {foo: 'bar'});
            A.areEqual('/admin/contactus', url, '#2.2 admin.support bad URL');

            url = routeMaker.make('admin.support?foo=bar', 'get', {action: 'contactus'});
            A.areEqual(null, url, '#2.3 admin.support bad URL');

            // query params sorted in reverse
            url = routeMaker.make('admin.support?action=contactus&foo=bar&foz=baz', 'get', {});
            A.areEqual('/admin/contactus?foz=baz&foo=bar', url, '#2.4 admin.support bad URL');
        },

        // a variation of #2 above
        //
        // path: '/:type/support'
        // call: '/:type/support'
        'test route maker use case #3': function () {
            A.isFunction(routeMaker.make);
            var url = routeMaker.make('admin.support', 'get', {type: 'community'});
            A.areEqual('/community/support', url, '#3.1 admin.support: bad URL');

            url = routeMaker.make('admin.support', 'get', {type: 'community'});
            A.areEqual('/community/support', url, '#3.2 admin.support: bad URL');
        },

        //
        // path: /:type/:action
        // call: 'admin.submit'
        'test route maker use case #4 (+ve test)': function () {
            A.isFunction(routeMaker.make);
            var url = routeMaker.make('admin.submit', 'post', {type: 'community', action: 'submission'});
            A.areEqual('/community/submission', url, '#4.1 admin.submit: bad URL');

            url = routeMaker.make('admin.submit', 'post', {type: 'community', action: 'submission', foo: 'bar'});
            A.areEqual('/community/submission?foo=bar', url, '#4.2 admin.submit: bad URL');

            url = routeMaker.make('admin.submit', 'post', {type: 'community', action: 'submission', foo: 'bar', zoo: 'boo'});
            A.areEqual('/community/submission?zoo=boo&foo=bar', url, '#4.3 admin.submit: bad URL');

            url = routeMaker.make('admin.submit?type=community&action=submission&foo=bar&zoo=boo', 'post', {KEY: 'VALUE'});
            A.areEqual('/community/submission?zoo=boo&foo=bar', url, '#4.4 admin.submit: bad URL');
        },

        // path: /:type/:action
        // call: 'admin.submit'
        // method should be POST, not GET
        'test route maker use case #4 (-ve test)': function () {
            A.isFunction(routeMaker.make);
            var url = routeMaker.make('admin.submit', 'get', {type: 'community', action: 'submission'});
            A.areEqual(null, url, 'admin.submit: bad URL');
        },


        // make sure :foo and :foobar are replaced correctly
        //
        // path: '/:foobar/:foo'
        // call: 'foobar.foo'
        // method: 'GET'
        //
        'test route maker use case #5': function () {
            var url = routeMaker.make('foobar.foo', 'get', { foo: 'world', foobar: 'hello' });
            A.areEqual('/hello/world', url, '#5.1 foobar.foo: bad URL');

            url = routeMaker.make('foobar.foo', 'get', { foo: 'world', foobar: 'hello', x: 'y' });
            A.areEqual('/hello/world?x=y', url, '#5.2 foobar.foo: bad URL');
        },


        // route finder
        //
        'test routeMaker.finder method exist': function () {
            A.isFunction(routeMaker.find);
        },

        // exact match
        'test route finder use case #1': function () {
            var route = routeMaker.find('/admin/help', 'get');
            A.isNotUndefined(route, 'route not found for /admin/help');
            A.areEqual('/admin/help', route.path, 'wrong route.path for /admin/help');
            A.areEqual('admin.help', route.call, 'wrong route.dispatch');
            A.areEqual('/admin/help.admin.help', route.name, 'wrong route.name');
            A.areEqual(true, route.verbs.GET, 'wrong route.verbs.GET for /admin/help');
            OA.areEqual({}, route.params, 'wrong route.dispatch.params');
            // route.regex uses previous mojito format
            // OA.areEqual({}, route.regex, 'wrong route.regex');
            // Y.log('----' + route.ext_match.toString());
            OA.areEqual(/^\/admin\/help\/?$/i, route.ext_match, 'wrong route.ext_match');
        },

        //
        // path: /admin/:action
        // action = showrights
        'test route finder use case #2': function () {
            var route = routeMaker.find('/admin/showrights', 'get');
            Y.log(JSON.stringify(route));
            A.isNotUndefined(route, 'route not found for /admin/showrights');
            A.areEqual('/admin/:action', route.path, 'wrong route for /admin/showrights');
            A.areEqual('admin.support', route.call, 'wrong route.call');
            A.areEqual('showrights', route.params.action,
                        'wrong action for /admin/showrights');
            OA.areEqual(/^\/admin\/(?:([^\/]+?))\/?$/i, route.ext_match, 'wrong route.ext_match');
        },
        //
        // path: /:type/:action
        // type = root
        // action = showrights
        // verb = POST
        //
        // verify: that this does not match use case #2
        'test route finder use case #3': function () {
            var route = routeMaker.find('/root/showrights', 'post');
            A.isNotUndefined(route, 'route not found for /root/showrights');
            A.areEqual('/:type/:action', route.path, 'wrong route for /root/showrights');
            A.areEqual('admin.submit', route.call, 'wrong route.call');
            A.areEqual('root', route.params.type,
                        'wrong :type for /root/showrights');
            A.areEqual('showrights', route.params.action,
                        'wrong :action for /root/showrights');
        },

        //
        // path: /:type/:action
        // type = root
        // action = showrights
        // method = get
        //
        // verify: null is returned if no route is found for this uri
        // why: verb is 'get', should be 'post'
        'test route finder use case #4 (-ve test)': function () {
            var route = routeMaker.find('/doesnotexist/root/showrights', 'get');
            A.isNull(route, 'no route expected for path GET /root/showrights');
        },


        'test convertAppRoute': function () {
            var appRoutes,
                routes,
                route,
                i;

            appRoutes = [{
                path: '/bar',
                method: 'get',
                callbacks: [ function (req, res, next) { } ],
                keys: [],
                rexgexp: /^\/bar\/?$/i,
                dispatch: {
                    call: 'bar.index',
                    params: {},
                    options: {}
                },
                params: []
            }, {
                path: '/foo/:bar',
                method: 'post',
                callbacks: [ function (req, res, next) { } ],
                keys: [
                    { name: 'bar', optional: false }
                ],
                rexgexp: /^\/foo\/(?:([^\/]+?))\/?$/i,
                dispatch: {
                    call: 'foo.action',
                    params: {
                    },
                    options: {}
                },
                params: []
            }];

            routes = [{
                path: '/bar',
                call: 'bar.index',
                name: 'bar.index',
                verbs: {
                    GET: true
                },
                params: {},
                regex: {},
                ext_match: /^\/bar\/?$/i
                // query: {},
                // requires: {},
                // int_match: ''
            }, {
                path: '/foo/:bar',
                call: 'bar.action',
                name: 'bar.action',
                verbs: {
                    POST: true
                },
                params: {},
                regex: { },
                ext_match: /^\/bar\/?$/i
            }];

            for (i = 0; i < appRoutes.length; i = i + 1) {
                route = routeMaker._convertAppRoute(appRoutes[i]);
                // Y.log(Y.dump(route), 'debug');
                A.areEqual(routes[i].path,
                           route.path,
                           'wrong route.path for index ' + i);
                A.areEqual(true,
                           route.verbs[appRoutes[i].method.toUpperCase()],
                           'wrong route.verbs for index ' + i);

            }

        },

        'test dummy': function () {
            A.isFunction(routeMaker.find);
            A.isFunction(routeMaker.make);
        }


    }));

    Y.Test.Runner.add(suite);
});

