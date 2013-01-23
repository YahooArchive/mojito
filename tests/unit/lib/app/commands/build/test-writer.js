/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-test-extra', 'test', function(Y) {

    var A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,
        cases,

        mockery = require('mockery'),
        srcpath = Y.MOJITO_DIR + 'lib/app/commands/build/writer.js',
        count,
        mocks,
        writer;

    mocks = {
        fs: {
            readFileSync: function(file) { count++; return file; },
            writeFileSync: function(file, str) { count++; },
            copy: function(from, to) { count++; }
        },
        mkdirp: {
            sync: function(dir) { count++; }
        },
        rimraf: function(dir, cb) { count++;cb(dir); },
        wrench: {
            copyDirSyncRecursive: function(dir) { count++; }
        }
    };

    mockery.registerAllowable(srcpath);
    mockery.registerMock('fs', mocks.fs);
    mockery.registerMock('mkdirp', mocks.mkdirp);
    mockery.registerMock('rimraf', mocks.rimraf);
    mockery.registerMock('wrench', mocks.wrench);
    mockery.enable({'warnOnUnregistered': false});
    writer = require(srcpath);

    cases = {
        name: 'build/writer.js test cases',

        setUp: function() {
            count = 0;
        },

        tearDown: function() {
            mockery.disable();
        },

        'test read': function () {
            A.areSame('abc', writer.read('abc'));
        },

        'test write': function () {
            var f = 'moby/dick',
                c = 'they call me Ishmael';
            A.areSame(0, count);
            writer.write(f, c);
            A.areSame(2, count);
        },

        'test writeJson': function () {
            var f = 'moby/dick',
                c = {they: 'call me Ishmael'};
            A.areSame(0, count);
            writer.writeJson(f, c);
            A.areSame(2, count);
        },

        'test copy': function () {
            A.areSame(0, count);
            writer.copy('from', 'to');
            A.areSame(3, count);
        },

        'test copydir': function () {
            A.areSame(0, count);
            writer.copydir('from', 'to');
            A.areSame(1, count);
        },

        'test rmrf': function () {
            var dir = 'doomed/dir';
            A.areSame(0, count);
            writer.rmrf(dir, function (d) {
                A.areSame(dir, d);
            });
            A.areSame(1, count);
        }
    };

    Y.Test.Runner.add(new Y.Test.Case(cases));
});
