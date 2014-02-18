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
        sub = Y.Lang.sub,
        libpath = require('path'),
        mockery = require('mockery'),
        suite = new Y.Test.Suite('lib/dispatcher tests'),
        libmiddleware,
        req,
        res,
        next;

    suite.add(new Y.Test.Case({
        'setUp': function () {
            libmiddleware = require('../../../lib/middleware');

            req = {
                app: {
                    mojito: {
                    }
                }
            };
            res = {};
            next = function () {};
        },
        'tearDown': function () {
            libmiddleware = null;

            req = null;
            res = null;
            next = null;
        },

        'test module.exports': function () {
            A.isFunction(libmiddleware.middleware);
        },

        'test build-in middleware registration': function () {
            A.isFunction(libmiddleware.middleware);
            var mid = libmiddleware.middleware;

            A.isFunction(mid['mojito-handler-static']);
            A.isFunction(mid['mojito-parser-body']);
            A.isFunction(mid['mojito-parser-cookies']);
            A.isFunction(mid['mojito-contextualizer']);
            A.isFunction(mid['mojito-handler-tunnel']);
        },

        'test middleware() function': function () {
            var midFn = libmiddleware.middleware();

            A.isFunction(midFn);
        },

        // verify that :
        // - "mojito-*" named middleware export a function that returns a
        //   middleware
        // - otherwise should export middleware function
        'test middleware() invocation': function () {
            var midFn = libmiddleware.middleware(),
                count = 0;

            req.app.mojito = {
                Y: {
                    log: function () {}
                },
                store: {
                    getStaticAppConfig: function () {
                        return {
                            middleware: [
                                'mojito-foo.js',
                                'foo.js'
                            ]
                        };
                    }
                },
                options: {
                    root: libpath.resolve(__dirname, '../../fixtures', 'middleware')
                },
                _options: {
                    context: { foo: 'bar' }
                }
            };

            next = function () { count = count + 1; };

            midFn(req, res, next);

            A.areEqual(1, count, 'next() should be invoked once');
            A.isNotUndefined(res.midConfig.Y);
            A.isNotUndefined(res.midConfig.store);
            A.isNotUndefined(res.midConfig.logger);
            A.isNotUndefined(res.midConfig.context);
        }

    }));

    Y.Test.Runner.add(suite);
});

