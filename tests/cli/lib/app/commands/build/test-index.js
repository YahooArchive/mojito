/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-test-extra', 'test', function(Y) {

    var A = Y.Assert,
        V = Y.Mock.Value,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,
        cases,

        mockery = require('mockery'),
        srcpath = Y.MOJITO_DIR + 'lib/app/commands/build/index.js',
        mocks,
        index;


    function valfn(val/*return value*/, assert/*arg type assertion cb*/) {
        return function(arg) {
            if (assert) {
                assert(arg);
            }
            return val;
        };
    }

    mocks = {
        store: {
            createStore: valfn({}, function (opts) {
                A.isObject(opts);
                A.isString(opts.root);
                A.isObject(opts.context);
            })
        },
        util: {
            contextCsvToObject: valfn({}, A.isString),
            isMojitoApp: valfn(true, A.isString)
        },
        writer: {
            rmrf: function (dir, cb) {
                A.isString(dir);
                cb();
            }
        }
    };

    mockery.registerAllowable(srcpath);
    mockery.registerMock(Y.MOJITO_DIR + 'lib/store', mocks.store);
    mockery.registerMock(Y.MOJITO_DIR + 'lib/management/utils', mocks.util);
    mockery.registerMock('./writer', mocks.writer);
    mockery.enable({'warnOnUnregistered': false});
    index = require(srcpath);

    cases = {
        name: 'build/index.js cases',
        setUp: function() {},
        tearDown: function() {},

        'test exports': function () {
            A.isArray(index.options);
            A.isString(index.usage);
            A.areSame(6, index.options.length);
            A.isFunction(index.run);
        },

        'test missing type arg': function () {
            index.run([], {}, function(err, usg, seppuku) {
                A.isString(err);
                A.isNull(usg);
                A.isTrue(seppuku);
                A.areSame('Missing type', err);
            });
        },

        'test invalid type arg': function () {
            index.run(['chubby'], {}, function(err, usg, seppuku) {
                A.isString(err);
                A.isNull(usg);
                A.isTrue(seppuku);
                A.areSame('Invalid type', err);
            });
        },

        'test missing type arg': function () {
            index.run([], {}, function(err, usg, seppuku) {
                A.isString(err);
                A.isNull(usg);
                A.isTrue(seppuku);
                A.areSame('Missing type', err);
            });
        },

        'test valid type, invalid cwd': function () {
            var old = mocks.util.isMojitoApp,
                expected = 'Not a Mojito directory';

            // purposely having run() "fail" early
            mocks.util.isMojitoApp = valfn(false, A.isString);

            index.run(['html5app'], {}, function(err, usg, seppuku) {
                A.isString(err);
                A.isNull(usg);
                A.isTrue(seppuku);
                A.areSame(expected, err);
            });

            mocks.util.isMojitoApp = old;
        },

        'test type is case-insensitive': function () {
            var old = mocks.util.isMojitoApp,
                expected = 'Not a Mojito directory';// this msg says

            // purposely having run() "fail" early
            mocks.util.isMojitoApp = valfn(false, A.isString);

            index.run(['HTML5APP'], {}, function(err, usg, seppuku) {
                A.isString(err);
                A.isNull(usg);
                A.isTrue(seppuku);
                A.areSame(expected, err);
            });

            index.run(['HtmL5aPP'], {}, function(err, usg, seppuku) {
                A.isString(err);
                A.isNull(usg);
                A.isTrue(seppuku);
                A.areSame(expected, err);
            });

            mocks.util.isMojitoApp = old;
        },

        'test hybridapp requires snapshot options': function () {
            var old = mocks.util.isMojitoApp,
                expected = 'Not a Mojito directory';

            // purposely having run() "fail" early
            mocks.util.isMojitoApp = valfn(false, A.isString);

            index.run(['hybridapp'], {}, function(err, usg, seppuku) {
                A.isString(err);
                A.isNull(usg);
                A.isTrue(seppuku);
                // err is from options check
                A.areSame('Build hybridapp requires --snapshotName and --snapshotTag', err);
            });

            index.run(['hybridapp'], {snapshotName: 1, snapshotTag:1}, function(err, usg, seppuku) {
                A.isString(err);
                A.isNull(usg);
                A.isTrue(seppuku);
                // options checked out for hybridapp
                A.areSame(expected, err);
            });

            mocks.util.isMojitoApp = old;
        },

//         'test -r invokes rmrf': function () {
//             
//             index.run(['html5app'], {replace: true}, function(err, usg, seppuku) {
//                 A.isString(err);
//                 A.isNull(usg);
//                 A.isTrue(seppuku);
//                 //A.areSame();
//             });
//         },

    };

    Y.Test.Runner.add(new Y.Test.Case(cases));
});
