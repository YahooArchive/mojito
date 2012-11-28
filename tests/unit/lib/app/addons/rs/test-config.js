/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('addon-rs-config', 'mojito-util', 'base', 'oop', 'test', function(Y) {

    var suite = new YUITest.TestSuite('mojito-addon-rs-config-tests'),
        libfs = require('fs'),
        libpath = require('path'),
        mojitoRoot = libpath.join(__dirname, '../../../../../../lib'),
        A = YUITest.Assert,
        OA = YUITest.ObjectAssert,
        AA = YUITest.ArrayAssert;


    function MockRS(config) {
        MockRS.superclass.constructor.apply(this, arguments);
    }
    MockRS.NAME = 'MockResourceStore';
    MockRS.ATTRS = {};
    Y.extend(MockRS, Y.Base, {

        initializer: function(cfg) {
            this._config = cfg || {};
        },

        validateContext: function() {
        },

        cloneObj: function(o) {
            return Y.clone(o);
        },

        getStaticContext: function() {
            return this._config.context || {};
        },

        blendStaticContext: function(ctx) {
            return Y.mojito.util.blend(this._config.context, ctx);
        },

        findResourceVersionByConvention: function(source, mojitType) {
            // no-op
        },

        parseResourceVersion: function(source, type, subtype, mojitType) {
            // no-op
        }

    });


    function readJSON(dir, file) {
        var path = libpath.join(dir, file);
        var contents = libfs.readFileSync(path, 'utf-8');
        return JSON.parse(contents);
    }


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
        
        name: 'config rs addon tests',
        
        'read dimensions': function() {
            // from mojito
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/store');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );
            var have = store.config.getDimensions();
            var want = readJSON(mojitoRoot, 'dimensions.json');
            cmp(want, have);

            // app-specified
            fixtures = libpath.join(__dirname, '../../../../../fixtures/ycb');
            store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );
            have = store.config.getDimensions();
            want = readJSON(fixtures, 'dimensions.json');
            cmp(want, have);
        },


        'find config resources': function() {
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/store');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            // skip non-json files
            var source = makeSource(fixtures, 'app', '.', 'server.js', true);
            var have = store.findResourceVersionByConvention(source, null);
            var want = undefined;
            cmp(have, want, 'skip non-json files');

            // include all json files in the app
            source = makeSource(fixtures, 'app', '.', 'x.json', true);
            have = store.findResourceVersionByConvention(source, null);
            want = { type: 'config' };
            cmp(have, want, 'include all json files in the app');

            // ... explicitly including package.json
            source = makeSource(fixtures, 'app', '.', 'package.json', true);
            have = store.findResourceVersionByConvention(source, null);
            want = { type: 'config' };
            cmp(have, want, 'include package.json in the app');

            // exclude all json files in a bundle
            source = makeSource(fixtures, 'bundle', '.', 'x.json', true);
            have = store.findResourceVersionByConvention(source, null);
            want = undefined;
            cmp(have, want, 'exclude all json files in a bundle');

            // ... explicitly excluding package.json
            source = makeSource(fixtures, 'bundle', '.', 'package.json', true);
            have = store.findResourceVersionByConvention(source, null);
            want = undefined;
            cmp(have, want, 'exclude package.json in a bundle');

            // include all json files in a mojit
            source = makeSource(fixtures, 'mojit', '.', 'x.json', true);
            have = store.findResourceVersionByConvention(source, 'foo');
            want = { type: 'config' };
            cmp(have, want, 'include all json files in a mojit');

            // ... except for the 'shared' mojit
            source = makeSource(fixtures, 'mojit', '.', 'x.json', true);
            have = store.findResourceVersionByConvention(source, 'shared');
            want = undefined;
            cmp(have, want, 'exclude all json files in the "shared" mojit');

            // ... explicitly including package.json
            source = makeSource(fixtures, 'mojit', '.', 'package.json', true);
            have = store.findResourceVersionByConvention(source, 'shared');
            want = { type: 'config' };
            cmp(have, want, 'include package.json in the "shared" mojit');
        },


        'parse found resource': function() {
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/store');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var source = makeSource(fixtures, 'app', '.', 'application.json', true);
            var res = store.parseResourceVersion(source, 'config');
            A.isNotUndefined(res);
            cmp(res.source, source);
            A.areSame('config', res.type);
            A.areSame('common', res.affinity);
            A.areSame('*', res.selector);
            A.areSame('application', res.name);
            A.areSame('config--application', res.id);
            A.isUndefined(res.mojit);

            source = makeSource(fixtures, 'mojit', '.', 'defaults.json', true);
            res = store.parseResourceVersion(source, 'config', undefined, 'x');
            A.isNotUndefined(res);
            cmp(res.source, source);
            A.areSame('config', res.type);
            A.areSame('common', res.affinity);
            A.areSame('*', res.selector);
            A.areSame('defaults', res.name);
            A.areSame('config--defaults', res.id);
            A.areSame('x', res.mojit);
        },


        'read JSON files': function() {
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/store');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var path = libpath.join(fixtures, 'application.json');
            var have = store.config.readConfigSimple(path);
            var want = readJSON(fixtures, 'application.json');
            cmp(have, want);
        },


        'read YCB files': function() {
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/store');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var path = libpath.join(fixtures, 'application.json');
            var have = store.config.readConfigYCB(path, { runtime: 'server' });
            var want = {
                "mojitDirs": [
                    "soloMojit"
                ],

                "testKey1": "testVal1-server",
                "testKey2": "testVal2",
                "testKey3": "testVal3",
                "specs": {
                    "test1": {
                        "type": "test_mojit_1"
                    },
                    "single": {
                        "type": "HTMLFrameMojit",
                        "config": {
                            "child": {
                                "type": "page",
                                "config": {
                                    "children": {
                                        "weather": {
                                            "type": "weather",
                                            "action": "index"
                                        },
                                        "stream": {
                                            "type": "stream",
                                            "action": "stream"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "multiple": {
                        "type": "HTMLFrameMojit",
                        "config": {
                            "child": {
                                "type": "page"
                            }
                        }
                    }

                },
                "selector": "shelves",
                "pathos": "portended"
            };
            cmp(have, want);
        },


        'malformed JSON for config file': function() {
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/badfiles2');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var path = libpath.join(fixtures, 'routes.json');
            try {
                store.config.readConfigSimple(path);
            }
            catch (err) {
                A.areSame('Error parsing JSON file:', err.message.substr(0, 24));
            }
        },


        'JSON config file not YCB': function() {
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/badfiles3');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var path = libpath.join(fixtures, 'routes.json');
            var have = store.config.readConfigYCB(path, {});
            var want = {};
            cmp(have, want);
        }

        
    }));
    
    suite.add(new YUITest.TestCase({
        
        name: 'config rs addon tests',

        "readConfigSync JSON file":  function () {

            var fixtures = libpath.join(__dirname, '../../../../../fixtures'),
                store = new MockRS({ root: fixtures }),
                path = libpath.join(fixtures, "/config/", "json.json"),
                obj;

            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            obj = store.config.readConfigSync(path);

            A.areSame("val", obj.key);
        },

        "readConfigSync YAML file":  function () {

            var fixtures = libpath.join(__dirname, '../../../../../fixtures'),
                store = new MockRS({ root: fixtures }),
                path = libpath.join(fixtures, "/config/", "yaml.yaml"),
                obj;

            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            obj = store.config.readConfigSync(path);

            A.areSame("val", obj.key);
        },

        "readConfigSync YML file":  function () {

            var fixtures = libpath.join(__dirname, '../../../../../fixtures'),
                store = new MockRS({ root: fixtures }),
                path = libpath.join(fixtures, "/config/", "yml.yml"),
                obj;

            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            obj = store.config.readConfigSync(path);

            A.areSame("val", obj.key);
        },

        "readConfigSync no ext file":  function () {

            var fixtures = libpath.join(__dirname, '../../../../../fixtures'),
                store = new MockRS({ root: fixtures }),
                path = libpath.join(fixtures, "/config/", "ext"),
                obj;

            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            obj = store.config.readConfigSync(path);

            A.areSame("val", obj.key);
        },

        "readConfigSync YAML file with TAB not space":  function () {

            var fixtures = libpath.join(__dirname, '../../../../../fixtures'),
                store = new MockRS({ root: fixtures }),
                path = libpath.join(fixtures, "/config/", "bad.yaml");

            store.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            try {
                store.config.readConfigSync(path);
            }
            catch (err) {
                A.areSame('Error parsing file:', err.message.substr(0, 19));
            }
        }
    }));
    
    Y.Test.Runner.add(suite);
    
});
