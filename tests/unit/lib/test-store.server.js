/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use(
    'oop',
    'mojito-resource-store',
    'mojito-resource-store-adapter',
    'addon-rs-config',
    'addon-rs-selector',
    'addon-rs-url',
    'addon-rs-yui',
    'test',
    function(Y) {

        var suite = new Y.Test.Suite('mojito-store-server-tests'),
            libpath = require('path'),
            mojitoRoot = libpath.join(__dirname, '../../../lib'),
            store,
            Mock = Y.Mock,
            A = Y.Assert,
            AA = Y.ArrayAssert;


        function cmp(x, y, msg) {
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


        suite.add(new Y.Test.Case({

            name: 'Store tests -- preload fixture "store"',

            init: function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/store');
                store = new Y.mojito.ResourceStore({ root: fixtures });
                store.preload();
            },

            'pre load': function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/store');
                //Y.log(Y.JSON.stringify(store,null,4));
                A.isTrue(store._config.root === fixtures);
            },

            'valid context': function() {
                var success;

                try {
                    store.validateContext({});
                } catch(e) {
                    A.fail('{} should be valid');
                }

                try {
                    store.validateContext({device:'iphone'});
                } catch(e) {
                    A.fail('{device:iphone} should be valid');
                }

                try {
                    store.validateContext({device:'iphone',lang:'en'});
                } catch(e) {
                    A.fail('{device:iphone,lang:en} should be valid');
                }

                try {
                    store.validateContext({device:'iphone',runtime:'common'});
                } catch(e) {
                    A.fail('{device:iphone,runtime:common} should be valid');
                }

                try {
                    success = undefined;
                    store.validateContext({device:'blender'});
                    success = true;
                } catch(e) {
                    success = false;
                }
                A.isFalse(success, '{device:blender} should be invalid');

                try {
                    success = undefined;
                    store.validateContext({device:'iphone',texture:'corrugated'});
                    success = true;
                } catch(e) {
                    success = false;
                }
                A.isFalse(success, '{device:iphone,texture:corrugated} should be invalid');

                try {
                    success = undefined;
                    store.validateContext({device:'iphone',runtime:'kite'});
                    success = true;
                } catch(e) {
                    success = false;
                }
                A.isFalse(success, '{device:iphone,runtime:kite} should be invalid');

            },

            'server app config value': function() {
                var config = store.getAppConfig(null);
                A.isTrue(config.testKey1 === 'testVal1');
            },

            'server mojit config value': function() {
                var instance = {base:'test1'};
                store.expandInstance(instance, {}, function(err, instance){
                    A.isTrue(instance.id === 'test1', 'wrong ID');
                    A.isTrue(instance.type === 'test_mojit_1', 'wrong type');
                    A.isTrue(instance.config.testKey4 === 'testVal4', 'missing key from definition.json');
                });
            },

            'server mojit config value via type': function() {
                var instance = {type:'test_mojit_1'};
                store.expandInstance(instance, {}, function(err, instance){
                    A.isTrue(instance.type === 'test_mojit_1', 'wrong ID');
                    A.isTrue(instance.config.testKey4 === 'testVal4', 'missing config from definition.json');
                    A.isTrue(instance.config.testKey6.testKey7 === 'testVal7', 'missing deep config from definition.json');
                });
            },

            'server mojit config value via type & overrride': function() {
                var instance = {
                    type:'test_mojit_1',
                    config:{testKey4: 'other'}
                };
                store.expandInstance(instance, {}, function(err, instance){
                    A.isTrue(instance.type === 'test_mojit_1', 'wrong ID');
                    A.isTrue(instance.config.testKey4 === 'other', 'missing config from definition.json');
                    A.isTrue(instance.config.testKey5 === 'testVal5', 'missing deep config from definition.json');
                });
            },

            'server mojit instance assets': function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/store');
                var instance = {type:'test_mojit_1'};
                store.expandInstance(instance, {}, function(err, instance) {
                    A.areSame('/static/test_mojit_1/assets', instance.assetsRoot);
                    // we'll skip the favicon.ico that ships with Mojito
                    // (it's not availble when running --coverage anyway)
                    A.areSame(libpath.join(fixtures, 'mojits/test_mojit_1/assets/css/main.css'), instance.assets['css/main.css']);
                    A.areSame(libpath.join(fixtures, 'mojits/test_mojit_1/assets/js/main.js'), instance.assets['js/main.js']);
                });
            },

            'server mojit instance views & binders': function() {
                var instance = {type:'test_mojit_1'};
                store.expandInstanceForEnv('client', instance, {}, function(err, instance) {
                    A.areSame(3, Y.Object.keys(instance.views).length);

                    A.isObject(instance.views['test_1']);
                    A.areSame('/static/test_mojit_1/views/test_1.hb.html', instance.views['test_1']['content-path']);
                    A.areSame('hb', instance.views['test_1']['engine']);
                    A.areSame('/static/test_mojit_1/binders/test_1.js', instance.views['test_1']['binder-path']);
                    A.areSame('test_mojit_1Bindertest_1', instance.views['test_1']['binder-module']);
                    A.isNotUndefined(instance.views['test_1']['binder-yui-sorted']['mojito-client']);

                    A.isObject(instance.views['test_2']);
                    A.areSame('/static/test_mojit_1/views/test_2.hb.html', instance.views['test_2']['content-path']);
                    A.areSame('hb', instance.views['test_2']['engine']);

                    A.isObject(instance.views['subdir/test_1']);
                    A.areSame('/static/test_mojit_1/views/subdir/test_1.hb.html', instance.views['subdir/test_1']['content-path']);
                    A.areSame('hb', instance.views['subdir/test_1']['engine']);
                    A.areSame('/static/test_mojit_1/binders/subdir/test_1.js', instance.views['subdir/test_1']['binder-path']);
                    A.areSame('test_mojit_1Bindersubdir/test_1', instance.views['subdir/test_1']['binder-module']);
                    A.isNotUndefined(instance.views['subdir/test_1']['binder-yui-sorted']['mojito-client']);
                });
            },

            'server mojit instance models': function() {
                var instance = {type:'test_mojit_1'};
                store.expandInstance(instance, {}, function(err, instance) {
                    A.areSame(4, Y.Object.keys(instance.models).length);
                    A.isTrue(instance.models['flickr']);
                    A.isTrue(instance.models['test_applevel']);
                    A.isTrue(instance.models['test_1']);
                    A.isTrue(instance.models['test_2']);
                });
            },

            'server mojit type name can come from package.json': function() {
                var instance = {type:'TestMojit2'};
                store.expandInstance(instance, {}, function(err, instance){
                    A.isNotUndefined(instance['controller-path']);
                    A.areSame('/static/TestMojit2/assets', instance.assetsRoot);
                    A.isNotUndefined(instance.yui.config.modules.test_mojit_2);
                });
            },

            'server mojit is NOT loaded because of package mojito version mismatch': function(){
                var urls = store.getAllURLs();
                A.isUndefined(urls['/static/test_mojit_4/package.json']);
                A.isUndefined(urls['/static/TestMojit4/package.json']);
            },

            'server mojit is loaded because of package mojito version match': function(){
                var instance = {type:'TestMojit2'};
                store.expandInstance(instance, {}, function(err, instance){
                    A.areSame('/static/TestMojit2/assets', instance.assetsRoot);
                });
            },

            'server a mojits package.json file is available as appropriate': function() {
                var urls = store.getAllURLs();
                A.isUndefined(urls['/static/TestMojit2/package.json']);
                A.isNotUndefined(urls['/static/TestMojit3/package.json']);
                A.isUndefined(urls['/static/TestMojit5/package.json']);
            },

            'server mojit view index.hb.html is loaded correctly': function() {
                var instance = {type:'TestMojit3'};
                store.expandInstance(instance, {}, function(err, instance){
                    A.areSame('index.hb.html', instance.views.index['content-path'].split('/').pop());
                });
            },

            'server mojit view index.iphone.hb.html is loaded correctly': function(){
                var instance = {type:'TestMojit3'};
                store.expandInstance(instance, {device:'iphone'}, function(err, instance){
                    A.areSame('index.iphone.hb.html', instance.views.index['content-path'].split('/').pop());
                });
            },

            'app-level mojits': function() {
                var instance = { type: 'test_mojit_1' };
                store.expandInstance(instance, {}, function(err, instance) {
                    A.isNotUndefined(instance.models.test_applevel);
                });
            },

            'mojitDirs setting': function() {
                var instance = { type: 'soloMojit' };
                store.expandInstance(instance, {}, function(err, instance) {
                    A.isNotUndefined(instance['controller-path']);
                });
            },

            'expandInstance caching': function() {
                var instance = 'foo';
                var context = {};
                var key = Y.JSON.stringify(instance) + Y.JSON.stringify(context);
                store._expandInstanceCache.server[key] = 'bar';
                store.expandInstance(instance, context, function(err, instance) {
                    A.areEqual('bar', instance);
                });
            },

            'multi preload': function() {
                var pre = {
                    appRVs: Y.clone(store._appRVs, true),
                    mojitRVs: Y.clone(store._mojitRVs, true),
                    appResources: Y.clone(store._appResources, true),
                    mojitResources: Y.clone(store._mojitResources, true)
                };
                store.preload();
                var post = {
                    appRVs: Y.clone(store._appRVs, true),
                    mojitRVs: Y.clone(store._mojitRVs, true),
                    appResources: Y.clone(store._appResources, true),
                    mojitResources: Y.clone(store._mojitResources, true)
                };
                cmp(post, pre);
            },

            'call getSpec()': function() {
                store.getSpec('server', 'test1', {}, function(err, instance) {
                    A.areSame('test_mojit_1', instance.type);
                    A.areSame('test1', instance.id);
                    // ... and all the type-specific parts...
                    A.areSame('/static/test_mojit_1/assets', instance.assetsRoot);
                });
            },

            'call getType()': function() {
                store.getType('server', 'test_mojit_1', {}, function(err, instance) {
                    A.areSame('test_mojit_1', instance.type);
                    A.isUndefined(instance.id);
                    // ... and all the type-specific parts...
                    A.areSame('/static/test_mojit_1/assets', instance.assetsRoot);
                });
            },

            'instance with base pointing to non-existant spec': function() {
                var spec = { base: 'nonexistant' };
                store.expandInstance(spec, {}, function(err, instance) {
                    A.isNotUndefined(err);
                    A.areSame('Unknown base of "nonexistant"', err.message);
                    A.isUndefined(instance);
                });
            },

            'getAppConfig() returns contextualized info': function() {
                var context = { runtime: 'server' },
                    config;
                config = store.getAppConfig(context);
                A.isObject(config);
                A.areSame('testVal1-server', config.testKey1, 'testKey1 wasnt contextualized to the server');
                A.areSame('testVal2', config.testKey2, 'testKey2 gotten from the wrong context');
                A.areSame('portended', config.pathos, 'missing contextualized config');
                A.isUndefined(config.testKey4, 'testKey4 gotten from the wrong context');
            },

            'call getRoutes()': function() {
                var routes = store.getRoutes({});
                A.isObject(routes, 'no routes at all');
                A.isObject(routes.flickr_by_page, 'missing route flickr_by_page');
                A.isObject(routes.flickr_base, 'missing route flickr_base');
            },

            'call serializeClientStore()': function() {
                var client = store.serializeClientStore({});
                A.isObject(client, 'config is missing');
                A.isObject(client.appConfig, 'missing appConfig');
                A.areSame('/tunnel', client.appConfig.tunnelPrefix);
                A.areSame('testVal1', client.appConfig.testKey1);
                A.areSame('testVal2', client.appConfig.testKey2);
                A.areSame('testVal3', client.appConfig.testKey3);
                A.isObject(client.specs, 'missing specs');
                A.areSame(0, Object.keys(client.specs).length);
                A.isObject(client.mojits, 'missing mojits');
                A.areSame(0, Object.keys(client.mojits).length);
                A.isObject(client.routes, 'missing routes');
                A.isObject(client.routes.flickr_by_page, 'missing route flickr_by_page');
                A.isObject(client.routes.flickr_base, 'missing route flickr_base');
            },

            'call listAllMojits()': function() {
                var list = store.listAllMojits('server');
                A.areSame(10, list.length, 'found the wrong number of mojits');
                AA.contains('TunnelProxy', list);
                AA.contains('HTMLFrameMojit', list);
                AA.contains('LazyLoad', list);
                AA.contains('inlinecss', list);
                AA.contains('rollups', list);
                AA.contains('test_mojit_1', list);
                AA.contains('TestMojit2', list);
                AA.contains('TestMojit3', list);
                AA.contains('TestMojit5', list);
                AA.contains('soloMojit', list);
            },

            'app with rollups': function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/store');
                var spec = { type: 'rollups' };
                store.expandInstanceForEnv('client', spec, {}, function(err, instance) {
                    A.areSame('/static/rollups/rollup.client.js', instance.yui.sortedPaths['rollups']);
                    A.areSame('/static/rollups/rollup.client.js', instance.yui.sortedPaths['rollupsModelClient']);
                    var urls = store.getAllURLs();
                    A.areSame(libpath.join(fixtures, 'mojits/rollups/rollup.client.js'), urls['/static/rollups/rollup.client.js']);
                });
            },

            'app resource overrides framework resource': function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/store'),
                    ress;
                ress = store.getResources('server', {}, {mojit: 'HTMLFrameMojit', type: 'controller'});
                A.areSame(libpath.join(fixtures, 'mojits/HTMLFrameMojit/controller.server.js'), ress[0].source.fs.fullPath);
            }

        }));


        suite.add(new Y.Test.Case({

            name: 'Store tests -- preload fixture "gsg5"',

            init: function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/gsg5');
                store = new Y.mojito.ResourceStore({ root: fixtures });
                store.preload();
            },

            'controller with selector': function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/gsg5');
                var spec = { type: 'PagedFlickr' };
                var ctx = { device: 'iphone' };
                store.expandInstance(spec, ctx, function(err, instance) {
                    A.areSame(libpath.join(fixtures, 'mojits/PagedFlickr/controller.common.iphone.js'), instance['controller-path']);
                });
            },

            'binder with selector': function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/gsg5');
                var spec = { type: 'PagedFlickr' };
                var ctx = { device: 'iphone' };
                store.expandInstance(spec, ctx, function(err, instance) {
                    A.areSame(libpath.join(fixtures, 'mojits/PagedFlickr/views/index.iphone.hb.html'), instance.views.index['content-path']);
                });
            }

        }));


        suite.add(new Y.Test.Case({

            name: 'Store tests -- preload fixture "gsg5-appConfig"',

            setUp: function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/gsg5-appConfig');
                store = new Y.mojito.ResourceStore({ root: fixtures });
                store.preload();
            },

            'appConfig deferAllOptionalAutoloads': function() {
                var spec = { type: 'PagedFlickr' };
                store.expandInstanceForEnv('client', spec, {}, function(err, instance) {
                    A.isUndefined(instance.views.index['binder-yui-sorted']['mojito-tunnel-client'], 'mojito-tunnel-client');
                });
            },

            'appConfig staticHandling.prefix': function() {
                var spec = { type: 'PagedFlickr' };
                store.expandInstance(spec, {}, function(err, instance) {
                    A.areSame('/PagedFlickr/assets', instance.assetsRoot);
                });
            }

        }));


        suite.add(new Y.Test.Case({

            name: 'Store tests -- misc',

            'static context is really static': function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/store'),
                    context = { runtime: 'server' },
                    store = new Y.mojito.ResourceStore({ root: fixtures, context: context }),
                    config;
                store.preload();
                config = store.getAppConfig();
                A.isObject(config);
                A.areSame('testVal1-server', config.testKey1, 'testKey1 wasnt contextualized to the server');
                A.areSame('testVal2', config.testKey2, 'testKey2 gotten from the wrong context');
                A.areSame('portended', config.pathos, 'missing contextualized config');
                A.isUndefined(config.testKey4, 'testKey4 gotten from the wrong context');
            },

            'pre load no application.json file': function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/store_no_app_config'),
                    store = new Y.mojito.ResourceStore({ root: fixtures });
                store.preload();

                //Y.log(Y.JSON.stringify(store,null,4));
                A.isTrue(store._config.root === fixtures);
            },

            'default routes': function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/store_no_app_config'),
                    store = new Y.mojito.ResourceStore({ root: fixtures });
                store.preload();

                var have = store.getRoutes();
                A.isObject(have._default_path);
            },

            'bad files': function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/badfiles'),
                    store = new Y.mojito.ResourceStore({ root: fixtures });
                store.preload();
                var spec = { type: 'M' };
                store.expandInstance(spec, {}, function(err, instance) {
                    A.isUndefined(instance.yui.sortedPaths['addon-ac-not']);
                    A.isUndefined(instance.yui.sortedPaths['MAutoloadNot']);
                    A.isUndefined(instance.yui.sortedPaths['MModelNot']);
                    A.isUndefined(instance.views['not']['binder-url']);
                });
            },

            'sortedReaddirSync() sorts the result of fs.readdirSync()': function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/store');
                var mockfs = Mock();

                Mock.expect(mockfs, {
                    method: 'readdirSync',
                    args: ['dir'],
                    returns: ['d', 'c', 'a', 'b']
                });

                var store = new Y.mojito.ResourceStore({ root: fixtures });
                store._mockLib('fs', mockfs);
                var files = store._sortedReaddirSync('dir');

                AA.itemsAreSame(['a', 'b', 'c', 'd'], files);
                Mock.verify(mockfs);
            },

            '_skipBadPath() does just that': function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/store');
                var store = new Y.mojito.ResourceStore({ root: fixtures });
                A.isTrue(store._skipBadPath({ isFile: true, ext: '.js~' }), 'need to skip bad file naems');
                A.isFalse(store._skipBadPath({ isFile: false, ext: '.js~' }), 'need to not-skip bad directory names');
                A.isFalse(store._skipBadPath({ isFile: true, ext: '.js' }), 'need to not-skip good file names');
            },

            'load node_modules': function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/packages'),
                    store = new Y.mojito.ResourceStore({ root: fixtures });
                store.preload();

                if (!store._mojitRVs.a && !store._mojitRVs.aa && !store._mojitRVs.ba) {
                    // This happens when mojito is installed via npm, since npm
                    // won't install the node_modules/ directories in
                    // tests/fixtures/packages.
                    A.isTrue(true);
                    return;
                }

                var m, mojitType, mojits = ['a', 'aa', 'ba'];
                var r, res, ress, found;
                for (m = 0; m < mojits.length; m += 1) {
                    mojitType = mojits[m];

                    ress = store.getResources('server', {}, {mojit: mojitType});
                    found = 0;
                    for (r = 0; r < ress.length; r += 1) {
                        res = ress[r];
                        if (res.id === 'yui-module--b') { found += 1; }
                        if (res.id === 'yui-module--ab') { found += 1; }
                        if (res.id === 'yui-module--bb') { found += 1; }
                        if (res.id === 'yui-module--cb') { found += 1; }
                    }
                    A.areSame(4, found, 'some child node_modules not loaded');
                }

                var details = store.getMojitTypeDetails('server', {}, 'a');
                A.isNotNull(details['controller-path'].match(/a\/foo\/controller\.server\.js$/), 'controller should not be null');
            },

            'find and parse resources by convention': function() {
                var fixtures = libpath.join(__dirname, '../../fixtures/conventions'),
                    store = new Y.mojito.ResourceStore({ root: fixtures });

                // fake out some parts of preload(), which we're trying to avoid
                store._fwConfig = store.config.readConfigJSON(libpath.join(mojitoRoot, 'config.json'));
                store._appConfigStatic = store.getStaticAppConfig();

                var dir = libpath.join(__dirname, '../../fixtures/conventions');
                var pkg = { name: 'test', version: '6.6.6' };
                var mojitType = 'testing';
                var ress = store._findResourcesByConvention(dir, 'app', pkg, mojitType)

                var r, res;
                for (r = 0; r < ress.length; r++) {
                    res = ress[r];
                    A.isNotUndefined(res.id, 'no resource id');
                    switch (res.id) {
                        case 'action--x':
                            A.areSame(pkg, res.source.pkg);
                            A.areSame('action', res.type);
                            A.areSame('x', res.name);
                            switch (res.source.fs.basename) {
                                case 'x.common':
                                    A.areSame('*', res.selector);
                                    A.areSame('common', res.affinity);
                                    A.areSame('.js', res.source.fs.ext);
                                    A.areSame('x', res.name);
                                    break;
                                case 'x.common.iphone':
                                    A.areSame('iphone', res.selector);
                                    A.areSame('common', res.affinity);
                                    A.areSame('.js', res.source.fs.ext);
                                    A.areSame('x', res.name);
                                    break;
                                default:
                                    A.fail('unknown resource ' + res.source.fs.fullPath);
                                    break;
                            }
                            break;
                        case 'action--y/z':
                            A.areSame(pkg, res.source.pkg);
                            A.areSame('action', res.type);
                            A.areSame('y/z', res.name);
                            A.areSame('*', res.selector);
                            A.areSame('common', res.affinity);
                            A.areSame('.js', res.source.fs.ext);
                            A.areSame('z.common', res.source.fs.basename);
                            break;
                        case 'addon-a-x':
                            A.areSame(pkg, res.source.pkg);
                            A.areSame('addon', res.type);
                            A.areSame('a', res.subtype);
                            A.areSame('x', res.name);
                            switch (res.source.fs.basename) {
                                case 'x.common':
                                    A.areSame('*', res.selector);
                                    A.areSame('common', res.affinity);
                                    A.areSame('.js', res.source.fs.ext);
                                    A.areSame('x', res.name);
                                    break;
                                case 'x.common.iphone':
                                    A.areSame('iphone', res.selector);
                                    A.areSame('common', res.affinity);
                                    A.areSame('.js', res.source.fs.ext);
                                    A.areSame('x', res.name);
                                    break;
                                default:
                                    A.fail('unknown resource ' + res.source.fs.fullPath);
                                    break;
                            }
                            break;
                        case 'archetype-x-y':
                            A.areSame(pkg, res.source.pkg);
                            A.areSame('archetype', res.type);
                            A.areSame('x', res.subtype);
                            A.areSame('y', res.name);
                            A.areSame('y', res.source.fs.basename);
                            break;
                        case 'asset-css-x':
                            A.areSame(pkg, res.source.pkg);
                            A.areSame('asset', res.type);
                            A.areSame('css', res.subtype);
                            A.areSame('x', res.name);
                            switch (res.source.fs.basename) {
                                case 'x':
                                    A.areSame('*', res.selector);
                                    A.areSame('common', res.affinity);
                                    A.areSame('.css', res.source.fs.ext);
                                    break;
                                case 'x.iphone':
                                    A.areSame('iphone', res.selector);
                                    A.areSame('common', res.affinity);
                                    A.areSame('.css', res.source.fs.ext);
                                    break;
                                default:
                                    A.fail('unknown resource ' + res.source.fs.fullPath);
                                    break;
                            }
                            break;
                        case 'asset-css-y/z':
                            A.areSame(pkg, res.source.pkg);
                            A.areSame('asset', res.type);
                            A.areSame('css', res.subtype);
                            A.areSame('y/z', res.name);
                            switch (res.source.fs.basename) {
                                case 'z':
                                    A.areSame('*', res.selector);
                                    A.areSame('common', res.affinity);
                                    A.areSame('.css', res.source.fs.ext);
                                    break;
                                case 'z.android':
                                    A.areSame('android', res.selector);
                                    A.areSame('common', res.affinity);
                                    A.areSame('.css', res.source.fs.ext);
                                    break;
                                default:
                                    A.fail('unknown resource ' + res.source.fs.fullPath);
                                    break;
                            }
                            break;
                        case 'binder--x':
                            A.areSame(pkg, res.source.pkg);
                            A.areSame('binder', res.type);
                            A.areSame('x', res.name);
                            switch (res.source.fs.basename) {
                                case 'x':
                                    A.areSame('*', res.selector);
                                    A.areSame('common', res.affinity);
                                    A.areSame('.js', res.source.fs.ext);
                                    break;
                                case 'x.iphone':
                                    A.areSame('iphone', res.selector);
                                    A.areSame('common', res.affinity);
                                    A.areSame('.js', res.source.fs.ext);
                                    break;
                                default:
                                    A.fail('unknown resource ' + res.source.fs.fullPath);
                                    break;
                            }
                            break;
                        case 'command--x':
                            A.areSame(pkg, res.source.pkg);
                            A.areSame('command', res.type);
                            A.areSame('x', res.name);
                            A.areSame('x', res.source.fs.basename);
                            break;
                        case 'config--config':
                            A.areSame(pkg, res.source.pkg);
                            A.areSame('config', res.type);
                            A.areSame('config', res.name);
                            A.areSame('config', res.source.fs.basename);
                            A.areSame('.json', res.source.fs.ext);
                            break;
                        case 'controller--controller':
                            A.areSame(pkg, res.source.pkg);
                            A.areSame('controller', res.type);
                            A.areSame('controller', res.name);
                            switch (res.source.fs.basename) {
                                case 'controller.common':
                                    A.areSame('*', res.selector);
                                    A.areSame('common', res.affinity);
                                    A.areSame('.js', res.source.fs.ext);
                                    break;
                                case 'controller.server.iphone':
                                    A.areSame('iphone', res.selector);
                                    A.areSame('server', res.affinity);
                                    A.areSame('.js', res.source.fs.ext);
                                    break;
                                default:
                                    A.fail('unknown resource ' + res.source.fs.fullPath);
                                    break;
                            }
                            break;
                        case 'middleware--x':
                            A.areSame(pkg, res.source.pkg);
                            A.areSame('middleware', res.type);
                            A.areSame('x', res.name);
                            A.areSame('x', res.source.fs.basename);
                            A.areSame('.js', res.source.fs.ext);
                            break;
                        case 'spec--default':
                            A.areSame(pkg, res.source.pkg);
                            A.areSame('spec', res.type);
                            A.areSame('default', res.name);
                            A.areSame('default', res.source.fs.basename);
                            A.areSame('.json', res.source.fs.ext);
                            break;
                        case 'spec--x':
                            A.areSame(pkg, res.source.pkg);
                            A.areSame('spec', res.type);
                            A.areSame('testing', res.mojit);
                            A.areSame('x', res.name);
                            A.areSame('x', res.source.fs.basename);
                            A.areSame('.json', res.source.fs.ext);
                            break;
                        case 'view--x':
                            A.areSame(pkg, res.source.pkg);
                            A.areSame('view', res.type);
                            A.areSame('x', res.name);
                            A.areSame('html', res.view.outputFormat);
                            A.areSame('hb', res.view.engine);
                            switch (res.source.fs.basename) {
                                case 'x.hb':
                                    A.areSame('*', res.selector);
                                    A.areSame('common', res.affinity);
                                    A.areSame('.html', res.source.fs.ext);
                                    break;
                                case 'x.iphone.hb':
                                    A.areSame('iphone', res.selector);
                                    A.areSame('common', res.affinity);
                                    A.areSame('.html', res.source.fs.ext);
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
                A.areSame(21, ress.length, 'wrong number of resources');
            }

    }));

    Y.Test.Runner.add(suite);

});
