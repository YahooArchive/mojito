/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-assets-addon-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        addon,
        A = YUITest.Assert,
        AA = YUITest.ArrayAssert,
        OA = YUITest.ObjectAssert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'basics',

        setUp: function() {
            addon = new Y.mojito.addons.ac.assets({instance: {}});
            addon.mojitType = 'foo';
            YUI.namespace('_mojito._cache.compiled');
        },

        tearDown: function() {
            addon = null;
        },

        'one top css with type and location': function() {
            var css = '<style>.foo { color:red; }</style>';

            addon.addAsset('css', 'top', css);

            var result = addon.getAssets('top');

            A.isObject(result.top, 'missing top block');
            A.isObject(result.top.css, 'missing top.css block');
            A.isArray(result.top.css, 'top.css should be an array');
            A.areSame(1, result.top.css.length, 'bad top.css array length');
            A.areSame(css, result.top.css[0], 'bad css value');

        },

        'one bottom css with type and location': function() {
            var css = '<style>.foo { color:red; }</style>';

            addon.addAsset('css', 'bottom', css);

            var res = addon.getAssets('bottom');

            A.isObject(res.bottom, 'missing bottom block');
            A.isUndefined(res.top, 'bottom.css should not exist');
            A.isObject(res.bottom.css, 'missing bottom.css block');
            A.isArray(res.bottom.css, 'bottom.css should be an array');
            A.areSame(1, res.bottom.css.length, 'bad bottom.css array length');
            A.areSame(css, res.bottom.css[0], 'bad css value');

        },

        'two css with type and location': function() {
            var css1 = '<style>.foo { color:red; }</style>';
            var css2 = '<style>.bar { color:yellow; }</style>';

            addon.addAsset('css', 'top', css1);
            addon.addAsset('css', 'top', css2);

            var res = addon.getAssets('top');

            A.areSame(2, res.top.css.length, 'bad css.top array length');
            A.areSame(css1, res.top.css[0], 'bad css value');
            A.areSame(css2, res.top.css[1], 'bad css value');

        },

        'two css with type and location, one top, one bottom': function() {
            var css1 = '<style>.foo { color:red; }</style>';
            var css2 = '<style>.bar { color:yellow; }</style>';

            addon.addAsset('css', 'top', css1);
            addon.addAsset('css', 'bottom', css2);

            var t = addon.getAssets('top');
            var b = addon.getAssets('bottom');

            A.areSame(1, t.top.css.length, 'bad css.top array length');
            A.areSame(1, t.top.css.length, 'bad css.bottom array length');
            A.areSame(css1, t.top.css[0], 'bad top css value');
            A.areSame(css2, b.bottom.css[0], 'bad bottom css value');

        },

        'addCss() with location override': function() {
            var css = 'css';

            addon.addCss(css, 'bottom');

            var btm = addon.getAssets('bottom');

            A.areSame(1, btm.bottom.css.length, 'bad bottom array length');
            A.areSame(css, btm.bottom.css[0], 'bad css');
        },

        'addCss() with no location provides default "top"': function() {
            var css = 'css';

            addon.addCss(css);

            var b = addon.getAssets('bottom');
            var t = addon.getAssets('top');

            A.isUndefined(b.bottom, 'bottom should not be defined');
            A.areSame(1, t.top.css.length, 'bad top array length');
            A.areSame(css, t.top.css[0], 'badd css');
        },

        'addBlob() with location override': function() {

            var blob = '<div>&lt;span&gt;This is escaped markup&lt;/span&gt;</div>';

            addon.addBlob(blob, 'bottom');

            var btm = addon.getAssets('bottom');

            A.areSame(1, btm.bottom.blob.length, 'bad bottom array length');
            A.areSame(blob, btm.bottom.blob[0], 'bad blob');
        },

        'addBlob() with no location provides default "bottom"': function() {

            var blob = '<div>&lt;span&gt;This is escaped markup&lt;/span&gt;</div>';

            addon.addBlob(blob)

            var b = addon.getAssets('bottom');
            var t = addon.getAssets('top');

            A.isUndefined(t.top, 'top should not be defined');
            A.areSame(1, b.bottom.blob.length, 'bad bottom array length');
            A.areSame(blob, b.bottom.blob[0], 'bad blob');
        },

        'addJs() with location override': function() {
            var js = 'js';

            addon.addJs(js, 'top');

            var t = addon.getAssets('top');

            A.areSame(1, t.top.js.length, 'bad bottom array length');
            A.areSame(js, t.top.js[0], 'bad js');
        },

        'addJs() with no location provides default "bottom"': function() {
            var js = 'js';

            addon.addJs(js);

            var b = addon.getAssets('bottom');
            var t = addon.getAssets('top');

            A.isUndefined(t.top, 'top should not be defined');
            A.areSame(1, b.bottom.js.length, 'bad bottom array length');
            A.areSame(js, b.bottom.js[0], 'bad js');
        },

        'addCss() and addJs()': function() {
            var js1 = 'js1', js2 = 'js2',
                css1 = 'css1', css2 = 'css2';

            addon.addJs(js1);
            addon.addCss(css1);
            addon.addJs(js2);
            addon.addCss(css2);

            var t = addon.getAssets('top');
            var b = addon.getAssets('bottom');

            A.isUndefined(b.bottom.css, 'should not have bottom css');
            AA.itemsAreEqual([js1, js2], b.bottom.js, 'bad js values');
            A.isUndefined(t.top.js, 'should not have top js');
            AA.itemsAreEqual([css1, css2], t.top.css, 'bad css values');
        },

        'assets mix properly': function() {

            addon.addJs('jsf1', 'top');
            addon.addJs('jsf2', 'top');

            addon.addCss('cssf1');      // css defaults to top
            addon.addJs('jsf3');        // js defaults to bottom

            var to = {
                top: {
                    js: ['jst1','jst2'],
                    css: ['csst1','csst2','csst3']
                },
                bottom: {
                    js: ['jsb1']
                }
            };

            var expected = {
                top: {
                    js: ['jst1','jst2','jsf1','jsf2'],
                    css: ['csst1','csst2','csst3','cssf1']
                },
                bottom: {
                    js: ['jsb1', 'jsf3']
                }
            };

            addon.mergeMetaInto({assets: to});

            AA.itemsAreEqual(expected.top.js, to.top.js);
            AA.itemsAreEqual(expected.top.css, to.top.css);
            AA.itemsAreEqual(expected.bottom.js, to.bottom.js);
            A.isUndefined(to.bottom.css, 'bad bottom.css');
        },

        'assets unique properly': function() {

            // New values which should be added to the 'to' target.
            addon.addJs('jsf1', 'top');
            addon.addJs('jsf2', 'top');

            addon.addCss('cssf1');      // css defaults to top
            addon.addJs('jsf3');        // js defaults to bottom

            // Duplicates of values in 'to', should be eliminated, not added.
            addon.addJs('jsb1');
            addon.addCss('csst1');

            var to = {
                top: {
                    js: ['jst1','jst2'],
                    css: ['csst1','csst2','csst3']
                },
                bottom: {
                    js: ['jsb1']
                }
            };

            var expected = {
                top: {
                    js: ['jst1','jst2','jsf1','jsf2'],
                    css: ['csst1','csst2','csst3','cssf1']
                },
                bottom: {
                    js: ['jsb1', 'jsf3']
                }
            };

            addon.mergeMetaInto({assets: to});

            AA.itemsAreEqual(expected.top.js, to.top.js);
            AA.itemsAreEqual(expected.top.css, to.top.css);
            AA.itemsAreEqual(expected.bottom.js, to.bottom.js);
            A.isUndefined(to.bottom.css, 'bad bottom.css');
        },

        'inline css': function() {
            YUI._mojito._cache.compiled.css = {
                'inline': {
                    'my-path': 'file-contents'
                }
            };
            addon.context = { runtime: 'client' };
            addon.mojitType = 'fruit';
            addon.addAsset('css', 'top', 'my-path');

            var results = addon.getAssets();
            A.isNotUndefined(results);
            var expected = { top: { blob: [ '<style type="text/css">\nfile-contents</style>\n' ] } };
            console.log(results);
            A.areEqual(Y.JSON.stringify(expected), Y.JSON.stringify(results));
        }


    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-assets-addon']});
