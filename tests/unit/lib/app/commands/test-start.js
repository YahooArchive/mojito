/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, stupid:true, plusplus:true */
/*globals YUI*/

YUI().use('mojito', 'mojito-test-extra', 'test', function(Y) {

    var suite = new Y.Test.Suite('start tests'),
        A = Y.Assert,
        libpath = require('path'),
        cmdpath = libpath.join(__dirname, '../../../../../lib/app/commands/start.js'),
        mojito_src = libpath.resolve(__dirname, '../../../../../lib/mojito'),
        mockery = require('mockery'),
        mocks,
        start,
        port,
        context,
        perf,
        listenCalls;

    mocks = {
        Mojito: {
            createServer: function(options) {
                port = options.port;
                context = options.context;
                perf = options.perf;
                return {
                    listen: function(port, host, cb) { 
                        listenCalls++; 
                        cb(); 
                    }
                };
            }
        }
    };

    suite.add(new Y.Test.Case({

        name: 'start test cases basic',

        setUp: function() {
            start = require(cmdpath);
        },

        'test require': function() {
            A.isNotNull(start);
            A.isFunction(start.run, 'No run function exported');
            A.isString(start.usage, 'No usage string exported');
            A.isArray(start.options, 'No options array exported');
        }

    }));

    suite.add(new Y.Test.Case({

        name: 'start test cases',

        setUp: function() {
            mockery.registerAllowable(cmdpath);
            mockery.registerMock(mojito_src, mocks.Mojito);
            mockery.enable({'warnOnUnregistered': false, useCleanCache: true});
            start = require(cmdpath);
            listenCalls = 0;
            port = 0;
            context = null;
            perf = null;
        },

        'test run start': function() {
            A.areSame(0, listenCalls);
            start.run([null], null, function() {});
            A.areSame(1, listenCalls);
            A.areSame(8666, port);
        },

        'test run start port': function() {
            A.areSame(0, listenCalls);
            start.run([8667], null, function() {});
            A.areSame(1, listenCalls);
            A.areSame(8667, port);
        },

        'test run start context': function() {
            var options = {
                context: "environment:production"
            };
            A.areSame(0, listenCalls);
            start.run([8668], options, function() {});
            A.areSame(1, listenCalls);
            A.areSame(8668, port);
            A.areSame('production', context.environment);
        },

        'test run start perf': function() {
            var options = {
                perf: "abc"
            };
            A.areSame(0, listenCalls);
            start.run([8669], options, function() {});
            A.areSame(1, listenCalls);
            A.areSame(8669, port);
            A.areSame('abc', perf);
        }

    }));

    Y.Test.Runner.add(suite);
});
