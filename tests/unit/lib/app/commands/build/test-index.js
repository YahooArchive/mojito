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


    // curry/factory for simple cb functions
    function valfn(val/*return value*/, assert/*arg type assertion cb*/) {
        return function(arg) {
            if (assert) {
                assert(arg);
            }
            return val;
        };
    }

    // so we can mutate mocks, and refresh
    function getMocks() {
        return {
            store: {
                createStore: function (opts) {
                    A.isObject(opts);
                    A.isString(opts.root);
                    A.isObject(opts.context);

                    return {
                        getAppConfig: valfn({}, A.isObject),
                        getResourceVersions: function(obj) {
                            A.areSame(obj.name, 'package');
                            return [{
                                source:{
                                    pkg:{
                                        name:'name',
                                        version:'0.0',
                                    },
                                    fs: 'some/dir'
                                }
                            }];
                        }
                    };
                },
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
    }

    // mock functions within the modules require()'d by index.js
    mocks = getMocks();
    mockery.registerAllowable(srcpath);
    mockery.registerMock(Y.MOJITO_DIR + 'lib/store', mocks.store);
    mockery.registerMock(Y.MOJITO_DIR + 'lib/management/utils', mocks.util);
    mockery.registerMock('./writer', mocks.writer);
    mockery.enable({'warnOnUnregistered': false});
    index = require(srcpath);

    cases = {
        name: 'build/index.js cases',

        setUp: function() {
        },

        tearDown: function() {
            // need to update just the leaf values so references in mockery are
            // preserved
            var cleanmocks = getMocks();
            Object.keys(cleanmocks).forEach(function(key1) {
                Object.keys(cleanmocks[key1]).forEach(function(key2) {
                    mocks[key1][key2] = cleanmocks[key1][key2];
                });
            });
        },

        'test exports': function () {
            A.isArray(index.options);
            A.isString(index.usage);
            A.areSame(4, index.options.length);
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
            var expected = 'Not a Mojito directory';

            // purposely having run() "fail" early to limit test scope
            mocks.util.isMojitoApp = valfn(false, A.isString);

            index.run(['html5app'], {}, function(err, usg, seppuku) {
                A.isString(err);
                A.isNull(usg);
                A.isTrue(seppuku);
                A.areSame(expected, err);
            });
        },

        'test type is case-insensitive': function () {
            var expected = 'Not a Mojito directory';// this msg says

            // purposely having run() "fail" early to limit test scope
            mocks.util.isMojitoApp = valfn(false, A.isString);

            index.run(['HTML5APP'], {}, function(err, usg, seppuku) {
                A.isString(err);
                A.isNull(usg);
                A.isTrue(seppuku);
                A.areSame(expected, err);
            });

            index.run(['htML5apP'], {}, function(err, usg, seppuku) {
                A.isString(err);
                A.isNull(usg);
                A.isTrue(seppuku);
                A.areSame(expected, err);
            });
        },

        'test -r invokes rmrf': function () {

            mocks.writer.rmrf = function(dir, cb) {
                A.isTrue(/artifacts\/builds/.test(dir), 'expected default build dir str');
                cb('fake rm -rf error');
            }

            index.run(['html5app'], {replace: true}, function(err, usg, seppuku) {
                A.isString(err);
                A.isNull(usg);
                A.isTrue(seppuku);
                A.isTrue(/Error removing /.test(err));
                A.isTrue(/fake rm -rf error/.test(err));
            });
        },

    };

    Y.Test.Runner.add(new Y.Test.Case(cases));
});
