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
        suite = new Y.Test.Suite('lib/dispatcher tests'),
        dispatcher;

    suite.add(new Y.Test.Case({
        'setUp': function () {
            dispatcher = require('../../../lib/dispatcher');
        },
        'tearDown': function () {
        },
        'test OK': function () {
            A.isFunction(function () { });
        },

        // verify:
        // - handleRequest() is called()
        'test dispatch': function () {
            A.isFunction(dispatcher.dispatch);

            var req,
                res,
                next,
                mid,
                handleRequestCalled = false,
                fn;

            fn = dispatcher.handleRequest;
            dispatcher.handleRequest = function (req, res, next) {
                handleRequestCalled = true;
            };

            req = {
                app: {
                    mojito: { },
                    routes: {
                        get: [{
                            path: 'path',
                            method: 'get',
                            regexp: /^\/path\/?/,
                            keys: [ ],
                            params: { }
                        }]
                    }
                },
                url: '/admin',
                query: { foo: 'bar' },
                params: { foz: 'baz' },
                context: { runtime: 'server' }
            };

            mid = dispatcher.dispatch('admin.help');

            A.isNotUndefined(mid.dispatch, 'missing property dispatch');
            A.areEqual('admin.help', mid.dispatch.call, 'wrong mid.dispatch.call');
            A.isNotUndefined(mid.dispatch.params, 'missing mid.params');
            A.isNotUndefined(mid.dispatch.options, 'missing mid.options');

            mid(req, res, next);

            A.areEqual('help', req.command.action, 'wrong action');
            OA.areEqual({ base: 'admin' }, req.command.instance, 'wrong instance');
            OA.areEqual(req.context, req.command.context, 'wrong command.context');
            OA.areEqual(req.query, req.command.params.url, 'wrong params.url');
            OA.areEqual(req.params, req.command.params.route, 'wrong params.route');
            A.areEqual(true, handleRequestCalled, 'handleRequest was not called');

            dispatcher.handleRequest = fn;
        },

        // verify:
        // - req.app.mojito.routes is set on first invocation
        // - req.app.mojito.routes['get'] is set
        // - req.app.mojito.routes['get'].dispatch is set
        'test dispatch and verify routes cached is built': function () {
            A.isFunction(dispatcher.dispatch);

            var req,
                res,
                next,
                mid,
                handleRequestCalled = false,
                fn,
                cb;

            fn = dispatcher.handleRequest;
            dispatcher.handleRequest = function (req, res, next) {
                handleRequestCalled = true;
            };

            cb = function () { };
            cb.dispatch = { X: 'Y' };

            req = {
                app: {
                    mojito: { },
                    routes: {
                        get: [{
                            path: 'path',
                            method: 'get',
                            regexp: /^\/path\/?/,
                            keys: [ ],
                            params: { },
                            callbacks: [ cb ]
                        }]
                    }
                },
                url: '/admin',
                query: { },
                params: { },
                context: { runtime: 'server' }
            };

            mid = dispatcher.dispatch('admin.help');

            mid(req, res, next);

            A.isNotUndefined(req.app.mojito.routes, 'req.app.mojito.routes was not initialized!');
            A.isNotUndefined(req.app.mojito.routes.get,
                             'req.app.mojito.routes.get property is not set');
            A.areEqual('path', req.app.mojito.routes.get[0].path, 'wrong path');
            A.areEqual('get', req.app.mojito.routes.get[0].method, 'wrong method');
            A.isNotUndefined(req.app.mojito.routes.get[0].dispatch, 'missing dispatch property');
            A.areEqual('Y',
                       req.app.mojito.routes.get[0].dispatch.X,
                       'missing dispatch.X property');


            dispatcher.handleRequest = fn;
        },


        'test dispatch with @Admin.help TODO': function () {
            A.isFunction(dispatcher.dispatch);
        },

        // mock the request, store
        // verify:
        // - outputHandler.page.* is set
        // - next() is not called
        'test handleRequest when no errors': function () {
            A.isFunction(dispatcher.handleRequest);

            var req,
                res,
                next,
                nextCalled = false,
                dispatcherCalled = false;

            req = {
                command: { },
                context: { runtime: 'server' },
                app: {
                    mojito: {
                        routes: { x: 'y' },
                        Y: {
                            log: function () { },
                            mojito: {
                                Dispatcher: {
                                    init: function (store) {
                                        return {
                                            dispatch: function (cmd, output) {
                                                dispatcherCalled = true;

                                                OA.areEqual({staticAppConfig: 'true'},
                                                            output.page.staticAppConfig,
                                                            'wrong output.page.staticAppConfig');
                                                OA.areEqual({appConfig: 'true'},
                                                            output.page.appConfig,
                                                            'wrong output.page.appConfig');
                                                OA.areEqual({ x: 'y' },
                                                            output.page.routes,
                                                            'wrong output.page.routes');
                                            }
                                        };
                                    }
                                },
                                hooks: {
                                    enableHookGroup: function () { }
                                }
                            }
                        },
                        store: {
                            getStaticAppConfig: function () {
                                return {staticAppConfig: 'true'};
                            },
                            getAppConfig: function (ctx) {
                                OA.areEqual({runtime: 'server'},
                                            ctx,
                                            'wrong ctx');
                                return { appConfig: 'true' };
                            }
                        }
                    }
                }
            };
            res = { };
            next = function () {
                nextCalled = true;
            };

            dispatcher.handleRequest(req, res, next);

            A.areEqual(false, nextCalled, 'next should not have been called');
            A.areEqual(true, dispatcherCalled, 'Y.mojito.Dispatcher.init should have been called');
        },

        // verify that next() is called
        'test handleRequest when no command': function () {
            A.isFunction(dispatcher.handleRequest);

            var req,
                res,
                next,
                nextCalled = false;

            req = {
                context: {},
                app: { mojito: { store: { } } }
            };
            res = { };
            next = function () {
                nextCalled = true;
            };

            dispatcher.handleRequest(req, res, next);

            A.areEqual(true, nextCalled, 'next() should have been called');
        }
    }));

    Y.Test.Runner.add(suite);
});

