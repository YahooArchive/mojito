/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, stupid:true, plusplus:true */
/*globals YUI*/

YUI().use('test', function(Y) {

    var suite = new Y.Test.Suite('start tests'),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,

        libpath = require('path'),
        cmdpath = libpath.join(__dirname, '../../../../../lib/app/commands/start.js'),
        libutils = require(libpath.join(__dirname, '../../../../../lib/management/utils.js')),
        start = require(cmdpath);

    suite.add(new Y.Test.Case({

        name: 'start test cases',

        'test require': function() {
            A.isNotNull(start);
            A.isFunction(start.run, 'No run function exported');
            A.isString(start.usage, 'No usage string exported');
            A.isArray(start.options, 'No options array exported');
        },

        'test run start': function() {
            var mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "log",
                args: [Y.Mock.Value.String],
                run: function (message) {
                    A.isTrue(/Mojito\(/.test(message));
                    A.isTrue(/started on http:\/\//.test(message));
                }
            });
            libutils.test.setConsole(mockConsole);
            start.run([null], null, function() {});
        },

        'test run start port': function() {
            var mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "log",
                args: [Y.Mock.Value.String],
                run: function (message) {
                    A.isTrue(/Mojito\(/.test(message));
                    A.isTrue(/started on http:\/\//.test(message));
                }
            });
            libutils.test.setConsole(mockConsole);
            start.run(["8667"], null, function() {});
        },

        'test run start context': function() {
            var options = {
                context: "environment:production"
            },
                mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "log",
                args: [Y.Mock.Value.String],
                run: function (message) {
                    A.isTrue(/Mojito\(/.test(message));
                    A.isTrue(/started on http:\/\//.test(message));
                }
            });
            libutils.test.setConsole(mockConsole);
            start.run(['8668'], options, function() {});
        },

        'test run start perf': function() {
            var options = {
                perf: "abc"
            },
                mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "log",
                args: [Y.Mock.Value.String],
                run: function (message) {
                    A.isTrue(/Mojito\(/.test(message));
                    A.isTrue(/started on http:\/\//.test(message));
                }
            });
            libutils.test.setConsole(mockConsole);
            start.run(["8669"], options, function() {});
        }

    }));

    Y.Test.Runner.add(suite);
});
