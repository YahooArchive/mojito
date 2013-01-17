/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, stupid:true, plusplus:true */
/*globals YUI*/

YUI().use('test', function(Y) {

    var suite = new Y.Test.Suite('docs tests'),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,

        libpath = require('path'),
        cmdpath = libpath.join(__dirname, '../../../../../lib/app/commands/docs.js'),
        libutils = require(libpath.join(__dirname, '../../../../../lib/management/utils.js')),
        docs = require(cmdpath),

        mockery = require('mockery'),
        mockPath;

    suite.add(new Y.Test.Case({

        name: 'docs test cases',

        'test require': function() {
            A.isNotNull(docs);
            A.isFunction(docs.run, 'No run function exported');
            A.isString(docs.usage, 'No usage string exported');
            A.isArray(docs.options, 'No options array exported');
        },

        'test run docs': function() {
            var mockConsole = Y.Mock();
            Y.Mock.expect(mockConsole, {
                method: "error",
                args: [Y.Mock.Value.Any],
                run: function (err) {
                    A.isTrue(/✖ Unknown type/.test(err));
                }
            });
            libutils.test.setConsole(mockConsole);
            docs.run([null], null, function() {});
        }

    }));

    Y.Test.Runner.add(suite);
});
