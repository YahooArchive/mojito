/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, stupid:true, plusplus:true */
/*globals YUI*/

YUI().use('test', function(Y) {

    var suite = new Y.Test.Suite('info1 tests'),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,

        libpath = require('path'),
        cmdpath = libpath.join(__dirname, '../../../../../lib/app/commands/info.js'),

        mockery = require('mockery'),
        mockPath,
        info;

    mockPath = {
        resolve: function(file) {
            return libpath.join(__dirname, '../../../../../package.json');
        }
    };

    suite.add(new Y.Test.Case({

        name: 'info1 test cases',

        setUp: function() {
            mockery.registerAllowable(cmdpath);
            mockery.registerMock('path', mockPath);
            mockery.enable({'warnOnUnregistered': false});
            info = require(cmdpath);
        },

        tearDown: function() {
            mockery.deregisterAll();
            mockery.disable({
                'useCleanCache': true,
                'warnOnUnregistered': false,
                'warnOnReplace': false
            });
        },

        'test run info': function() {
            info.run(null, null, function(err, usage, die) {
                A.isUndefined(err);
            });
        }
    }));

    Y.Test.Runner.add(suite);
});
