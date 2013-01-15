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

    suite.add(new Y.Test.Case({

        name: 'info test cases',

        setUp: function() {
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
            mockPath = {
                resolve: function(file) {
                    return libpath.join(__dirname, '../../../../../package.json');
                }
            };
            mockery.registerAllowable(cmdpath);
            mockery.registerMock('path', mockPath);
            mockery.enable({'warnOnUnregistered': false});
            info = require(cmdpath);
            info.run(null, null, function() {});
        }
    }));

    Y.Test.Runner.add(suite);
});
