/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*global YUI, require*/
/*jslint nomen:true*/

YUI().use('mojito-test-extra', 'test', function (Y) {
    'use strict';

    var A  = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,

        factory = require(Y.MOJITO_DIR + 'lib/app/middleware/mojito-handler-tunnel-rpc'),
        expandedContext = null,
        req,
        nextCallCount,
        middleware,
        store,
        config;


    Y.Test.Runner.add(new Y.Test.Case({
        name: 'tunnel handler rpc tests',

        setUp: function () {
            nextCallCount = 0;

            store = {
                expandInstance: function (instance, context, callback) {
                    expandedContext = context;
                    callback(null, instance);
                }
            };

            config = {
                store: store
            };

            req = {
                _tunnel: {
                    rpcReq: {}
                },
                action: 'eatallyourspinach',
                body: {
                    instance: {},
                    context: {
                        runtime: 'client'
                    }
                }
            };
        },

        tearDown: function () {
            store           = null;
            config          = null;
            nextCallCount   = null;
            req             = null;
            expandedContext = null;
        },

        'handler should exit early if not an rpc request': function () {
            req._tunnel.rpcReq = null;

            middleware = factory(config);
            middleware(req, null, function () {
                nextCallCount += 1;
            });

            A.areSame(1, nextCallCount, 'next() handler should have been called');
            A.isNull(expandedContext, 'instance should not have been expanded');
        },

        'handler should override execution context to "server"': function () {
            middleware = factory(config);
            middleware(req, null, function () {
                nextCallCount += 1;
            });

            A.areSame(1, nextCallCount, 'next() handler should have been called');
            A.areSame(expandedContext.runtime, 'server', 'instance should have server context');
        },

        'handler should set execution context to "server"': function () {
            req.body.context.runtime = null;

            middleware = factory(config);
            middleware(req, null, function () {
                nextCallCount += 1;
            });

            A.areSame(1, nextCallCount, 'next() handler should have been called');
            A.areSame(expandedContext.runtime, 'server', 'instance should have server context');
        }
    }));
});
