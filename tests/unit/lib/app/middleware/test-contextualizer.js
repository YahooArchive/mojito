/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-testutils', 'test', function(Y) {
    var A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,
        cases = {},

        contextualizer = require(Y.u.abspath('lib/app/middleware/mojito-contextualizer.js')),
        handler,
        res,
        nextCalled;

    function nextFn() {
        nextCalled = true;
    };

    cases = {
        name: 'basic',

        setUp: function() {
            handler = contextualizer({
                context: {},
                logger: function() {}
            });
            res = null;
            nextCalled = false;
        },

        'test this should not explode': function () {
            A.isTrue(true);
        },

        'request enriched': function() {
            var req = {
                    url: '/amoduleid/anything',
                    headers: {}
                };

            handler(req, res, nextFn);

            A.isNotNull(req.context, 'No context was found in request');
            A.areSame('server', req.context.runtime, 'runtime has wrong value');
            A.isTrue(nextCalled, 'next() was not called');
        },

        'request find user agent': function() {
            var req = {
                url: '/amoduleid/anything',
                headers: {
                    'user-agent': 'iphone'
                }
            };
            
            handler(req, res, nextFn);
            
            A.areSame('iphone', req.context.device);
        },

        'bug4368914 bad case in Accept-Language header': function() {
            var req = {
                url: '/amoduleid/anything',
                headers: {
                    'accept-language': 'en-us,en;q=0.7;de;q=0.3'
                }
            };
            
            handler(req, res, nextFn);
            
            A.areEqual('en-US', req.context.lang);
        }

    };

    Y.Test.Runner.add(new Y.Test.Case(cases));
});
