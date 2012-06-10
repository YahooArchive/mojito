/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-addon-rs-yui-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        libpath = require('path'),
        mojitoRoot = libpath.join(__dirname, '../../../../../'),
        A = YUITest.Assert;


    function MockRS(config) {
        MockRS.superclass.constructor.apply(this, arguments);
    }
    MockRS.NAME = 'MockResourceStore';
    MockRS.ATTRS = {};
    Y.extend(MockRS, Y.Base, {

        initializer: function(cfg) {
            this._config = cfg || {};
            this.RVs = {};
        },

        findResourceByConvention: function(source, mojitType) {
            // no-op
        },

        parseResource: function(source, type, subtype, mojitType) {
            // no-op
        },

        addResourceVersion: function(res) {
            this.RVs[[res.affinity, res.selector, res.id].join('/')] = res;
        }

    });


    function cmp(x, y, msg, path) {
        if (Y.Lang.isArray(x)) {
            A.isArray(x, msg || 'first arg should be an array');
            A.isArray(y, msg || 'second arg should be an array');
            A.areSame(x.length, y.length, msg || 'arrays are different lengths');
            for (var i = 0; i < x.length; i += 1) {
                cmp(x[i], y[i], msg);
            }
            return;
        }
        if (Y.Lang.isObject(x)) {
            A.isObject(x, msg || 'first arg should be an object');
            A.isObject(y, msg || 'second arg should be an object');
            A.areSame(Object.keys(x).length, Object.keys(y).length, msg || 'object keys are different lengths');
            for (var i in x) {
                if (x.hasOwnProperty(i)) {
                    cmp(x[i], y[i], msg);
                }
            }
            return;
        }
        A.areSame(x, y, msg || 'args should be the same');
    }


    function makeSource(dir, dirType, subdir, file, isFile) {
        var source = {
            fs: {
                fullPath: libpath.join(dir, subdir, file),
                rootDir: dir,
                rootType: dirType,
                subDir: subdir,
                subDirArray: subdir.split('/'),
                isFile: isFile,
                ext: libpath.extname(file)
            },
            pkg: {
                name: 'unittest',
                version: '999.666.999',
                depth: 999
            }
        };
        source.fs.basename = libpath.basename(file, source.fs.ext);
        return source;
    }


    suite.add(new YUITest.TestCase({
        
        name: 'yui rs addon tests',
        
        'find yui resources': function() {
            var fixtures = libpath.join(__dirname, '../../../../fixtures/store');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.yui, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var source = makeSource(fixtures, 'app', 'autoload', 'x.server.txt', true);
            var have = store.findResourceByConvention(source, null);
            var want = undefined;
            cmp(have, want);

            source = makeSource(fixtures, 'app', 'blix', 'x.server.js', true);
            have = store.findResourceByConvention(source, null);
            want = undefined;
            cmp(have, want);

            source = makeSource(fixtures, 'app', 'autoload', 'x.server.js', true);
            have = store.findResourceByConvention(source, null);
            want = { type: 'yui-module', skipSubdirParts: 1 };
            cmp(have, want);

            source = makeSource(fixtures, 'app', 'yui_modules', 'x.server.js', true);
            have = store.findResourceByConvention(source, null);
            want = { type: 'yui-module', skipSubdirParts: 1 };
            cmp(have, want);

            source = makeSource(fixtures, 'app', 'lang', 'x.server.js', true);
            have = store.findResourceByConvention(source, null);
            want = { type: 'yui-lang', skipSubdirParts: 1 };
            cmp(have, want);
        },


        'parse found resource': function() {
            var fixtures = libpath.join(__dirname, '../../../../fixtures/conventions');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.yui, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var source = makeSource(fixtures, 'app', 'autoload', 'm.common.js', true);
            var res = store.parseResource(source, 'yui-module');
            A.isNotUndefined(res);
            cmp(res.source, source);
            A.areSame('yui-module', res.type);
            A.areSame('common', res.affinity);
            A.areSame('*', res.selector);
            A.areSame('m', res.name);
            A.areSame('yui-module--m', res.id);
            A.isUndefined(res.mojit);

            source = makeSource(fixtures, 'app', 'autoload', 'm.common.iphone.js', true);
            res = store.parseResource(source, 'yui-module');
            A.isNotUndefined(res);
            cmp(res.source, source);
            A.areSame('yui-module', res.type);
            A.areSame('common', res.affinity);
            A.areSame('iphone', res.selector);
            A.areSame('m', res.name);
            A.areSame('yui-module--m', res.id);
            A.isUndefined(res.mojit);

            source = makeSource(fixtures, 'app', 'yui_modules', 'x.common.js', true);
            res = store.parseResource(source, 'yui-module');
            A.isNotUndefined(res);
            cmp(res.source, source);
            A.areSame('yui-module', res.type);
            A.areSame('common', res.affinity);
            A.areSame('*', res.selector);
            A.areSame('x', res.name);
            A.areSame('yui-module--x', res.id);
            A.isUndefined(res.mojit);

            source = makeSource(fixtures, 'bundle', 'lang', 'testing.js', true);
            res = store.parseResource(source, 'yui-lang', undefined, 'testing');
            A.isNotUndefined(res);
            cmp(res.source, source);
            A.areSame('yui-lang', res.type);
            A.areSame('common', res.affinity);
            A.areSame('*', res.selector);
            A.areSame('', res.name);
            A.areSame('yui-lang--', res.id);
            A.areSame('testing', res.mojit);

            source = makeSource(fixtures, 'bundle', 'lang', 'testing_de.js', true);
            res = store.parseResource(source, 'yui-lang', undefined, 'testing');
            A.isNotUndefined(res);
            cmp(res.source, source);
            A.areSame('yui-lang', res.type);
            A.areSame('common', res.affinity);
            A.areSame('*', res.selector);
            A.areSame('de', res.name);
            A.areSame('yui-lang--de', res.id);
            A.areSame('testing', res.mojit);

            source = makeSource(fixtures, 'bundle', 'lang', 'testing_en-US.js', true);
            res = store.parseResource(source, 'yui-lang', undefined, 'testing');
            A.isNotUndefined(res);
            cmp(res.source, source);
            A.areSame('yui-lang', res.type);
            A.areSame('common', res.affinity);
            A.areSame('*', res.selector);
            A.areSame('en-US', res.name);
            A.areSame('yui-lang--en-US', res.id);
            A.areSame('testing', res.mojit);
        },


        'parse other resources': function() {
            var fixtures = libpath.join(__dirname, '../../../../fixtures/conventions');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.yui, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var source = makeSource(fixtures+'/mojits/X', 'mojit', '.', 'controller.common.js', true);
            var res = {
                source: source,
                mojit: 'X',
                type: 'controller',
                name: 'controller',
                id: 'controller--controller',
                affinity: 'common',
                selector: '*'
            };
            store.addResourceVersion(res);
            res = store.RVs['common/*/controller--controller'];
            cmp(res.source, source);
            A.isNotUndefined(res.yui);
            A.areSame('X', res.yui.name);
        }


    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['base', 'oop', 'addon-rs-yui']});
