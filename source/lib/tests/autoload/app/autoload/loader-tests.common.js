/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-loader-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        stashYGet, yGetPasses = true, yGetLoaded,
        A = YUITest.Assert,
        AA = YUITest.ArrayAssert,
        OA = YUITest.ObjectAssert;

    suite.add(new YUITest.TestCase({

        name: 'Loader (client) tests',

        setUp: function() {
            stashYGet = Y.Get;
            Y.Get = {
                script: function(scripts, cfg) {
                    if (! yGetPasses) {
                        cfg.onFailure();
                        return;
                    }
                    yGetLoaded = scripts;
                    if (typeof window !== 'undefined') {
                        cfg.onSuccess();
                    }
                    else {
                        for (var i=0; i<scripts.length; i++) {
                            cfg.onSuccess();
                        }
                    }
                }
            };
        },

        tearDown: function() {
            Y.Get = stashYGet;
        },


        'load() succeeds': function() {
            var appConfig = {};
            var loader = new Y.mojito.Loader(appConfig);
            A.isNotUndefined(loader);
            YUI.Env.mods.y = true;

            var paths = {
                x: 'xxx.js',
                y: 'yyy.js',
                z: 'zzz.js'
            };

            yGetLoaded = [];
            loader.load(paths, function(err) {
                A.isFalse(!!err);
                AA.itemsAreEqual(['xxx.js','zzz.js'], yGetLoaded);
            });
        },


        'load() succeeds w/out dupes': function() {
            var appConfig = {};
            var loader = new Y.mojito.Loader(appConfig);
            A.isNotUndefined(loader);

            var paths = {
                x: 'xxx.js',
                y: 'xxx.js',
                z: 'zzz.JS'
            };

            yGetLoaded = [];
            loader.load(paths, function(err) {
                A.isFalse(!!err);
                AA.itemsAreEqual(['xxx.js','zzz.JS'], yGetLoaded);
            });
        },


        'load() fails': function() {
            var appConfig = {};
            var loader = new Y.mojito.Loader(appConfig);
            A.isNotUndefined(loader);
            YUI.Env.mods.y = true;

            var paths = {
                x: 'xxx.js',
                y: 'yyy.js',
                z: 'zzz.js'
            };

            yGetPasses = false;
            yGetLoaded = [];
            loader.load(paths, function(err) {
                A.isTrue(!!err);
            });
        },


        'create yui-lib combo URLs': function() {
            var appConfig = {};
            var loader = new Y.mojito.Loader(appConfig);
            A.isNotUndefined(loader);
            var modules = [
                'yui',
                'collection',
                'oop',
                'dom-base',
                'selector-css2',
                'array-extras'
            ];
            var filter = 'debug';
            var got = loader.createYuiLibComboUrl(modules, filter);
            var expected = [
                'http://yui.yahooapis.com/combo?' + 
                '3.4.1/build/yui/yui-debug.js&' +
                '3.4.1/build/yui-base/yui-base-debug.js&' + 
                '3.4.1/build/collection/collection-debug.js&' +
                '3.4.1/build/oop/oop-debug.js&' +
                '3.4.1/build/features/features-debug.js&' +
                '3.4.1/build/dom-core/dom-core-debug.js&' +
                '3.4.1/build/dom-base/dom-base-debug.js&' +
                '3.4.1/build/selector-native/selector-native-debug.js&' +
                '3.4.1/build/selector-css2/selector-css2-debug.js'
            ];
            AA.itemsAreEqual(expected, got.js);
            A.isArray(got.css);
        }


    }));

    YUITest.TestRunner.add(suite);

}, '0.1.0', {requires: ['mojito-loader']});
