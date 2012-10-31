/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-test-extra', 'test', function(Y) {
    var libvm = require('vm'),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        cases = {},
        factory = require(Y.MOJITO_DIR + 'lib/app/middleware/mojito-combo-handler');


    // returns the data from examples/getting-started-guide/part4/paged-flickr
    function makeStore() {
        var store = {
                getAppConfig: function() { return {}; },
                getResourceVersions: function() { return []; },
                listAllMojits: function() { return []; }
            };
        return store;
    }


    // @param {array} capture (optional) a list to which all logs are appended
    function makeLogger(capture) {
        return {
            log: function(msg, lvl, src) {
                if (capture) {
                    capture.push({
                        msg: msg,
                        lvl: lvl,
                        src: src
                    });
                }
            }
        };
    }


    function parseConfig(config) {
        var ctx = { x: undefined };
        config = 'x = ' + config + ';';
        libvm.runInNewContext(config, ctx, 'config');
        return ctx.x;
    }


    cases = {
        name: 'combo handler tests',


        'bad or missing files': function() {
            var logs = [],
                handler = factory({
                    context: {},
                    store: makeStore(),
                    logger: makeLogger(logs)
                });

            var req = {
                    method: 'GET',
                    url: '/combo?PagedFlickr.js&PagedFlickrModel.js'
                };
            var writeHeadCalled = 0,
                gotCode,
                gotHeaders,
                res = {
                    writeHead: function(code, headers) {
                        writeHeadCalled += 1;
                        gotCode = code;
                        gotHeaders = headers;
                    },
                    end: function(body) {
                        var i;
                        A.areSame(1, writeHeadCalled);
                        A.areSame(400, gotCode);
                        A.isUndefined(gotHeaders);
                        A.isUndefined(body);
                        A.isTrue(logs[1].msg.indexOf('Invalid module name: PagedFlickr') === 0, 'PagedFlickr.js not found');
                    }
                };
            handler(req, res);
        }


    };

    Y.Test.Runner.add(new Y.Test.Case(cases));
});
