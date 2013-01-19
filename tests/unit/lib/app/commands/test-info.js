/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, stupid:true, plusplus:true */
/*globals YUI*/

YUI().use('test', function(Y) {

    var suite = new Y.Test.Suite('info tests'),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,

        libpath = require('path'),
        cmdpath = libpath.join(__dirname, '../../../../../lib/app/commands/info.js'),
        info = require(cmdpath),

        mockery = require('mockery'),
        mockPath;

    suite.add(new Y.Test.Case({

        name: 'info test cases',

        'test require': function() {
            A.isNotNull(info);
            A.isFunction(info.run, 'No run function exported');
            A.isString(info.usage, 'No usage string exported');
        },

        'test run info neg': function() {
            try {
                info.run(null, null, function(error) {
                    A.areSame('Error getting info.', error);
                });
            } catch (e) {
                A.areSame('Cannot read property \'name\' of undefined', e.message);
            }
        }
    }));

    Y.Test.Runner.add(suite);
});
