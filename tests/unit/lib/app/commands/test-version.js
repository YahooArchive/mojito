/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, stupid:true, plusplus:true */
/*globals YUI*/

YUI().use('test', function(Y) {

    var suite = new Y.Test.Suite('version tests'),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,

        libpath = require('path'),
        cmdpath = libpath.join(__dirname, '../../../../../lib/app/commands/version.js'),
        libutils = require(libpath.join(__dirname, '../../../../../lib/management/utils.js')),
        version = require(cmdpath);

    suite.add(new Y.Test.Case({

        name: 'version test cases',

        'test require': function() {
            A.isNotNull(version);
            A.isFunction(version.run, 'No run function exported');
            A.isString(version.usage, 'No usage string exported');
        },

        'test run mojito': function() {
            var mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "log",
                args: [Y.Mock.Value.String],
                run: function (message) {
                    A.isTrue(/Version of mojito is/.test(message));
                }
            });
            libutils.test.setConsole(mockConsole);
            version.run(null, null, function() {});
        },

        'test run mojito1': function() {
            try {
                version.run(null, null, function() {});
            } catch (e) {
                A.fail('Run exception: ' + e.message);
            }
        },

        'test run mojit': function() {
            var mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "error",
                args: [Y.Mock.Value.Any],
                run: function (err) {
                    A.isTrue(/no such file or directory/.test(err));
                    A.isTrue(/mojits\/package.json/.test(err));
                }
            });
            libutils.test.setConsole(mockConsole);
            version.run(["mojit", ""], null, function() {});
        },

        'test run app': function() {
            var mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "error",
                args: [Y.Mock.Value.Any],
                run: function (err) {
                    A.isTrue(/no such file or directory/.test(err));
                    A.isTrue(/package.json/.test(err));
                }
            });
            libutils.test.setConsole(mockConsole);
            version.run(["app"], null, function() {});
        },

        'test run wrong params': function() {
            var mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "error",
                args: [Y.Mock.Value.Any],
                run: function (err) {
                    A.isTrue(/Unrecognized parameter: wrongparam/.test(err));
                }
            });
            libutils.test.setConsole(mockConsole);
            version.run(["wrongparam"], null, function() {});
        }
    }));

    Y.Test.Runner.add(suite);
});
