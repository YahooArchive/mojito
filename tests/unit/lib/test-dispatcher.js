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
            dispatcher.resetRoutesConfig();
        },
        'test OK': function () {
            A.isFunction(function () { });
        },

        'test resetRoutesConfig': function () {
            A.isFunction(dispatcher.resetRoutesConfig);
        },

        // verify:
        // - handleRequest() is called()
        'test dispatch': function () {
            A.isFunction(dispatcher.dispatch);

            var cb,
                req,
                res,
                next,
                mid,
                handleRequestCalled = false,
                fn;

            cb = function () { };

            fn = dispatcher.handleRequest;
            dispatcher.handleRequest = function (req, res, next) {
                handleRequestCalled = true;
            };

            req = {
                app: {
                    mojito: { },
                    routes: {
                        get: [{
                            path: '/path',
                            method: 'get',
                            regexp: /^\/path\/?/,
                            keys: [ ],
                            params: { },
                            callbacks: [ cb ]
                        }]
                    }
                },
                url: '/admin',
                query: { foo: 'bar' },
                params: { foz: 'baz' },
                context: { runtime: 'server' }
            };

            mid = dispatcher.dispatch('admin.help');
            A.isFunction(mid, 'dispatch() should return middleware()');
            A.areEqual(3, mid.length, 'wrong # of args');

            mid(req, res, next);

            A.areEqual('help', req.command.action, 'wrong action');
            OA.areEqual({ base: 'admin' }, req.command.instance, 'wrong instance');
            OA.areEqual(req.context, req.command.context, 'wrong command.context');
            OA.areEqual(req.query, req.command.params.url, 'wrong params.url');
            OA.areEqual(req.params, req.command.params.route, 'wrong params.route');
            A.areEqual(true, handleRequestCalled, 'handleRequest was not called');

            dispatcher.handleRequest = fn;
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
                    getRouteMap: function () {
                        return { foobar: { A: 'B' } };
                    },
                    mojito: {
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
                                                OA.areEqual({ A: 'B' },
                                                            output.page.routes.foobar,
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

