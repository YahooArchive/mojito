/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, stupid:true, plusplus:true */
/*globals YUI*/

YUI().use('test', function(Y) {

    var suite = new Y.Test.Suite('help tests'),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,

        libpath = require('path'),
        cmdpath = libpath.join(__dirname, '../../../../../lib/app/commands/help.js'),
        libutils = require(libpath.join(__dirname, '../../../../../lib/management/utils.js')),
        help = require(cmdpath);

    suite.add(new Y.Test.Case({

        name: 'help test cases',

        'test require': function() {
            A.isNotNull(help);
            A.isFunction(help.run, 'No run function exported');
            A.isString(help.usage, 'No usage string exported');
        },

        'test run help': function() {
            try {
                help.run(['help'], null, function() {});
            } catch (e) {
                A.fail('Run exception: ' + e.message);
            }
        },

        'test run help1': function() {
            var mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "log",
                args: [Y.Mock.Value.String],
                run: function (message) {
                    A.isTrue(/Available commands/.test(message));
                }
            });
            libutils.test.setConsole(mockConsole);
            help.run([null], null, function() {});
        },

        'test run cmd help test': function() {
            try {
                help.run(['test'], null, function() {});
            } catch (e) {
                A.fail('Run exception: ' + e.message);
            }
        },

        'test run wrong cmd': function() {
            try {
                help.run(['abc'], null, function() {});
            } catch (e) {
                A.fail('Run exception: ' + e.message);
            }
        }

    }));

    Y.Test.Runner.add(suite);
});
