/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, stupid:true, plusplus:true */
/*globals YUI*/

YUI().use('mojito-test-extra', 'test', 'json-parse', 'json-stringify', function(Y) {

    var suite = new Y.Test.Suite('test compile'),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,

        libpath = require('path'),
        cmdpath = libpath.join(__dirname, '../../../../../lib/app/commands/compile.js');


    suite.add(new Y.Test.Case({

        name: 'test compile cases basic',


        'test require': function() {
            var compilecmd = require(cmdpath);
            A.isObject(compilecmd);
            A.isFunction(compilecmd.run, 'No run function exported');
            A.isString(compilecmd.usage, 'No usage string exported');
            A.isArray(compilecmd.options, 'No options array exported');
        },


        'test getInlineCssMojits': function() {
            var compilecmd = require(cmdpath);
            var fixtures = libpath.join(__dirname, '../../../../fixtures/store');
            var context = {};
            var store = {
                _mkRes: function(type, subtype, name, mojit, path) {
                    return {
                        type: type,
                        subtype: subtype,
                        name: name,
                        mojit: mojit,
                        source: {
                            fs: {
                                fullPath: libpath.join(fixtures, path)
                            },
                            pkg: {
                                name: 'store'
                            }
                        },
                        url: '/static/' + [type, subtype, name].join('-')
                    };
                },
                listAllMojits: function() {
                    return ['orange', 'red'];
                },
                getResources: function(env, ctx, filter) {
                    if ('mojit' === filter.type) {
                        return [
                            this._mkRes('mojit', null, filter.mojit, null, 'mojits/' + filter.name)
                        ];
                    }
                    return [
                        this._mkRes('asset', 'css', 'foo', filter.mojit, 'mojits/' + filter.mojit + '/assets/foo.css'),
                        this._mkRes('asset', 'css', 'bar', filter.mojit, 'mojits/' + filter.mojit + '/assets/bar.css')
                    ];
                },
                selector: {
                    getPOSLFromContext: function(ctx) {
                        return [ 's2', 's1', '*' ];
                    }
                }
            };

            A.isObject(compilecmd);
            A.isFunction(compilecmd.test.getInlineCssMojits);
            var have = compilecmd.test.getInlineCssMojits(store, 'client', context);
            var want = [
                {
                    mojitName: 'orange',
                    yuiModuleName: 'inlinecss/orange',
                    dest: fixtures + '/mojits/orange/autoload/compiled/inlinecss.s2.common.js',
                    srcs: {
                        '/static/asset-css-foo': true,
                        '/static/asset-css-bar': true
                    }
                },
                {
                    mojitName: 'red',
                    yuiModuleName: 'inlinecss/red',
                    dest: fixtures + '/mojits/red/autoload/compiled/inlinecss.s2.common.js',
                    srcs: {
                        '/static/asset-css-foo': true,
                        '/static/asset-css-bar': true
                    }
                }
            ];
            Y.TEST_CMP(want, have);
        }


    }));


    Y.Test.Runner.add(suite);
});
