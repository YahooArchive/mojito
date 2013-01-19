/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, stupid:true, plusplus:true */
/*globals YUI*/

YUI().use('test', function(Y) {

    var suite = new Y.Test.Suite('docs1 tests'),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,

        libpath = require('path'),
        cmdpath = libpath.join(__dirname, '../../../../../lib/app/commands/docs.js'),

        mockery = require('mockery'),
        count,
        mocks,
        docs;

    mocks = {
        wrench: {
            rmdirSyncRecursive: function(dir) { count++; },
            mkdirSyncRecursive: function(dir) { count++; }
        },
        yuidocjs: {
            YUIDoc: function() { count++; },
            DocBuilder: function() { count++; },
            Server: {
                start: function() { count++; }
            }
        }
    };
    mocks.yuidocjs.YUIDoc.prototype.run = function() { count++; };
    mocks.yuidocjs.DocBuilder.prototype.compile = function() { count++; };

    mockery.registerAllowable(cmdpath);
    mockery.registerMock('wrench', mocks.wrench);
    mockery.registerMock('yuidocjs', mocks.yuidocjs);
    mockery.registerMock('yuidocjs.server', mocks.yuidocjs.server);
    mockery.enable({'warnOnUnregistered': false});
    docs = require(cmdpath);

    suite.add(new Y.Test.Case({

        name: 'docs test cases',

        setUp: function() {
            count = 0;
        },

        tearDown: function() {
            mockery.deregisterAll();
            mockery.disable();
        },

        'test run docs mojito': function() {
            var options = {
                server: null
            };
            A.areSame(0, count);
            docs.run(['MOJITO'], options, function() {});
            A.areSame(6, count);
        },

        'test run docs mojito server': function() {
            var options = {
                server: 'abc'
            };
            A.areSame(0, count);
            docs.run(['mojito'], options, function() {});
            A.areSame(3, count);
        },

        'test run docs app': function() {
            var options = {
                server: null
            };
            A.areSame(0, count);
            docs.run(['app'], options, function() {});
            A.areSame(6, count);
        },

        'test run docs app name': function() {
            var options = {
                server: null
            };
            A.areSame(0, count);
            docs.run(['app', 'myapp'], options, function() {});
            A.areSame(6, count);
        },

        'test run docs mojit name': function() {
            var options = {
                server: null
            };
            A.areSame(0, count);
            docs.run(['mojit', 'mymojit'], options, function() {});
            A.areSame(6, count);
        },

        'test run docs mojit': function() {
            var options = {
                server: null
            };
            A.areSame(0, count);
            docs.run(['mojit'], null, function() {});
            A.areSame(0, count);
        }

    }));

    Y.Test.Runner.add(suite);
});
