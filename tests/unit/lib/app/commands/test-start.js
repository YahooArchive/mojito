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
        count;

    mocks = {
        Mojito: {
            createServer: function(options) {
                return {
                    listen: function(port, host, cb) { count++; cb(); }
                };
            }
        }
    };

    suite.add(new Y.Test.Case({

        name: 'start test cases',

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
            count = 0;
        },

        'test run start': function() {
            A.areSame(0, count);
            start.run([null], null, function() {});
            A.areSame(1, count);
        },

        'test run start port': function() {
            A.areSame(0, count);
            start.run(["8667"], null, function() {});
            A.areSame(1, count);
        },

        'test run start context': function() {
            var options = {
                context: "environment:production"
            };
            A.areSame(0, count);
            start.run(['8668'], options, function() {});
            A.areSame(1, count);
        },

        'test run start perf': function() {
            var options = {
                perf: "abc"
            };
            A.areSame(0, count);
            start.run(["8669"], options, function() {});
            A.areSame(1, count);
        }

    }));

    Y.Test.Runner.add(suite);
});
