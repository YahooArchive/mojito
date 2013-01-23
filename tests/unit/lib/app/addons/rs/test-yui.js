/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use(
    'base',
    'oop',
    'mojito-resource-store',
    'addon-rs-config',
    'addon-rs-selector',
    'addon-rs-yui',
    'json',
    'test',
    function(Y) {

    var suite = new YUITest.TestSuite('mojito-addon-rs-yui-tests'),
        libasync = require('async'),
        libpath = require('path'),
        libvm = require('vm'),
        mojitoRoot = libpath.join(__dirname, '../../../../../../lib'),
        A = Y.Assert,
        AA = Y.ArrayAssert;


    function parseConfig(config) {
        var ctx = {
            Y: {
                config: {},
                merge: Y.merge
            },
            x: undefined
        };
        config = 'x = ' + config + ';';
        libvm.runInNewContext(config, ctx, 'config');
        return ctx.x;
    }


    function MockRS(config) {
        MockRS.superclass.constructor.apply(this, arguments);
    }
    MockRS.NAME = 'MockResourceStore';
    MockRS.ATTRS = {};
    Y.extend(MockRS, Y.Base, {

        initializer: function(cfg) {
            this._config = cfg || {};
            this.RVs = {};
            this._mojitResources = {};  // env: ctx: mojitType: list of resources
            this._appResources = {};    // env: ctx: list of resources
            this._mojits = {};
            this.publish('getMojitTypeDetails', {emitFacade: true, preventable: false});
            this._appConfig = { yui: {} };
        },

        listAllMojits: function() {
            return Object.keys(this._mojits);
        },

        getStaticAppConfig: function() {
            return Y.clone(this._appConfig, true);
        },

        getResources: function(env, ctx, filter) {
            var source,
                out = [],
                r,
                res,
                k,
                use;

            ctx = Y.JSON.stringify(ctx);
            if (filter.mojit) {
                if (!this._mojitResources[env] ||
                        !this._mojitResources[env][ctx] ||
                        !this._mojitResources[env][ctx][filter.mojit]) {
                    return [];
                }
                source = this._mojitResources[env][ctx][filter.mojit];
            } else {
                if (!this._appResources[env] ||
                        !this._appResources[env][ctx]) {
                    return [];
                }
                source = this._appResources[env][ctx];
            }
            // this is taken care of already, and will trip up mojit-level
            // resources that are actually shared
            delete filter.mojit;
            for (r = 0; r < source.length; r += 1) {
                res = source[r];
                use = true;
                for (k in filter) {
                    if (filter.hasOwnProperty(k)) {
                        if (res[k] !== filter[k]) {
                            use = false;
                            break;
                        }
                    }
                }
                if (use) {
                    out.push(res);
                }
            }
            return out;
        },

        findResourceVersionByConvention: function(source, mojitType) {
            // no-op
        },

        parseResourceVersion: function(source, type, subtype, mojitType) {
            // no-op
        },

        addResourceVersion: function(res) {
            this.RVs[[res.affinity, res.selector, res.id].join('/')] = res;
        },

        _makeResource: function(env, ctx, mojit, type, name, yuiName, pkgName) {
            if (mojit && mojit !== 'shared') {
                this._mojits[mojit] = true;
            }
            var res = {
                source: {
                    fs: {
                        fullPath: 'path/for/' + type + '--' + name + '.common.ext',
                        rootDir: 'path/for'
                    },
                    pkg: { name: (pkgName || 'testing') }
                },
                mojit: mojit,
                type: type,
                name: name,
                id: type + '--' + name
            };
            if (yuiName) {
                res.yui = { name: yuiName };
            }
            ctx = Y.JSON.stringify(ctx);
            if (mojit) {
                if (!this._mojitResources[env]) {
                    this._mojitResources[env] = {};
                }
                if (!this._mojitResources[env][ctx]) {
                    this._mojitResources[env][ctx] = {};
                }
                if (!this._mojitResources[env][ctx][mojit]) {
                    this._mojitResources[env][ctx][mojit] = [];
                }
                this._mojitResources[env][ctx][mojit].push(res);
            } else {
                if (!this._appResources[env]) {
                    this._appResources[env] = {};
                }
                if (!this._appResources[env][ctx]) {
                    this._appResources[env][ctx] = [];
                }
                this._appResources[env][ctx].push(res);
            }
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
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/store');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.yui, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var source = makeSource(fixtures, 'app', 'autoload', 'x.server.txt', true);
            var have = store.findResourceVersionByConvention(source, null);
            var want = undefined;
            cmp(have, want);

            source = makeSource(fixtures, 'app', 'blix', 'x.server.js', true);
            have = store.findResourceVersionByConvention(source, null);
            want = undefined;
            cmp(have, want);

            source = makeSource(fixtures, 'app', 'autoload', 'x.server.js', true);
            have = store.findResourceVersionByConvention(source, null);
            want = { type: 'yui-module', skipSubdirParts: 1 };
            cmp(have, want);

            source = makeSource(fixtures, 'app', 'yui_modules', 'x.server.js', true);
            have = store.findResourceVersionByConvention(source, null);
            want = { type: 'yui-module', skipSubdirParts: 1 };
            cmp(have, want);

            source = makeSource(fixtures, 'app', 'lang', 'x.server.js', true);
            have = store.findResourceVersionByConvention(source, null);
            want = { type: 'yui-lang', skipSubdirParts: 1 };
            cmp(have, want);
        },


        'parse found resource': function() {
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/conventions');
            var store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.yui, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var source = makeSource(fixtures, 'app', 'autoload', 'm.common.js', true);
            var res = store.parseResourceVersion(source, 'yui-module');
            A.isNotUndefined(res);
            cmp(res.source, source);
            A.areSame('yui-module', res.type);
            A.areSame('common', res.affinity);
            A.areSame('*', res.selector);
            A.areSame('m', res.name);
            A.areSame('yui-module--m', res.id);
            A.isUndefined(res.mojit);

            source = makeSource(fixtures, 'app', 'autoload', 'm.common.iphone.js', true);
            res = store.parseResourceVersion(source, 'yui-module');
            A.isNotUndefined(res);
            cmp(res.source, source);
            A.areSame('yui-module', res.type);
            A.areSame('common', res.affinity);
            A.areSame('iphone', res.selector);
            A.areSame('m', res.name);
            A.areSame('yui-module--m', res.id);
            A.isUndefined(res.mojit);

            source = makeSource(fixtures, 'app', 'yui_modules', 'x.common.js', true);
            res = store.parseResourceVersion(source, 'yui-module');
            A.isNotUndefined(res);
            cmp(res.source, source);
            A.areSame('yui-module', res.type);
            A.areSame('common', res.affinity);
            A.areSame('*', res.selector);
            A.areSame('x', res.name);
            A.areSame('yui-module--x', res.id);
            A.isUndefined(res.mojit);

            source = makeSource(fixtures, 'bundle', 'lang', 'testing.js', true);
            res = store.parseResourceVersion(source, 'yui-lang', undefined, 'testing');
            A.isNotUndefined(res);
            cmp(res.source, source, 'testing.js source');
            A.areSame('yui-lang', res.type, 'testing.js type');
            A.areSame('common', res.affinity, 'testing.js affinity');
            A.areSame('*', res.selector, 'testing.js selector');
            A.areSame('lang/testing', res.name, 'testing.js name');
            A.areSame('yui-lang--lang/testing', res.id, 'testing.js id');
            A.areSame('testing', res.mojit, 'testing.js mojit');

            source = makeSource(fixtures, 'bundle', 'lang', 'testing_de.js', true);
            res = store.parseResourceVersion(source, 'yui-lang', undefined, 'testing');
            A.isNotUndefined(res);
            cmp(res.source, source, 'testing_de.js source');
            A.areSame('yui-lang', res.type, 'testing_de.js type');
            A.areSame('common', res.affinity, 'testing_de.js affinity');
            A.areSame('*', res.selector, 'testing_de.js selector');
            A.areSame('lang/testing_de', res.name, 'testing_de.js name');
            A.areSame('yui-lang--lang/testing_de', res.id, 'testing_de.js id');
            A.areSame('testing', res.mojit, 'testing_de.js mojit');

            source = makeSource(fixtures, 'bundle', 'lang', 'testing_en-US.js', true);
            res = store.parseResourceVersion(source, 'yui-lang', undefined, 'testing');
            A.isNotUndefined(res);
            cmp(res.source, source);
            A.areSame('yui-lang', res.type);
            A.areSame('common', res.affinity);
            A.areSame('*', res.selector);
            A.areSame('lang/testing_en-US', res.name);
            A.areSame('yui-lang--lang/testing_en-US', res.id);
            A.areSame('testing', res.mojit);
        },


        'parse other resources': function() {
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/conventions');
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
            res = store.RVs['common/*' + '/controller--controller'];
            cmp(res.source, source);
            A.isNotUndefined(res.yui);
            A.areSame('X', res.yui.name);

            source = makeSource(fixtures+'/mojits/X', 'mojit', 'assets', 'foo.common.js', true);
            res = {
                source: source,
                mojit: 'X',
                type: 'asset',
                name: 'foo',
                id: 'asset-js-foo',
                affinity: 'common',
                selector: '*'
            };
            store.addResourceVersion(res);
            res = store.RVs['common/*' + '/asset-js-foo'];
            cmp(res.source, source);
            A.isUndefined(res.yui);
        },


        'find and parse resources by convention': function() {
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/conventions'),
                store = new Y.mojito.ResourceStore({ root: fixtures });

            // fake out some parts of preload(), which we're trying to avoid
            store._fwConfig = store.config.readConfigJSON(libpath.join(mojitoRoot, 'config.json'));
            store._appConfigStatic = store.getStaticAppConfig();
            store.plug(Y.mojito.addons.rs.yui, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            var pkg = { name: 'test', version: '6.6.6' };
            var mojitType = 'testing';
            var ress = store._findResourcesByConvention(fixtures, 'app', pkg, mojitType);

            var r, res;
            for (r = 0; r < ress.length; r++) {
                res = ress[r];
                A.isNotUndefined(res.id, 'no resource id');
                switch (res.id) {
                    case 'action--x':
                    case 'action--y/z':
                    case 'addon-a-x':
                    case 'archetype-x-y':
                    case 'asset-css-x':
                    case 'asset-css-y/z':
                    case 'binder--x':
                    case 'command--x':
                    case 'config--config':
                    case 'controller--controller':
                    case 'middleware--x':
                    case 'spec--default':
                    case 'spec--x':
                    case 'view--x':
                        break;
                    case 'yui-lang--lang/testing':
                        A.areSame(pkg, res.source.pkg);
                        A.areSame('yui-lang', res.type);
                        A.areSame('lang/testing', res.name);
                        A.areSame('*', res.selector);
                        A.areSame('common', res.affinity);
                        A.areSame('.', res.source.fs.subDir);
                        A.areSame('testing', res.source.fs.basename);
                        A.areSame('.js', res.source.fs.ext);
                        break;
                    case 'yui-lang--lang/testing_de':
                        A.areSame(pkg, res.source.pkg);
                        A.areSame('yui-lang', res.type);
                        A.areSame('lang/testing_de', res.name);
                        A.areSame('*', res.selector);
                        A.areSame('common', res.affinity);
                        A.areSame('.', res.source.fs.subDir);
                        A.areSame('testing_de', res.source.fs.basename);
                        A.areSame('.js', res.source.fs.ext);
                        break;
                    case 'yui-lang--lang/testing_en':
                        A.areSame(pkg, res.source.pkg);
                        A.areSame('yui-lang', res.type);
                        A.areSame('lang/testing_en', res.name);
                        A.areSame('*', res.selector);
                        A.areSame('common', res.affinity);
                        A.areSame('.', res.source.fs.subDir);
                        A.areSame('testing_en', res.source.fs.basename);
                        A.areSame('.js', res.source.fs.ext);
                        break;
                    case 'yui-lang--lang/testing_en-US':
                        A.areSame(pkg, res.source.pkg);
                        A.areSame('yui-lang', res.type);
                        A.areSame('lang/testing_en-US', res.name);
                        A.areSame('*', res.selector);
                        A.areSame('common', res.affinity);
                        A.areSame('.', res.source.fs.subDir);
                        A.areSame('testing_en-US', res.source.fs.basename);
                        A.areSame('.js', res.source.fs.ext);
                        break;
                    case 'yui-module--m':
                        A.areSame(pkg, res.source.pkg);
                        A.areSame('yui-module', res.type);
                        A.areSame('m', res.name);
                        A.areSame('m', res.yui.name);
                        switch (res.source.fs.basename) {
                            case 'm.common':
                                A.areSame('*', res.selector);
                                A.areSame('common', res.affinity);
                                A.areSame('.js', res.source.fs.ext);
                                break;
                            case 'm.common.iphone':
                                A.areSame('iphone', res.selector);
                                A.areSame('common', res.affinity);
                                A.areSame('.js', res.source.fs.ext);
                                break;
                            default:
                                A.fail('unknown resource ' + res.source.fs.fullPath);
                                break;
                        }
                        break;
                    case 'yui-module--x':
                        A.areSame(pkg, res.source.pkg);
                        A.areSame('yui-module', res.type);
                        A.areSame('x', res.name);
                        A.areSame('x', res.yui.name);
                        switch (res.source.fs.basename) {
                            case 'x.common':
                                A.areSame('*', res.selector);
                                A.areSame('common', res.affinity);
                                A.areSame('.js', res.source.fs.ext);
                                break;
                            case 'x.common.iphone':
                                A.areSame('iphone', res.selector);
                                A.areSame('common', res.affinity);
                                A.areSame('.js', res.source.fs.ext);
                                break;
                            default:
                                A.fail('unknown resource ' + res.source.fs.fullPath);
                                break;
                        }
                        break;
                    case 'yui-module--z':
                        A.areSame(pkg, res.source.pkg);
                        A.areSame('yui-module', res.type);
                        A.areSame('z', res.name);
                        A.areSame('z', res.yui.name);
                        A.areSame('y', res.source.fs.subDir);
                        switch (res.source.fs.basename) {
                            case 'z.common':
                                A.areSame('*', res.selector);
                                A.areSame('common', res.affinity);
                                A.areSame('.js', res.source.fs.ext);
                                break;
                            case 'z.common.android':
                                A.areSame('android', res.selector);
                                A.areSame('common', res.affinity);
                                A.areSame('.js', res.source.fs.ext);
                                break;
                            default:
                                A.fail('unknown resource ' + res.source.fs.fullPath);
                                break;
                        }
                        break;

                    default:
                        A.fail('unknown resource ' + res.id);
                        break;
                }
            }
            A.areSame(31, ress.length, 'wrong number of resources');
        },


        'get config shared': function() {
            var fixtures,
                store,
                config;
            fixtures = libpath.join(__dirname, '../../../../../fixtures/store');
            store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.yui, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            store._makeResource('server', {}, 'shared', 'binder', 'index', 'FooBinderIndex');
            store._makeResource('server', {}, 'shared', 'binder', 'list', 'FooBinderList', 'mojito');
            store._makeResource('server', {}, 'Foo', 'controller', 'controller', 'FooController');

            config = store.yui.getConfigShared('server', {}, false);
            A.isNotUndefined(config.modules);
            A.isNotUndefined(config.modules.FooBinderIndex);
            A.isNotUndefined(config.modules.FooBinderList);
            A.isUndefined(config.modules.FooController);

            config = store.yui.getConfigShared('server', {}, true);
            A.isNotUndefined(config.modules);
            A.isNotUndefined(config.modules.FooBinderIndex);
            A.isUndefined(config.modules.FooBinderList);
            A.isUndefined(config.modules.FooController);
        },


        'get config all mojits': function() {
            var fixtures,
                store,
                config;
            fixtures = libpath.join(__dirname, '../../../../../fixtures/store');
            store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.yui, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            store._makeResource('server', {}, 'shared', 'binder', 'index', 'FooBinderIndex');
            store._makeResource('server', {}, 'Foo', 'binder', 'list', 'FooBinderList', 'mojito');
            store._makeResource('server', {}, 'Bar', 'controller', 'controller', 'BarController');

            config = store.yui.getConfigAllMojits('server', {}, false);
            A.isNotUndefined(config.modules);
            A.isUndefined(config.modules.FooBinderIndex);
            A.isNotUndefined(config.modules.FooBinderList);
            A.isNotUndefined(config.modules.BarController);
        },


        'yui meta': function() {
            var fixtures = libpath.join(__dirname, '../../../../../fixtures/gsg5'),
                store = new Y.mojito.ResourceStore({ root: fixtures }),
                series = [];
            store.preload();

            series.push(function(next) {
                var res, ress;
                ress = store.getResourceVersions({mojit: 'shared', type: 'yui-module', subtype:'synthetic', name:'loader-app-base-en-US' });
                A.isArray(ress);
                A.areSame(1, ress.length, "didn't find yui-module-synthetic-loader-app-base-en-US");
                res = ress[0];
                A.isObject(res);
                store.getResourceContent(res, function(err, buffer, stat) {
                    A.isNull(err, 'error');
                    A.isNotNull(stat, 'stat');
                    meta = buffer.toString();
                    var matches = meta.match(/Y\.applyConfig\(([\s\S]+?)\);/);
                    var config = parseConfig(matches[1]);
                    A.isObject(config);
                    A.isObject(config.groups);
                    A.areSame(1, Object.keys(config.groups).length);
                    A.isObject(config.groups.app);
                    // we'll just spot-check a few things
                    A.isObject(config.groups.app.modules);
                    A.isObject(config.groups.app.modules['lang/PagedFlickr_en-US']);
                    A.isArray(config.groups.app.modules['lang/PagedFlickr_en-US'].requires);
                    AA.itemsAreEqual(['intl'], config.groups.app.modules['lang/PagedFlickr_en-US'].requires);
                    A.isObject(config.groups.app.modules['mojito-client']);
                    A.isArray(config.groups.app.modules['mojito-client'].requires);
                    A.isUndefined(config.groups.app.modules['mojito-client'].expanded_map);
                    A.isTrue(Object.keys(config.groups.app.modules['mojito-client'].requires).length > 0);
                    A.isObject(config.groups.app.modules['PagedFlickrBinderIndex']);
                    A.isArray(config.groups.app.modules['PagedFlickrBinderIndex'].requires);
                    A.isUndefined(config.groups.app.modules['lang/PagedFlickr_de']);
                    next();
                });
            });
            series.push(function(next) {
                var res, ress;
                ress = store.getResourceVersions({mojit: 'shared', type: 'yui-module', subtype:'synthetic', name:'loader-app-resolved-en-US' });
                A.isArray(ress);
                A.areSame(1, ress.length);
                res = ress[0];
                A.isObject(res);
                store.getResourceContent(res, function(err, buffer, stat) {
                    A.isNull(err, 'err');
                    A.isNotNull(stat, 'stat');
                    meta = buffer.toString();
                    var matches = meta.match(/Y\.applyConfig\(([\s\S]+?)\);/);
                    var config = parseConfig(matches[1]);
                    A.isObject(config);
                    A.isObject(config.groups);
                    A.areSame(1, Object.keys(config.groups).length);
                    A.isObject(config.groups.app);
                    // we'll just spot-check a few things
                    A.isObject(config.groups.app.modules);
                    A.isObject(config.groups.app.modules['lang/PagedFlickr_en-US']);
                    A.isArray(config.groups.app.modules['lang/PagedFlickr_en-US'].requires);
                    AA.itemsAreEqual(['intl'], config.groups.app.modules['lang/PagedFlickr_en-US'].requires);
                    A.isObject(config.groups.app.modules['mojito-client']);
                    A.isArray(config.groups.app.modules['mojito-client'].requires);
                    A.isTrue(Object.keys(config.groups.app.modules['mojito-client'].requires).length > 0);
                    A.isObject(config.groups.app.modules['PagedFlickrBinderIndex']);
                    A.isArray(config.groups.app.modules['PagedFlickrBinderIndex'].requires);
                    A.isUndefined(config.groups.app.modules['lang/PagedFlickr_de']);
                    var i, j, obj;
                    for (i in config.groups.app.modules) {
                        if (config.groups.app.modules.hasOwnProperty(i)) {
                            obj = config.groups.app.modules[i];
                            A.isNotUndefined(obj.name);
                            A.isNotUndefined(obj.type);
                            A.isNotUndefined(obj.path);
                            A.isNotUndefined(obj.requires);
                            A.isNotUndefined(obj.defaults);
                            // language bundles don't have expanded_map
                            if (!obj.langPack) {
                                for (j = 0; j < obj.requires.length; j += 1) {
                                    A.isNotUndefined(obj.expanded_map[obj.requires[j]]);
                                }
                            }
                        }
                    }
                    next();
                });
            });
            series.push(function(next) {
                var res, ress;
                ress = store.getResourceVersions({mojit: 'shared', type: 'yui-module', subtype:'synthetic', name:'loader-yui3-base-en-US' });
                A.isArray(ress);
                A.areSame(1, ress.length);
                res = ress[0];
                A.isObject(res);
                store.getResourceContent(res, function(err, buffer, stat) {
                    A.isNull(err);
                    A.isNotNull(stat);
                    meta = buffer.toString();
                    var matches = meta.match(/\.modules=[^|]+\|\|([\s\S]+?);},"",{requires:/);
                    var config = parseConfig(matches[1]);
                    A.isObject(config);
                    A.isObject(config.intl);
                    A.isUndefined(config.intl.expanded_map);
                    A.isObject(config['dom-style-ie']);
                    A.isObject(config['dom-style-ie'].condition);
                    A.areSame('function', typeof config['dom-style-ie'].condition.test);
                    A.isUndefined(config['dom-style-ie'].expanded_map);
                    next();
                });
            });
            series.push(function(next) {
                var res, ress;
                ress = store.getResourceVersions({mojit: 'shared', type: 'yui-module', subtype:'synthetic', name:'loader-yui3-resolved-en-US' });
                A.isArray(ress);
                A.areSame(1, ress.length);
                res = ress[0];
                A.isObject(res);
                store.getResourceContent(res, function(err, buffer, stat) {
                    A.isNull(err);
                    A.isNotNull(stat);
                    meta = buffer.toString();
                    var matches = meta.match(/\.modules=[^|]+\|\|([\s\S]+?);},"",{requires:/);
                    var config = parseConfig(matches[1]);
                    for (i in config) {
                        if (config.hasOwnProperty(i)) {
                            obj = config[i];
                            A.isNotUndefined(obj.name, 'name');
                            A.isNotUndefined(obj.type, 'type');
                            A.isNotUndefined(obj.requires, 'requires');
                            A.isNotUndefined(obj.defaults, 'defaults');
                            // language bundles don't have expanded_map
                            if (!obj.langPack) {
                                A.isNotUndefined(obj.expanded_map);
                            }
                        }
                    }
                    A.isObject(config.intl);
                    A.isObject(config['dom-style-ie']);
                    A.isObject(config['dom-style-ie'].condition);
                    A.areSame('function', typeof config['dom-style-ie'].condition.test);
                    next();
                });
            });
            series.push(function(next) {
                var res, ress;
                ress = store.getResourceVersions({mojit: 'shared', type: 'yui-module', subtype:'synthetic', name:'loader-app' });
                A.isArray(ress);
                A.areSame(1, ress.length);
                res = ress[0];
                A.isObject(res);
                store.getResourceContent(res, function(err, buffer, stat) {
                    A.isNull(err);
                    A.isNotNull(stat);
                    meta = buffer.toString();
                    A.areSame('YUI.add("loader",function(Y){},"",{requires:["loader-base","loader-yui3","loader-app"]});', meta);
                    next();
                });
            });
            libasync.series(series, function(err) {
                A.isNull(err, 'no errors for all tests');
            });
        },


        'ignore: gather list of all langs in app': function() {
            // TODO
        },


        'ignore: _precomputeConfigApp()': function() {
            // TODO
        },

        'test getAppGroupConfig': function() {
            var fixtures,
                store,
                config;
            fixtures = libpath.join(__dirname, '../../../../../fixtures/store');
            store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.yui, { appRoot: fixtures, mojitoRoot: mojitoRoot } );

            store.getAppConfig = function () {
                return {};
            };
            config = store.yui.getAppGroupConfig({});
            A.isTrue(config.combine, 'combine should be true by default');
            A.areSame(1024, config.maxURLLength, 'maxURLLength should be 1024 by default');

            store.getAppConfig = function () {
                return {
                    yui: {
                        config: {
                            combine: false,
                            groups: {
                                app: {
                                    maxURLLength: 'maxURLLength',
                                    base: "base",
                                    comboBase: "comboBase",
                                    comboSep: "comboSep",
                                    root: "root"
                                }
                            }
                        }
                    }
                };
            };
            config = store.yui.getAppGroupConfig({});
            A.isFalse(config.combine, 'yui->config->combine should be the fallback for yui->config->groups->app->combine');
            A.areSame('maxURLLength', config.maxURLLength, 'yui->config->groups->app->maxURLLength should be honored');
            A.areSame('base', config.base, 'yui->config->groups->app->base should be honored');
            A.areSame('comboBase', config.comboBase, 'yui->config->groups->app->comboBase should be honored');
            A.areSame('comboSep', config.comboSep, 'yui->config->groups->app->comboSep should be honored');
            A.areSame('root', config.root, 'yui->config->groups->app->root should be honored');
        },

        'test getAppSeedFiles': function() {
            var fixtures,
                store,
                seed;
            fixtures = libpath.join(__dirname, '../../../../../fixtures/store');
            store = new MockRS({ root: fixtures });
            store.plug(Y.mojito.addons.rs.yui, { appRoot: fixtures, mojitoRoot: mojitoRoot } );
            store.yui.langs = {
                'en-US': true
            }; // hack to avoid failures if langs array is undefined

            store.getAppConfig = function () {
                return {};
            };
            seed = store.yui.getAppSeedFiles({
                lang: 'en-US'
            });
            A.isArray(seed);
            A.areSame(5, seed.length, '');

            store.getAppConfig = function () {
                return {
                    yui: {
                        config: {
                            seed: ['yui-base', 'loader-app', 'foo{langPath}']
                        }
                    }
                };
            };
            seed = store.yui.getAppSeedFiles({
                lang: 'en-US'
            });
            A.isArray(seed);
            A.areSame(3, seed.length, '');
            A.areSame('yui-base', seed[0], 'regular modules should be in honored');
            A.areSame('loader-app', seed[1], 'regular modules should be in honored');
            A.areSame('foo_en-US', seed[2], 'lang should also be honored if the seed is using {langPath} token');
        }

    }));

    Y.Test.Runner.add(suite);

});
