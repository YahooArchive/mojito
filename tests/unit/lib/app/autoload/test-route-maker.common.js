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
        annotationsFixture,
        routesFixture,
        routeMaker;

    function setupFixtures() {
        var annotations,
            routes,
            fns;

        fns = [
            function (req, res, next) { next(); }
        ];


        // The route configuration should conform to 
        // express-map#getRouteMap() 
        routes = {
            'admin.help': {
                path: '/admin/help',
                callbacks: [ fns ],
                keys: [],
                regexp: /^\/admin\/help\/?$/i,
                annotations: {
                    name: 'admin.help',
                    names: ['admin.help', 'get#admin.help'],
                    dispatch: {
                        call: 'admin.help',
                        params: { },
                        options: { }
                    }
                }
            },
            'get#admin.help': {
                path: '/admin/help',
                callbacks: [ fns ],
                keys: [],
                regexp: /^\/admin\/help\/?$/i,
                annotations: {
                    name: 'admin.help',
                    names: ['admin.help', 'get#admin.help'],
                    dispatch: {
                        call: 'admin.help',
                        params: { },
                        options: { }
                    }
                }
            },
            'admin.:action': {
                path: '/admin/:action',
                callbacks: [ fns ],
                keys: [
                    { name: 'action', optional: false }
                ],
                regexp: /^\/admin\/(?:([^\/]+?))\/?$/i,
                annotations: {
                    name: 'admin.:action',
                    names: ['admin.:action', 'get#admin.support'],
                    dispatch: {
                        call: 'admin.support',
                        params: { },
                        options: { }
                    }
                }
            },
            'get#admin.support': {
                path: '/admin/:action',
                callbacks: [ fns ],
                keys: [
                    { name: 'action', optional: false }
                ],
                regexp: /^\/admin\/(?:([^\/]+?))\/?$/i,
                annotations: {
                    name: 'admin.:action',
                    names: ['admin.:action', 'get#admin.support'],
                    dispatch: {
                        call: 'admin.support',
                        params: { },
                        options: { }
                    }
                }
            },

            ':type.support': {
                path: '/:type/support',
                callbacks: [ fns ],
                keys: [
                    { name: 'type', optional: false }
                ],
                regexp: /^\/(?:([^\/]+?))\/support\/?$/i,
                annotations: {
                    name: ':type.support',
                    names: [':type.support', 'get#:type.support'],
                    dispatch: {
                        call: 'admin.support',
                        params: { },
                        options: { }
                    }
                }
            },
            'get#:type.support': {
                path: '/:type/support',
                callbacks: [ fns ],
                keys: [
                    { name: 'type', optional: false }
                ],
                regexp: /^\/(?:([^\/]+?))\/support\/?$/i,
                annotations: {
                    name: ':type.support',
                    names: [':type.support', 'get#:type.support'],
                    dispatch: {
                        call: 'admin.support',
                        params: { },
                        options: { }
                    }
                }
            },

            ':foo.:bar': {
                path: '/:foobar/:foo',
                callbacks: [ fns ],
                keys: [
                    { name: 'foobar', optional: false },
                    { name: 'foo', optional: false }
                ],
                regexp: /^\/(?:([^\/]+?))\/(?:([^\/]+?))\/?$/i,
                annotations: {
                    name: ':foo.:bar',
                    names: [':foo.:bar', 'get#foobar.foo'],
                    dispatch: {
                        call: 'foobar.foo',
                        params: { },
                        options: { }
                    }
                }
            },
            'get#foobar.foo': {
                path: '/:foobar/:foo',
                callbacks: [ fns ],
                keys: [
                    { name: 'foobar', optional: false },
                    { name: 'foo', optional: false }
                ],
                regexp: /^\/(?:([^\/]+?))\/(?:([^\/]+?))\/?$/i,
                annotations: {
                    name: ':foo.:bar',
                    names: [':foo.:bar', 'get#foobar.foo'],
                    dispatch: {
                        call: 'foobar.foo',
                        params: { },
                        options: { }
                    }
                }
            },
            ':type.:action': {
                path: '/:type/:action',
                callbacks: [ fns ],
                keys: [
                    { name: 'type', optional: false },
                    { name: 'action', optional: false }
                ],
                regexp: /^\/(?:([^\/]+?))\/(?:([^\/]+?))\/?$/i,
                annotations: {
                    name: ':type.:action',
                    names: [':type.:action', 'post#admin.submit'],
                    dispatch: {
                        call: 'admin.submit',
                        params: { },
                        options: { }
                    }
                }
            },
            'post#admin.submit': {
                path: '/:type/:action',
                callbacks: [ fns ],
                keys: [
                    { name: 'type', optional: false },
                    { name: 'action', optional: false }
                ],
                regexp: /^\/(?:([^\/]+?))\/(?:([^\/]+?))\/?$/i,
                annotations: {
                    name: ':type.:action',
                    names: [':type.:action', 'post#admin.submit'],
                    dispatch: {
                        call: 'admin.submit',
                        params: { },
                        options: { }
                    }
                }
            }
        };

        annotations = {
            "/admin/help": {
                name: "admin.help",
                names: [ "/admin/help", "get#admin.help" ]
            },
            "/admin/:action": {
                name: "admin.:action",
                names: ["admin.:action", "get#admin.support"]
            },
            "/:type/:action": {
                name: ":type.:action",
                names: [":type.:action", "post#admin.submit"]
            },
            "/:type/support": {
                name: ":type.support",
                names: [":type.support", "get#type.support"]
            },
            "/:foobar/:foo": {
                name: ":foo.:bar",
                names: [ ":foo.:bar", "get#foobar.foo"]
            }
        };
        annotationsFixture = annotations;
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
            routeMaker = new Y.mojito.RouteMaker(routesFixture, annotationsFixture, true);
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
            // Expecting "null" because call=admin.support is being used in 
            // multiple entries, and there is not much that can be done to
            // reverse lookup the matching math
            A.areEqual(null, url, '#3.1 admin.support: bad URL');
            // A.areEqual('/community/support', url, '#3.1 admin.support: bad URL');

            url = routeMaker.make('admin.support', 'get', {type: 'community'});
            A.areEqual(null, url, '#3.2 admin.support: bad URL');
            // A.areEqual('/community/support', url, '#3.2 admin.support: bad URL');
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
            // A.areEqual('admin.help', route.annotations.dispatch.call, 'wrong route.annotations.dispatch.call');
            A.areEqual('admin.help', route.annotations.name, 'wrong route.annotations.name');
            A.isUndefined(route.params, 'route.params should be undefined');
            // OA.areEqual({}, route.params, 'wrong route.params');
            //  OA.areEqual({}, route.annotations.dispatch.params, 'wrong route.annotations.dispatch.params');
            // route.regex uses previous mojito format
            // OA.areEqual({}, route.regex, 'wrong route.regex');
            // Y.log('----' + route.ext_match.toString());
        },

        //
        // path: /admin/:action
        // action = showrights
        'test route finder use case #2': function () {
            var route = routeMaker.find('/admin/showrights', 'get');
            // Y.log(JSON.stringify(route));
            A.isNotUndefined(route, 'route not found for /admin/showrights');
            A.areEqual('/admin/:action', route.path, 'wrong route for /admin/showrights');
            // A.areEqual('admin.support', route.annotations.dispatch.call, 'wrong route.annotatoins.dispatch.call');
            // A.areEqual('showrights', route.annotations.dispatch.params.action,
            A.areEqual('showrights', route.params.action,
                        'wrong action for /admin/showrights');
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
            // A.areEqual('admin.submit', route.annotations.dispatch.call, 'wrong route.call');
            // A.areEqual('root', route.annotations.dispatch.params.type,
            // Y.log(JSON.stringify(route));
            A.areEqual('root', route.params.type,
                        'wrong :type for /root/showrights');
            // A.areEqual('showrights', route.annotations.dispatch.params.action,
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
            // Y.log(JSON.stringify(route));
            A.isNull(route, 'no route expected for path GET /root/showrights');
        },

        'test dummy': function () {
            A.isFunction(routeMaker.find);
            A.isFunction(routeMaker.make);
        }


    }));

    Y.Test.Runner.add(suite);
});

