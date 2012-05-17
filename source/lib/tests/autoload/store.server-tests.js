/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-store-server-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        libpath = require('path'),
        fixtures = libpath.join(__dirname, '../fixtures/store'),
        mojitoRoot = libpath.join(__dirname, '../..'),
        ResourceStore = require(libpath.join(__dirname, '../../store.server')),
        Mock = YUITest.Mock,
        A = YUITest.Assert,
        AA = YUITest.ArrayAssert;

    suite.add(new YUITest.TestCase({

        name: 'Store tests',

        'pre load': function() {

            var store = new ResourceStore(fixtures);
            store.preload();

            //Y.log(JSON.stringify(store,null,4));
            A.isTrue(store._root === fixtures);
        },

        'pre load no application.json file': function() {

            var fixtures = libpath.join(__dirname, '../fixtures/store_no_app_config'),
                store = new ResourceStore(fixtures);
            store.preload();

            //Y.log(JSON.stringify(store,null,4));
            A.isTrue(store._root === fixtures);
        },

        'server app config value': function() {

            var store = new ResourceStore(fixtures);
            store.preload();

            var config = store.getAppConfig(null, 'application');
            A.isTrue(config.testKey1 === 'testVal1');
        },

        'server mojit config value': function() {

            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = {base:'test1'};
            store.expandInstance(instance, {}, function(err, instance){

                A.isTrue(instance.id === 'test1', 'wrong ID');
                A.isTrue(instance.type === 'test_mojit_1', 'wrong type');
                A.isTrue(instance.config.testKey4 === 'testVal4', 'missing key from definition.json');
            });
        },

        'server mojit config value via type': function() {

            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = {type:'test_mojit_1'};
            store.expandInstance(instance, {}, function(err, instance){

                A.isTrue(instance.type === 'test_mojit_1', 'wrong ID');
                A.isTrue(instance.config.testKey4 === 'testVal4', 'missing config from definition.json');
                A.isTrue(instance.config.testKey6.testKey7 === 'testVal7', 'missing deep config from definition.json');
            });
        },

        'server mojit config value via type & overrride': function() {

            var store = new ResourceStore(fixtures);
            store.preload();

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

            var store = new ResourceStore(fixtures);
            store.preload();

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

            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = {type:'test_mojit_1'};
            store.expandInstance(instance, {}, function(err, instance) {
                A.areSame(3, Y.Object.keys(instance.views).length);

                A.isObject(instance.views['test_1']);
                A.areSame(libpath.join(fixtures, 'mojits/test_mojit_1/views/test_1.mu.html'), instance.views['test_1']['content-path']);
                A.areSame('mu', instance.views['test_1']['engine']);
                A.areSame('/static/test_mojit_1/binders/test_1.js', instance.views['test_1']['binder-url']);
                A.areSame(libpath.join(fixtures, 'mojits/test_mojit_1/binders/test_1.js'), instance.views['test_1']['binder-path']);
                A.areSame('test_mojit_1Bindertest_1', instance.views['test_1']['binder-module']);
                A.isNotUndefined(instance.views['test_1']['binder-yui-sorted']['mojito-client']);

                A.isObject(instance.views['test_2']);
                A.areSame(libpath.join(fixtures, 'mojits/test_mojit_1/views/test_2.mu.html'), instance.views['test_2']['content-path']);
                A.areSame('mu', instance.views['test_2']['engine']);

                A.isObject(instance.views['subdir/test_1']);
                A.areSame(libpath.join(fixtures, 'mojits/test_mojit_1/views/subdir/test_1.mu.html'), instance.views['subdir/test_1']['content-path']);
                A.areSame('mu', instance.views['subdir/test_1']['engine']);
                A.areSame('/static/test_mojit_1/binders/subdir/test_1.js', instance.views['subdir/test_1']['binder-url']);
                A.areSame(libpath.join(fixtures, 'mojits/test_mojit_1/binders/subdir/test_1.js'), instance.views['subdir/test_1']['binder-path']);
                A.areSame('test_mojit_1Bindersubdir/test_1', instance.views['subdir/test_1']['binder-module']);
                A.isNotUndefined(instance.views['subdir/test_1']['binder-yui-sorted']['mojito-client']);
            });
        },

        'server mojit instance models': function() {

            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = {type:'test_mojit_1'};
            store.expandInstance(instance, {}, function(err, instance) {
                A.areSame(4, Y.Object.keys(instance.models).length);
                A.areSame(libpath.join(fixtures, 'models/flickr.common.js'), instance.models['flickr']);
                A.areSame(libpath.join(fixtures, 'mojits/test_applevel/models/test_applevel.server.js'), instance.models['test_applevel']);
                A.areSame(libpath.join(fixtures, 'mojits/test_mojit_1/models/test_1.server.js'), instance.models['test_1']);
                A.areSame(libpath.join(fixtures, 'mojits/test_mojit_1/models/test_2.server.js'), instance.models['test_2']);

                A.areSame(4, Y.Object.keys(instance.modelYUIModuleNames).length);
                A.isTrue(instance.modelYUIModuleNames['ModelFlickr']);
                A.isTrue(instance.modelYUIModuleNames['test_applevelModel']);
                A.isTrue(instance.modelYUIModuleNames['test_mojit_1_model_test_1']);
                A.isTrue(instance.modelYUIModuleNames['test_mojit_1_model_test_2']);
            });
        },

        'server mojit instance actions': function() {

            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = {type:'test_mojit_1'};
            store.expandInstance(instance, {}, function(err, instance) {
                var actions = instance.actions.sort();
                A.areSame(2, actions.length);
                A.areSame(libpath.join(fixtures, 'mojits/test_mojit_1/actions/test_1.server.js'), actions[0]);
                A.areSame(libpath.join(fixtures, 'mojits/test_mojit_1/actions/test_2.server.js'), actions[1]);
            });
        },

        'server mojit instance yui': function() {

            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = {type:'TestMojit2'};
            store.expandInstance(instance, {}, function(err, instance) {
                A.isNotUndefined(instance.yui);

                A.isNotUndefined(instance.yui.config);
                A.isNotUndefined(instance.yui.config.modules);
                A.isNotUndefined(instance.yui.config.modules['test_mojit_2']);
                A.areSame(libpath.join(fixtures, 'mojits/test_mojit_2/controller.server.js'), instance.yui.config.modules['test_mojit_2'].fullpath);
                A.isNotUndefined(instance.yui.config.modules['mojito-mu']);
                A.areSame(libpath.join(mojitoRoot, 'app/addons/view-engines/mu.server.js'), instance.yui.config.modules['mojito-mu'].fullpath);

                A.isObject(instance.yui.langs);
                A.areSame(2, Y.Object.keys(instance.yui.langs).length, 'wrong number of langs');
                A.areSame('lang/test_mojit_2_en-US', instance.yui.langs['en-US']);
                A.areSame('lang/test_mojit_2_de', instance.yui.langs['de']);

                A.isArray(instance.yui.requires);
                AA.contains('test_mojit_2', instance.yui.requires);
                AA.doesNotContain('test_applevelModel', instance.yui.requires);
                AA.doesNotContain('ModelFlickr', instance.yui.requires);
                AA.contains('mojito-mu', instance.yui.requires);
                AA.contains('mojito', instance.yui.requires);

                A.isArray(instance.yui.sorted);
                AA.contains('test_mojit_2', instance.yui.sorted);
                AA.doesNotContain('test_applevelModel', instance.yui.sorted);
                AA.doesNotContain('ModelFlickr', instance.yui.sorted);
                AA.contains('mojito-mu', instance.yui.sorted);
                AA.contains('mojito', instance.yui.sorted);

                A.isObject(instance.yui.sortedPaths);
                A.areSame(libpath.join(fixtures, 'mojits/test_mojit_2/controller.server.js'), instance.yui.sortedPaths['test_mojit_2']);
                A.isUndefined(instance.yui.sortedPaths['test_applevelModel']);
                A.isUndefined(instance.yui.sortedPaths['ModelFlickr']);
                A.areSame(libpath.join(mojitoRoot, 'app/addons/view-engines/mu.server.js'), instance.yui.sortedPaths['mojito-mu']);
                A.areSame(libpath.join(mojitoRoot, 'app/autoload/mojito.common.js'), instance.yui.sortedPaths['mojito']);
            });

        },

        'server mojit instance yui - precomputed': function() {

            var fixtures = libpath.join(__dirname, '../fixtures/precomputed');
            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = { type:'PagedFlickr' };
            store.expandInstance(instance, {}, function(err, instance) {
                A.isNotUndefined(instance.yui);

                A.isArray(instance.yui.requires);
                AA.contains('mojito', instance.yui.requires);
                AA.contains('mojito-dispatcher', instance.yui.requires);
                AA.contains('mojito-mu', instance.yui.requires);
                AA.contains('PagedFlickr', instance.yui.requires);

                A.isArray(instance.yui.sorted);
                AA.contains('intl', instance.yui.sorted);
                AA.contains('datatype-date-format', instance.yui.sorted);
                AA.contains('mojito', instance.yui.sorted);
                AA.contains('mojito-util', instance.yui.sorted);
                AA.contains('mojito-intl-addon', instance.yui.sorted);
                AA.contains('lang/PagedFlickr_de', instance.yui.sorted);
                AA.contains('lang/PagedFlickr_en', instance.yui.sorted);
                AA.contains('lang/PagedFlickr_en-US', instance.yui.sorted);
                AA.contains('lang/datatype-date-format_de', instance.yui.sorted);
                AA.contains('lang/datatype-date-format_en', instance.yui.sorted);
                AA.contains('lang/datatype-date-format_en-US', instance.yui.sorted);

                A.isObject(instance.yui.sortedPaths);
                A.isNotUndefined(instance.yui.sortedPaths['intl']);
                A.isNotUndefined(instance.yui.sortedPaths['datatype-date-format']);
                A.isNotUndefined(instance.yui.sortedPaths['mojito']);
                A.isNotUndefined(instance.yui.sortedPaths['mojito-util']);
                A.isNotUndefined(instance.yui.sortedPaths['mojito-intl-addon']);
                A.areSame(libpath.join(fixtures, 'mojits/PagedFlickr/controller.common.js'), instance.yui.sortedPaths['PagedFlickr']);
                A.areSame(libpath.join(fixtures, 'mojits/PagedFlickr/lang/PagedFlickr_de.js'), instance.yui.sortedPaths['lang/PagedFlickr_de']);
                A.areSame(libpath.join(fixtures, 'mojits/PagedFlickr/lang/PagedFlickr_en.js'), instance.yui.sortedPaths['lang/PagedFlickr_en']);
                A.areSame(libpath.join(fixtures, 'mojits/PagedFlickr/lang/PagedFlickr_en-US.js'), instance.yui.sortedPaths['lang/PagedFlickr_en-US']);
                A.isNotUndefined(instance.yui.sortedPaths['lang/datatype-date-format_de']);
                A.isNotUndefined(instance.yui.sortedPaths['lang/datatype-date-format_en']);
                A.isNotUndefined(instance.yui.sortedPaths['lang/datatype-date-format_en-US']);

                A.isObject(instance.yui.langs);
                A.areSame('lang/PagedFlickr_de', instance.yui.langs['de']);
                A.areSame('lang/PagedFlickr_en', instance.yui.langs['en']);
                A.areSame('lang/PagedFlickr_en-US', instance.yui.langs['en-US']);
            });

        },

        'server mojit instance yui - ondemand': function() {

            var fixtures = libpath.join(__dirname, '../fixtures/ondemand');
            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = { type:'PagedFlickr' };
            store.expandInstance(instance, {}, function(err, instance) {
                A.isNotUndefined(instance.yui);

                A.isArray(instance.yui.requires);
                AA.contains('mojito', instance.yui.requires);
                AA.contains('mojito-dispatcher', instance.yui.requires);
                AA.contains('mojito-controller-context', instance.yui.requires);
                AA.contains('mojito-action-context', instance.yui.requires);
                AA.contains('mojito-output-adapter-addon', instance.yui.requires);
                AA.contains('mojito-deploy-addon', instance.yui.requires);
                AA.contains('mojito-partial-addon', instance.yui.requires);
                AA.contains('mojito-url-addon', instance.yui.requires);
                AA.contains('mojito-mu', instance.yui.requires);
                AA.contains('mojito-util', instance.yui.requires);
                AA.contains('mojito-view-renderer', instance.yui.requires);
                AA.contains('ModelFlickr', instance.yui.requires);
                AA.contains('PagedFlickr', instance.yui.requires);
                AA.contains('lang/PagedFlickr_de', instance.yui.requires);
                AA.contains('lang/PagedFlickr_en', instance.yui.requires);
                AA.contains('lang/PagedFlickr_en-US', instance.yui.requires);

                A.isUndefined(instance.yui.sorted);
                A.isUndefined(instance.yui.sortedPaths);

                A.isObject(instance.yui.langs);
                A.areSame('lang/PagedFlickr_de', instance.yui.langs['de']);
                A.areSame('lang/PagedFlickr_en', instance.yui.langs['en']);
                A.areSame('lang/PagedFlickr_en-US', instance.yui.langs['en-US']);
            });

        },

        'server mojit instance yui - precomputed+ondemand': function() {

            var fixtures = libpath.join(__dirname, '../fixtures/precomputed-ondemand');
            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = { type:'PagedFlickr' };
            store.expandInstance(instance, {}, function(err, instance) {
                A.isNotUndefined(instance.yui);

                A.isArray(instance.yui.requires);
                AA.contains('mojito', instance.yui.requires);
                AA.contains('mojito-dispatcher', instance.yui.requires);
                AA.contains('mojito-controller-context', instance.yui.requires);
                AA.contains('mojito-action-context', instance.yui.requires);
                AA.contains('mojito-output-adapter-addon', instance.yui.requires);
                AA.contains('mojito-deploy-addon', instance.yui.requires);
                AA.contains('mojito-partial-addon', instance.yui.requires);
                AA.contains('mojito-url-addon', instance.yui.requires);
                AA.contains('mojito-mu', instance.yui.requires);
                AA.contains('mojito-util', instance.yui.requires);
                AA.contains('mojito-view-renderer', instance.yui.requires);
                AA.contains('ModelFlickr', instance.yui.requires);
                AA.contains('PagedFlickr', instance.yui.requires);
                AA.contains('lang/PagedFlickr_de', instance.yui.requires);
                AA.contains('lang/PagedFlickr_en', instance.yui.requires);
                AA.contains('lang/PagedFlickr_en-US', instance.yui.requires);

                A.isArray(instance.yui.sorted);
                AA.doesNotContain('intl', instance.yui.sorted);
                AA.doesNotContain('datatype-date-format', instance.yui.sorted);
                AA.contains('mojito', instance.yui.sorted);
                AA.doesNotContain('mojito-util', instance.yui.sorted);
                AA.doesNotContain('mojito-intl-addon', instance.yui.sorted);
                AA.contains('lang/PagedFlickr_de', instance.yui.sorted);
                AA.contains('lang/PagedFlickr_en', instance.yui.sorted);
                AA.contains('lang/PagedFlickr_en-US', instance.yui.sorted);
                AA.doesNotContain('lang/datatype-date-format_de', instance.yui.sorted);
                AA.doesNotContain('lang/datatype-date-format_en', instance.yui.sorted);
                AA.doesNotContain('lang/datatype-date-format_en-US', instance.yui.sorted);

                A.isObject(instance.yui.sortedPaths);
                A.isUndefined(instance.yui.sortedPaths['intl']);
                A.isUndefined(instance.yui.sortedPaths['datatype-date-format']);
                A.isNotUndefined(instance.yui.sortedPaths['mojito']);
                A.isUndefined(instance.yui.sortedPaths['mojito-util']);
                A.isUndefined(instance.yui.sortedPaths['mojito-intl-addon']);
                A.areSame(libpath.join(fixtures, 'mojits/PagedFlickr/controller.common.js'), instance.yui.sortedPaths['PagedFlickr']);
                A.areSame(libpath.join(fixtures, 'mojits/PagedFlickr/lang/PagedFlickr_de.js'), instance.yui.sortedPaths['lang/PagedFlickr_de']);
                A.areSame(libpath.join(fixtures, 'mojits/PagedFlickr/lang/PagedFlickr_en.js'), instance.yui.sortedPaths['lang/PagedFlickr_en']);
                A.areSame(libpath.join(fixtures, 'mojits/PagedFlickr/lang/PagedFlickr_en-US.js'), instance.yui.sortedPaths['lang/PagedFlickr_en-US']);
                A.isUndefined(instance.yui.sortedPaths['lang/datatype-date-format_de']);
                A.isUndefined(instance.yui.sortedPaths['lang/datatype-date-format_en']);
                A.isUndefined(instance.yui.sortedPaths['lang/datatype-date-format_en-US']);

                A.isObject(instance.yui.langs);
                A.areSame('lang/PagedFlickr_de', instance.yui.langs['de']);
                A.areSame('lang/PagedFlickr_en', instance.yui.langs['en']);
                A.areSame('lang/PagedFlickr_en-US', instance.yui.langs['en-US']);
            });

        },

        'dynamic handling of mojit definition.json': function() {
            var store = new ResourceStore(fixtures);
            store.preload();
            A.areSame(libpath.join(fixtures, 'mojits/test_mojit_1/definition.json'), store._dynamicURLs['/static/test_mojit_1/definition.json']);
        },

        'server mojit type name can come from package.json': function() {
            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = {type:'TestMojit2'};
            store.expandInstance(instance, {}, function(err, instance){
                A.isNotUndefined(instance.controller);
                A.areSame('/static/TestMojit2/assets', instance.assetsRoot);
                A.isNotUndefined(instance.yui.config.modules.test_mojit_2);
            });
        },

        'server mojit is NOT loaded because of package mojito version miss-match': function(){
            var store = new ResourceStore(fixtures);
            store.preload();

            A.isTrue(typeof store._staticURLs['/static/test_mojit_4/package.json'] === 'undefined');
            A.isTrue(typeof store._staticURLs['/static/TestMojit4/package.json'] === 'undefined');
        },

        'server mojit is loaded because of package mojito version match': function(){
            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = {type:'TestMojit2'};
            store.expandInstance(instance, {}, function(err, instance){
                A.areSame('/static/TestMojit2/assets', instance.assetsRoot);
            });
        },

        'server a mojits package.json file is NOT publicly accessible': function(){
            var store = new ResourceStore(fixtures);
            store.preload();

            A.isTrue(typeof store._staticURLs['/static/TestMojit2/package.json'] === 'undefined');
        },

        'server a mojits package.json file is publicly accessible': function(){
            var store = new ResourceStore(fixtures);
            store.preload();

            A.isTrue(typeof store._staticURLs['/static/TestMojit3/package.json'] === 'string');
        },

        'server a mojit is NOT loaded because it has a package.json file with no mojito config': function(){
            var store = new ResourceStore(fixtures);
            store.preload();

            A.isTrue(typeof store._staticURLs['/static/TestMojit5/package.json'] === 'undefined');
        },

        'server mojit view index.mu.html is loaded correctly': function(){
            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = {type:'TestMojit3'};
            store.expandInstance(instance, {}, function(err, instance){
                A.areSame('index.mu.html', instance.views.index['content-path'].split('/').pop());
            });
        },

        'server mojit view index.iphone.mu.html is loaded correctly': function(){
            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = {type:'TestMojit3'};
            store.expandInstance(instance, {device:'iphone'}, function(err, instance){
                A.areSame('index.iphone.mu.html', instance.views.index['content-path'].split('/').pop());
            });
        },

        'server mojit view index1.mu.html is loaded correctly': function(){
            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = {type:'TestMojit3'};
            store.expandInstance(instance, {device:'forotheriphone'}, function(err, instance){
                A.areSame('index1.forotheriphone.mu.html', instance.views.index1['content-path'].split('/').pop());
            });
        },

        'server mojit view index1.iphone.mu.html is loaded correctly': function(){
            var store = new ResourceStore(fixtures);
            store.preload();

            var instance = {type:'TestMojit3'};
            store.expandInstance(instance, {device:'otheriphone'}, function(err, instance){
                A.areSame('index1.otheriphone.mu.html', instance.views.index1['content-path'].split('/').pop());
            });
        },

        'app-level mojits': function() {
            var store = new ResourceStore(fixtures);
            store.preload();
            var instance = { type: 'test_mojit_1' };
            store.expandInstance(instance, {}, function(err, instance) {
                A.isNotUndefined(instance.models.test_applevel);
            });
        },

        'mojitDirs setting': function() {
            var store = new ResourceStore(fixtures);
            store.preload();
            var instance = { type: 'soloMojit' };
            store.expandInstance(instance, {}, function(err, instance) {
                A.isNotUndefined(instance.controller);
            });
        },

        'expandInstance caching': function() {
            var store = new ResourceStore(fixtures);
            store.preload();
            var instance = 'foo';
            var context = {};
            store._expandInstanceCache.server[JSON.stringify(instance)+JSON.stringify(context)] = 'bar';
            store.expandInstance(instance, context, function(err, instance) {
                A.areEqual('bar', instance);
            });
        },

        'rollups mojits': function() {
            var store = new ResourceStore(fixtures);
            store.preload();

            var rollups = store.getRollupsMojits('client', {});
            // We'll just check test_mojit_1, so that this test doesn't break as others add mojits to the fixtures
            var rollup = rollups['rollups'];
            A.isNotUndefined(rollup);
            A.areEqual(rollup.dest, libpath.join(fixtures,'mojits/rollups/rollup.client.js'), 'wrong dest');
            A.areEqual(3, rollup.srcs.length, 'wrong number of sources');
            rollup.srcs.sort();
            A.areEqual(rollup.srcs[0], libpath.join(fixtures,'mojits/rollups/binders/index.js'));
            A.areEqual(rollup.srcs[1], libpath.join(fixtures,'mojits/rollups/controller.common.js'));
            A.areEqual(rollup.srcs[2], libpath.join(fixtures,'mojits/rollups/models/model.client.js'));
        },

        'rollups app': function() {
            var store = new ResourceStore(fixtures);
            store.preload();

            var rollup = store.getRollupsApp('client', {});
            A.isNotUndefined(rollup);
            A.areEqual(rollup.dest, libpath.join(fixtures,'rollup.client.js'));
            // Hmmm... since the rollups.src list contains a great deal of the
            // Mojito framework YUI modules, and since those change often, it's
            // a bit fragile to do a hard test for specific values.
            // So, instead, we'll just test for a few things.
            AA.contains(libpath.join(fixtures, 'models/flickr.common.js'), rollup.srcs);
            AA.contains(libpath.join(mojitoRoot, 'app/autoload/mojito.common.js'), rollup.srcs);
            AA.contains(libpath.join(mojitoRoot, 'app/autoload/mojito-client.client.js'), rollup.srcs);
        },

        'inline css mojits': function() {
            var store = new ResourceStore(fixtures);
            store.preload();

            var inlines = store.getInlineCssMojits('client', {});
            // We'll just check test_mojit_1, so that this test doesn't break as others add mojits to the fixtures
            var found = 0;
            Y.Array.each(inlines, function(inline) {
                if (inline.mojitName !== 'inlinecss') {
                    return;
                }
                ++found;
                if (inline.context.device && 'iphone' === inline.context.device) {
                    A.areEqual(inline.dest, libpath.join(fixtures,'mojits/inlinecss/autoload/compiled/inlinecss.iphone.common.js'));
                    A.areEqual(inline.yuiModuleName, 'inlinecss/inlinecss');
                    A.areEqual(3, Object.keys(inline.srcs).length);
                    A.areEqual(inline.srcs['/static/inlinecss/assets/foo.css'], libpath.join(fixtures,'mojits/inlinecss/assets/foo.css'));
                    A.areEqual(inline.srcs['/static/inlinecss/assets/bar.iphone.css'], libpath.join(fixtures,'mojits/inlinecss/assets/bar.iphone.css'));
                    A.areEqual(inline.srcs['/static/inlinecss/assets/deeper/foo.css'], libpath.join(fixtures,'mojits/inlinecss/assets/deeper/foo.css'));
                }
                else {
                    A.areEqual(inline.dest, libpath.join(fixtures,'mojits/inlinecss/autoload/compiled/inlinecss.common.js'));
                    A.areEqual(inline.yuiModuleName, 'inlinecss/inlinecss');
                    A.areEqual(3, Object.keys(inline.srcs).length);
                    A.areEqual(inline.srcs['/static/inlinecss/assets/foo.css'], libpath.join(fixtures,'mojits/inlinecss/assets/foo.css'));
                    A.areEqual(inline.srcs['/static/inlinecss/assets/bar.css'], libpath.join(fixtures,'mojits/inlinecss/assets/bar.css'));
                    A.areEqual(inline.srcs['/static/inlinecss/assets/deeper/foo.css'], libpath.join(fixtures,'mojits/inlinecss/assets/deeper/foo.css'));
                }
            });
            A.areEqual(2, found);
        },

        'multi preload, and setLogger()': function() {
            var store = new ResourceStore(fixtures);
            var logsBefore, logs = 0;
            store.setLogger({ log: function() {
                logs++;
            } });
            store.preload();
            logsBefore = logs;
            store.preload();
            A.areSame(logsBefore, logs);
        },

        'call getSpec()': function() {
            var store = new ResourceStore(fixtures);
            store.preload();
            store.getSpec('server', 'test1', {}, function(err, instance) {
                A.areSame('test_mojit_1', instance.type);
                A.areSame('test1', instance.id);
                // ... and all the type-specific parts...
                A.areSame('/static/test_mojit_1/assets', instance.assetsRoot);
            });
        },

        'call getType()': function() {
            var store = new ResourceStore(fixtures);
            store.preload();
            store.getType('server', 'test_mojit_1', {}, function(err, instance) {
                A.areSame('test_mojit_1', instance.type);
                A.isUndefined(instance.id);
                // ... and all the type-specific parts...
                A.areSame('/static/test_mojit_1/assets', instance.assetsRoot);
            });
        },

        'instance with base pointing to non-existant spec': function() {
            var store = new ResourceStore(fixtures),
                spec = { base: 'nonexistant' };
            store.preload();
            store.expandInstance(spec, {}, function(err, instance) {
                A.isNotUndefined(err);
                A.isUndefined(instance);
            });
        },

        'getAppConfig() returns contextualized info': function() {
            var store = new ResourceStore(fixtures),
                config,
                context = { runtime: 'server' };
            store.preload(context);
            config = store.getAppConfig(null, 'application');
            A.isObject(config);
            A.areSame('testVal1-server', config.testKey1, 'testKey1 wasnt contextualized to the server');
            A.areSame('testVal2', config.testKey2, 'testKey2 gotten from the wrong context');
            A.areSame('portended', config.pathos, 'missing contextualized config');
            A.isUndefined(config.testKey4, 'testKey4 gotten from the wrong context');
        },

        'getAppConfig() for something other than "definition"': function() {
            var store = new ResourceStore(fixtures);
            store.preload();
            var config = store.getAppConfig({}, 'routes');
            A.isObject(config);
            A.isObject(config.flickr_by_page);
            A.isObject(config.flickr_base);
        },

        'call getRoutes()': function() {
            var store = new ResourceStore(fixtures);
            store.preload();
            var routes = store.getRoutes({});
            A.isObject(routes, 'no routes at all');
            A.isObject(routes.flickr_by_page, 'missing route flickr_by_page');
            A.isObject(routes.flickr_base, 'missing route flickr_base');
        },

        'call fileFromStaticHandlerURL()': function() {
            var store = new ResourceStore(fixtures);
            store.preload();
            var fullpath = store.fileFromStaticHandlerURL('/static/TestMojit2/controller.server.js');
            A.areSame(libpath.join(fixtures, 'mojits/test_mojit_2/controller.server.js'), fullpath);
        },

        'call serializeClientStore()': function() {
            var store = new ResourceStore(fixtures);
            store.preload();
            var client = store.serializeClientStore({}, []);
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
            var store = new ResourceStore(fixtures);
            store.preload();
            var list = store.listAllMojits('server');
            A.areSame(9, list.length, 'found the wrong number of mojits');
            AA.contains('DaliProxy', list);
            AA.contains('HTMLFrameMojit', list);
            AA.contains('LazyLoad', list);
            AA.contains('inlinecss', list);
            AA.contains('rollups', list);
            AA.contains('test_mojit_1', list);
            AA.contains('TestMojit2', list);
            AA.contains('TestMojit3', list);
            AA.contains('soloMojit', list);
        },

        'call getAllMojits()': function() {
            var store = new ResourceStore(fixtures);
            store.preload();
            var mojits = store.getAllMojits('server', {});
            A.areSame(9, Object.keys(mojits).length, 'Found the wrong number of mojits');
            A.isObject(mojits.DaliProxy);
            // DaliProxy has no static assets
            A.isUndefined(mojits.DaliProxy.assetsRoot);
            A.isObject(mojits.HTMLFrameMojit);
            // HTMLFrameMojit has no static assets
            A.isUndefined(mojits.HTMLFrameMojit.assetsRoot);
            A.isObject(mojits.LazyLoad);
            A.isObject(mojits.inlinecss);
            A.areSame('/static/inlinecss/assets', mojits.inlinecss.assetsRoot, "'/static/inlinecss/assets', mojits.inlinecss.assetsRoot");
            A.isObject(mojits.rollups);
            A.areSame('/static/rollups/assets', mojits.rollups.assetsRoot, "'/static/rollups/assets', mojits.rollups.assetsRoot");
            A.isObject(mojits.test_mojit_1);
            A.areSame('/static/test_mojit_1/assets', mojits.test_mojit_1.assetsRoot, "'/static/test_mojit_1/assets', mojits.test_mojit_1.assetsRoot");
            A.isObject(mojits.TestMojit2);
            A.areSame('/static/TestMojit2/assets', mojits.TestMojit2.assetsRoot, "'/static/TestMojit2/assets', mojits.TestMojit2.assetsRoot");
            A.isObject(mojits.TestMojit3);
            A.areSame('/static/TestMojit3/assets', mojits.TestMojit3.assetsRoot, "'/static/TestMojit3/assets', mojits.TestMojit3.assetsRoot");
            A.isObject(mojits.soloMojit);
            A.areSame('/static/soloMojit/assets', mojits.soloMojit.assetsRoot, "'/static/soloMojit/assets', mojits.soloMojit.assetsRoot");
        },

        'stuff with ctx{lang:}, in language fallback': function() {
            var fixtures = libpath.join(__dirname, '../fixtures/gsg5'),
                store = new ResourceStore(fixtures),
                ctx, spec;
            store.preload();

            // first test
            ctx = { lang: 'en-US' };
            spec = { type: 'PagedFlickr' };
            store.expandInstance(spec, ctx, function(err, instance) {
                A.isNotUndefined(instance.yui.sortedPaths['lang/PagedFlickr_en-US'], 'en-US is undefined {lang:en-US}');
                A.isNotUndefined(instance.yui.sortedPaths['lang/PagedFlickr_en'], 'en is undefined {lang:en-US}');

                // second test
                ctx = { lang: 'en' };
                spec = { type: 'PagedFlickr' };
                store.expandInstance(spec, ctx, function(err, instance) {
                    A.isNotUndefined(instance.yui.sortedPaths['lang/PagedFlickr_en'], 'en is undefined {lang-en}');
                    A.isNotUndefined(instance.yui.sortedPaths['lang/PagedFlickr_en-US'], 'en-US is undefined {lang:en}');

                    // third test
                    ctx = { lang: 'de-US' };
                    spec = { type: 'PagedFlickr' };
                    store.expandInstance(spec, ctx, function(err, instance) {
                        A.isNotUndefined(instance.yui.sortedPaths['lang/PagedFlickr_de'], 'de is undefined {lang:de-US}');
                        A.isNotUndefined(instance.yui.sortedPaths['lang/PagedFlickr_en-US'], 'en-US is undefined {lang:de-US}');

                        // fourth test
                        ctx = { lang: 'xy-ZU' };
                        spec = { type: 'PagedFlickr' };
                        store.expandInstance(spec, ctx, function(err, instance) {
                            A.isTrue(
                                Boolean(instance.yui.sortedPaths['lang/PagedFlickr_de']),
                                 'de is undefined {lang:xy-ZU}'
                            );
                            A.isNotUndefined(instance.yui.sortedPaths['lang/PagedFlickr_en-US'], 'en-US is undefined {lang:xy-ZU}');

                            // fifth test
                            ctx = {};
                            spec = { type: 'PagedFlickr' };
                            store.expandInstance(spec, ctx, function(err, instance) {
                                A.isTrue(
                                    Boolean(instance.yui.sortedPaths['lang/PagedFlickr_de']),
                                    'de is undefined {}'
                                );
                                A.isNotUndefined(instance.yui.sortedPaths['lang/PagedFlickr_en-US'], 'en-US is undefined {}');
                            });
                        });
                    });
                });
            });
        },

        'bad files': function() {
            var fixtures = libpath.join(__dirname, '../fixtures/badfiles'),
                store = new ResourceStore(fixtures);
            store.preload();
            var spec = { type: 'M' };
            store.expandInstance(spec, {}, function(err, instance) {
                A.isUndefined(instance.yui.sortedPaths['addon-ac-not']);
                A.isUndefined(instance.yui.sortedPaths['MAutoloadNot']);
                A.isUndefined(instance.yui.sortedPaths['MModelNot']);
                A.isUndefined(instance.views['not']['binder-url']);
            });
        },

        'malformed JSON for config file': function() {
            var fixtures = libpath.join(__dirname, '../fixtures/badfiles2'),
                store = new ResourceStore(fixtures),
                logCalled = 0;
            store.setLogger({ log: function() {
                logCalled++;
            }});
            try {
                store.preload();
            }
            catch (err) {
                A.areSame('Error parsing JSON file:', err.message.substr(0, 24));
                A.areSame(1, logCalled);
                return;
            }
        },

        'JSON config file not YCB': function() {
            var fixtures = libpath.join(__dirname, '../fixtures/badfiles3'),
                store = new ResourceStore(fixtures),
                r, logCalled = 0;
            store.setLogger({ log: function(msg, lvl, who) {
                logCalled++;
            }});
            store.preload();
            r = store.getRoutes();
            A.areSame(0, logCalled);
            A.isNotUndefined(r._default_path);
        },

        'appConfig deferAllOptionalAutoloads': function() {
            var fixtures = libpath.join(__dirname, '../fixtures/gsg5-appConfig'),
                store = new ResourceStore(fixtures);
            store.preload();
            var spec = { type: 'PagedFlickr' };
            store.expandInstance(spec, {}, function(err, instance) {
                A.isUndefined(instance.views.index['binder-yui-sorted']['breg']);
                A.isUndefined(instance.views.index['binder-yui-sorted']['dali-bean']);
                A.isUndefined(instance.views.index['binder-yui-sorted']['dali-transport-base']);
                A.isUndefined(instance.views.index['binder-yui-sorted']['io-facade']);
                A.isUndefined(instance.views.index['binder-yui-sorted']['mojito-tunnel-client']);
                A.isUndefined(instance.views.index['binder-yui-sorted']['request-handler']);
                A.isUndefined(instance.views.index['binder-yui-sorted']['requestor']);
                A.isUndefined(instance.views.index['binder-yui-sorted']['response-formatter']);
                A.isUndefined(instance.views.index['binder-yui-sorted']['response-processor']);
                A.isUndefined(instance.views.index['binder-yui-sorted']['simple-request-formatter']);
            });
        },

        'appConfig staticHandling.prefix': function() {
            var fixtures = libpath.join(__dirname, '../fixtures/gsg5-appConfig'),
                store = new ResourceStore(fixtures);
            store.preload();
            var spec = { type: 'PagedFlickr' };
            store.expandInstance(spec, {}, function(err, instance) {
                A.areSame('/PagedFlickr/assets', instance.assetsRoot);
            });
        },

        'controller with selector': function() {
            var fixtures = libpath.join(__dirname, '../fixtures/gsg5'),
                store = new ResourceStore(fixtures);
            store.preload();
            var spec = { type: 'PagedFlickr' };
            var ctx = { device: 'iphone' };
            store.expandInstance(spec, ctx, function(err, instance) {
                A.areSame(libpath.join(fixtures, 'mojits/PagedFlickr/controller.common.iphone.js'), instance.controller);
            });
        },

        'binder with selector': function() {
            var fixtures = libpath.join(__dirname, '../fixtures/gsg5'),
                store = new ResourceStore(fixtures);
            store.preload();
            var spec = { type: 'PagedFlickr' };
            var ctx = { device: 'iphone' };
            store.expandInstance(spec, ctx, function(err, instance) {
                A.areSame(libpath.join(fixtures, 'mojits/PagedFlickr/views/index.iphone.mu.html'), instance.views.index['content-path']);
            });
        },

        'app with rollups': function() {
            var store = new ResourceStore(fixtures);
            store.preload();
            var spec = { type: 'rollups' };
            store.expandInstanceForEnv('client', spec, {}, function(err, instance) {
                A.areSame('/static/rollups/rollup.client.js', instance.yui.sortedPaths['rollups']);
                A.areSame('/static/rollups/rollup.client.js', instance.yui.sortedPaths['rollupsBinderIndex']);
                A.areSame('/static/rollups/rollup.client.js', instance.yui.sortedPaths['rollupsModelClient']);
            });
        },

        'TODO app with app-level rollup': function() {
            A.skip();
        },

        'appConfig yui.base': function() {
            var fixtures = libpath.join(__dirname, '../fixtures/gsg5-appConfig'),
                store = new ResourceStore(fixtures);
            store.preload();
            var spec = { type: 'PagedFlickr' };
            store.expandInstance(spec, {}, function(err, instance) {
                A.areSame('/foo/', instance.yui.sortedPaths['oop'].substr(0, 5));
                A.areSame('/foo/', instance.yui.sortedPaths['intl'].substr(0, 5));
                A.areSame('/foo/', instance.yui.sortedPaths['jsonp'].substr(0, 5));
                A.areSame('/foo/', instance.yui.sortedPaths['yql'].substr(0, 5));
                A.areSame('/foo/', instance.yui.sortedPaths['querystring-parse'].substr(0, 5));
                A.areSame('/foo/', instance.yui.sortedPaths['querystring-stringify'].substr(0, 5));
                A.areSame('/foo/', instance.yui.sortedPaths['json-stringify'].substr(0, 5));
            });
        },

        'sortedReaddirSync() sorts the result of fs.readdirSync()': function() {
            var mockfs = Mock();

            Mock.expect(mockfs, {
                method: 'readdirSync',
                args: ['dir'],
                returns: ['d', 'c', 'a', 'b']
            });

            var store = new ResourceStore(fixtures, { fs: mockfs });
            var files = store._sortedReaddirSync('dir');

            AA.itemsAreSame(['a', 'b', 'c', 'd'], files);
            Mock.verify(mockfs);
        },

        '_readYcbDimensions() uses application dimensions.json': function() {
            var store,
                mockpath = Mock(),
                joinCount = 0;

            Mock.expect(mockpath, {
                method: 'join',
                args: [Mock.Value.String, 'dimensions.json'],
                returns: 'joinedpath_app',
                callCount: 1,
                run: function(base, ignored) {
                    A.areSame(store._root, base);
                }
            });

            Mock.expect(mockpath, {
                method: 'existsSync',
                args: ['joinedpath_app'],
                returns: true
            });

            var mockstore = Mock();

            Mock.expect(mockstore, {
                method: '_readConfigJSON',
                args: ['joinedpath_app'],
                returns: []
            });

            Mock.expect(mockstore, {
                method: '_isValidYcbDimensions',
                args: [Mock.Value.Object],
                returns: true
            });

            store = new ResourceStore(fixtures, { path: mockpath });
            store._readConfigJSON = Y.bind(mockstore._readConfigJSON, mockstore);
            store._isValidYcbDimensions = Y.bind(mockstore._isValidYcbDimensions, mockstore);

            var dims = store._readYcbDimensions();
            AA.isEmpty(dims, 'Expected the empty array returned by the mocked method');

            Mock.verify(mockstore);
            Mock.verify(mockpath);
        },

        '_readYcbDimensions() falls back when application dimensions.json missing': function() {
            var store,
                mockpath = Mock(),
                joinCount = 0;

            Mock.expect(mockpath, {
                method: 'join',
                args: [Mock.Value.String, 'dimensions.json'],
                callCount: 2,
                run: function(base, ignored) {
                    ++joinCount;
                    if (joinCount === 1) {
                        //application-level dimensions
                        A.areSame(store._root, base);
                        return 'joinedpath_app';
                    } else if (joinCount === 2) {
                        //framework-level dimensions
                        A.areSame(mojitoRoot, base);
                        return 'joinedpath_fw';
                    }
                }
            });

            Mock.expect(mockpath, {
                method: 'existsSync',
                args: ['joinedpath_app'],
                returns: false
            });

            var mockstore = Mock();

            Mock.expect(mockstore, {
                method: '_readConfigJSON',
                args: ['joinedpath_fw'],
                returns: []
            });

            Mock.expect(mockstore, {
                method: '_isValidYcbDimensions',
                args: [Mock.Value.Object],
                returns: true
            });

            store = new ResourceStore(fixtures, { path: mockpath });
            store._readConfigJSON = Y.bind(mockstore._readConfigJSON, mockstore);
            store._isValidYcbDimensions = Y.bind(mockstore._isValidYcbDimensions, mockstore);

            var dims = store._readYcbDimensions();
            AA.isEmpty(dims, 'Expected the empty array returned by the mocked method');

            Mock.verify(mockstore);
            Mock.verify(mockpath);
        },

        '_readYcbDimensions() throws an error when dimensions.json is invalid': function() {
            var mockstore = Mock();

            Mock.expect(mockstore, {
                method: '_readConfigJSON',
                args: [Mock.Value.String],
                returns: [] //the invalid dimensions.json
            });

            var store = new ResourceStore(fixtures);
            store._readConfigJSON = Y.bind(mockstore._readConfigJSON, mockstore);

            try {
                store._readYcbDimensions();
                A.fail('Expected an exception');
            } catch (e) {
                A.areSame('Invalid dimensions.json: ' + libpath.join(mojitoRoot, 'dimensions.json'), e.message);
            }

            Mock.verify(mockstore);
        },

        '_isValidYcbDimensions() allows dimensions array with single key': function() {
            var dims = [{ dimensions: [{ dimKey: {} }] }];
            var store = new ResourceStore(fixtures);
            A.isTrue(store._isValidYcbDimensions(dims));
        },

        '_isValidYcbDimensions() spots empty array': function() {
            var dims = [];
            var store = new ResourceStore(fixtures);
            A.isFalse(store._isValidYcbDimensions(dims));
        },

        '_isValidYcbDimensions() spots empty dimensions': function() {
            var dims = [{ dimensions: [] }];
            var store = new ResourceStore(fixtures);
            A.isFalse(store._isValidYcbDimensions(dims));
        },

        '_isValidYcbDimensions() spots too many top-level items': function() {
            var dims = [{ dimensions: [{ dimKey: {} }] }, { extraDimensions: [] }];
            var store = new ResourceStore(fixtures);
            A.isFalse(store._isValidYcbDimensions(dims));
        },

        '_skipBadPath() does just that': function() {
            var store = new ResourceStore(fixtures);
            A.areSame(true, store._skipBadPath({ ext: '.js~' }));
            A.areSame(false, store._skipBadPath({ ext: '.js' }));
        },

        'load node_modules': function() {
            var fixtures = libpath.join(__dirname, '../fixtures/packages'),
                store = new ResourceStore(fixtures);
            store.preload();

            var m, mojits = ['a', 'aa', 'ba'];
            var mojitType, mojitMeta;
            for (m = 0; m < mojits.length; m += 1) {
                mojitType = mojits[m];
                mojitMeta = store._mojitMeta.server[mojitType];
                A.isNotUndefined(mojitMeta);
                mojitMeta = mojitMeta['*'];
                A.isNotUndefined(mojitMeta['yui-module-b']);
                A.isNotUndefined(mojitMeta['yui-module-ab']);
                A.isNotUndefined(mojitMeta['yui-module-bb']);
                A.isNotUndefined(mojitMeta['yui-module-cb']);
                // tests that yahoo.mojito.location in package.json works
                // (which mojito package itself uses)
                A.isNotUndefined(mojitMeta['addon-ac-assets']);
            }

            var details = {};
            store.getMojitTypeDetails('server', {}, 'a', details);
            A.isNotNull(details.controller.match(/a\/foo\/controller\.server\.js$/));
        },

        'find and parse resources by convention': function() {
            var fixtures = libpath.join(__dirname, '../fixtures/conventions'),
                store = new ResourceStore(fixtures);

            // fake out some parts of preload(), which we're trying to avoid
            store._fwConfig = store._readConfigJSON(libpath.join(mojitoRoot, 'config.json'));
            store._appConfigStatic = store._readAppConfigStatic();

            var dir = libpath.join(__dirname, '../fixtures/conventions');
            var pkg = { name: 'test', version: '6.6.6' };
            var mojitType = 'testing';
            var ress = store._findResourcesByConvention(dir, pkg, mojitType)

            var r, res;
            for (r = 0; r < ress.length; r++) {
                res = ress[r];
                A.isNotUndefined(res.id, 'no resource id');
                switch (res.id) {
                    case 'action-x':
                        A.areSame(pkg, res.pkg);
                        A.areSame('action', res.type);
                        A.areSame('x', res.name);
                        A.areSame('action-x', res.yuiModuleName);
                        switch (res.shortPath) {
                            case 'x.common.js':
                                A.areSame('*', res.pathParts.contextKey);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.js', res.pathParts.ext);
                                A.areSame('x', res.pathParts.shortFile);
                                break;
                            case 'x.common.iphone.js':
                                A.areSame('device=iphone', res.pathParts.contextKey);
                                A.areSame('iphone', res.pathParts.contextParts.device);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.js', res.pathParts.ext);
                                A.areSame('x', res.pathParts.shortFile);
                                break;
                            default:
                                A.fail('unknown resource ' + res.fsPath);
                                break;
                        }
                        break;
                    case 'action-y/z':
                        A.areSame(pkg, res.pkg);
                        A.areSame('action', res.type);
                        A.areSame('y/z', res.name);
                        A.areSame('y/z.common.js', res.shortPath);
                        A.areSame('action-y-z', res.yuiModuleName);
                        A.areSame('*', res.pathParts.contextKey);
                        A.areSame('common', res.pathParts.affinity.affinity);
                        A.areSame('.js', res.pathParts.ext);
                        A.areSame('z', res.pathParts.shortFile);
                        break;
                    case 'addon-a-x':
                        A.areSame(pkg, res.pkg);
                        A.areSame('addon', res.type);
                        A.areSame('a', res.addonType);
                        A.areSame('x', res.name);
                        A.areSame('addon-a-x', res.yuiModuleName);
                        switch (res.shortPath) {
                            case 'x.common.js':
                                A.areSame('*', res.pathParts.contextKey);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.js', res.pathParts.ext);
                                A.areSame('x', res.pathParts.shortFile);
                                break;
                            case 'x.common.iphone.js':
                                A.areSame('device=iphone', res.pathParts.contextKey);
                                A.areSame('iphone', res.pathParts.contextParts.device);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.js', res.pathParts.ext);
                                A.areSame('x', res.pathParts.shortFile);
                                break;
                            default:
                                A.fail('unknown resource ' + res.fsPath);
                                break;
                        }
                        break;
                    case 'archetype-x-y':
                        A.areSame(pkg, res.pkg);
                        A.areSame('archetype', res.type);
                        A.areSame('x', res.subtype);
                        A.areSame('y', res.name);
                        A.areSame('y', res.shortPath);
                        break;
                    case 'asset-x.css':
                        A.areSame(pkg, res.pkg);
                        A.areSame('asset', res.type);
                        A.areSame('css', res.assetType);
                        A.areSame('x.css', res.name);
                        switch (res.shortPath) {
                            case 'x.css':
                                A.areSame('*', res.pathParts.contextKey);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.css', res.pathParts.ext);
                                A.areSame('x', res.pathParts.shortFile);
                                break;
                            case 'x.iphone.css':
                                A.areSame('device=iphone', res.pathParts.contextKey);
                                A.areSame('iphone', res.pathParts.contextParts.device);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.css', res.pathParts.ext);
                                A.areSame('x', res.pathParts.shortFile);
                                break;
                            default:
                                A.fail('unknown resource ' + res.fsPath);
                                break;
                        }
                        break;
                    case 'asset-y/z.css':
                        A.areSame(pkg, res.pkg);
                        A.areSame('asset', res.type);
                        A.areSame('css', res.assetType);
                        A.areSame('y/z.css', res.name);
                        switch (res.shortPath) {
                            case 'y/z.css':
                                A.areSame('*', res.pathParts.contextKey);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.css', res.pathParts.ext);
                                A.areSame('z', res.pathParts.shortFile);
                                break;
                            case 'y/z.android.css':
                                A.areSame('device=android', res.pathParts.contextKey);
                                A.areSame('android', res.pathParts.contextParts.device);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.css', res.pathParts.ext);
                                A.areSame('z', res.pathParts.shortFile);
                                break;
                            default:
                                A.fail('unknown resource ' + res.fsPath);
                                break;
                        }
                        break;
                    case 'binder-x':
                        A.areSame(pkg, res.pkg);
                        A.areSame('binder', res.type);
                        A.areSame('x', res.name);
                        A.areSame('x', res.yuiModuleName);
                        switch (res.shortPath) {
                            case 'x.js':
                                A.areSame('*', res.pathParts.contextKey);
                                A.areSame('client', res.pathParts.affinity.affinity);
                                A.areSame('.js', res.pathParts.ext);
                                A.areSame('x', res.pathParts.shortFile);
                                break;
                            case 'x.iphone.js':
                                A.areSame('device=iphone', res.pathParts.contextKey);
                                A.areSame('iphone', res.pathParts.contextParts.device);
                                A.areSame('client', res.pathParts.affinity.affinity);
                                A.areSame('.js', res.pathParts.ext);
                                A.areSame('x', res.pathParts.shortFile);
                                break;
                            default:
                                A.fail('unknown resource ' + res.fsPath);
                                break;
                        }
                        break;
                    case 'command-x':
                        A.areSame(pkg, res.pkg);
                        A.areSame('command', res.type);
                        A.areSame('x', res.name);
                        A.areSame('x.js', res.shortPath);
                        break;
                    case 'config-config':
                        A.areSame(pkg, res.pkg);
                        A.areSame('config', res.type);
                        A.areSame('config', res.name);
                        A.areSame('config.json', res.shortPath);
                        break;
                    case 'controller':
                        A.areSame(pkg, res.pkg);
                        A.areSame('controller', res.type);
                        A.areSame('controller', res.name);
                        A.areSame('controller', res.yuiModuleName);
                        switch (res.shortPath) {
                            case 'controller.common.js':
                                A.areSame('*', res.pathParts.contextKey);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.js', res.pathParts.ext);
                                A.areSame('controller', res.pathParts.shortFile);
                                break;
                            case 'controller.server.iphone.js':
                                A.areSame('device=iphone', res.pathParts.contextKey);
                                A.areSame('iphone', res.pathParts.contextParts.device);
                                A.areSame('server', res.pathParts.affinity.affinity);
                                A.areSame('.js', res.pathParts.ext);
                                A.areSame('controller', res.pathParts.shortFile);
                                break;
                            default:
                                A.fail('unknown resource ' + res.fsPath);
                                break;
                        }
                        break;
                    case 'middleware-x':
                        A.areSame(pkg, res.pkg);
                        A.areSame('middleware', res.type);
                        A.areSame('x', res.name);
                        A.areSame('x.js', res.shortPath);
                        break;
                    case 'spec-default':
                        A.areSame(pkg, res.pkg);
                        A.areSame('spec', res.type);
                        A.areSame('default', res.name);
                        A.areSame('testing', res.specName);
                        A.areSame('default.json', res.shortPath);
                        break;
                    case 'spec-x':
                        A.areSame(pkg, res.pkg);
                        A.areSame('spec', res.type);
                        A.areSame('x', res.name);
                        A.areSame('testing:x', res.specName);
                        A.areSame('x.json', res.shortPath);
                        break;
                    case 'view-x':
                        A.areSame(pkg, res.pkg);
                        A.areSame('view', res.type);
                        A.areSame('x', res.name);
                        A.areSame('html', res.viewOutputFormat);
                        A.areSame('mu', res.viewEngine);
                        switch (res.shortPath) {
                            case 'x.mu.html':
                                A.areSame('*', res.pathParts.contextKey);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.html', res.pathParts.ext);
                                A.areSame('x', res.pathParts.shortFile);
                                break;
                            case 'x.iphone.mu.html':
                                A.areSame('device=iphone', res.pathParts.contextKey);
                                A.areSame('iphone', res.pathParts.contextParts.device);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.html', res.pathParts.ext);
                                A.areSame('x', res.pathParts.shortFile);
                                break;
                            default:
                                A.fail('unknown resource ' + res.fsPath);
                                break;
                        }
                        break;
                    case 'yui-lang-':
                        A.areSame(pkg, res.pkg);
                        A.areSame('yui-lang', res.type);
                        A.areSame('', res.name);
                        A.areSame('', res.langCode);
                        A.areSame('testing.js', res.shortPath);
                        A.areSame('*', res.pathParts.contextKey);
                        A.areSame('common', res.pathParts.affinity.affinity);
                        A.areSame('.js', res.pathParts.ext);
                        A.areSame('testing', res.pathParts.shortFile);
                        break;
                    case 'yui-lang-de':
                        A.areSame(pkg, res.pkg);
                        A.areSame('yui-lang', res.type);
                        A.areSame('de', res.name);
                        A.areSame('de', res.langCode);
                        A.areSame('testing_de.js', res.shortPath);
                        A.areSame('lang=de', res.pathParts.contextKey);
                        A.areSame('de', res.pathParts.contextParts.lang);
                        A.areSame('common', res.pathParts.affinity.affinity);
                        A.areSame('.js', res.pathParts.ext);
                        A.areSame('testing_de', res.pathParts.shortFile);
                        break;
                    case 'yui-lang-en':
                        A.areSame(pkg, res.pkg);
                        A.areSame('yui-lang', res.type);
                        A.areSame('en', res.name);
                        A.areSame('en', res.langCode);
                        A.areSame('testing_en.js', res.shortPath);
                        A.areSame('lang=en', res.pathParts.contextKey);
                        A.areSame('en', res.pathParts.contextParts.lang);
                        A.areSame('common', res.pathParts.affinity.affinity);
                        A.areSame('.js', res.pathParts.ext);
                        A.areSame('testing_en', res.pathParts.shortFile);
                        break;
                    case 'yui-lang-en-US':
                        A.areSame(pkg, res.pkg);
                        A.areSame('yui-lang', res.type);
                        A.areSame('en-US', res.name);
                        A.areSame('en-US', res.langCode);
                        A.areSame('testing_en-US.js', res.shortPath);
                        A.areSame('lang=en-US', res.pathParts.contextKey);
                        A.areSame('en-US', res.pathParts.contextParts.lang);
                        A.areSame('common', res.pathParts.affinity.affinity);
                        A.areSame('.js', res.pathParts.ext);
                        A.areSame('testing_en-US', res.pathParts.shortFile);
                        break;
                    case 'yui-module-m':
                        A.areSame(pkg, res.pkg);
                        A.areSame('yui-module', res.type);
                        A.areSame('m', res.name);
                        A.areSame('m', res.yuiModuleName);
                        switch (res.shortPath) {
                            case 'm.common.js':
                                A.areSame('*', res.pathParts.contextKey);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.js', res.pathParts.ext);
                                A.areSame('m', res.pathParts.shortFile);
                                break;
                            case 'm.common.iphone.js':
                                A.areSame('device=iphone', res.pathParts.contextKey);
                                A.areSame('iphone', res.pathParts.contextParts.device);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.js', res.pathParts.ext);
                                A.areSame('m', res.pathParts.shortFile);
                                break;
                            default:
                                A.fail('unknown resource ' + res.fsPath);
                                break;
                        }
                        break;
                    case 'yui-module-x':
                        A.areSame(pkg, res.pkg);
                        A.areSame('yui-module', res.type);
                        A.areSame('x', res.name);
                        A.areSame('x', res.yuiModuleName);
                        switch (res.shortPath) {
                            case 'x.common.js':
                                A.areSame('*', res.pathParts.contextKey);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.js', res.pathParts.ext);
                                A.areSame('x', res.pathParts.shortFile);
                                break;
                            case 'x.common.iphone.js':
                                A.areSame('device=iphone', res.pathParts.contextKey);
                                A.areSame('iphone', res.pathParts.contextParts.device);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.js', res.pathParts.ext);
                                A.areSame('x', res.pathParts.shortFile);
                                break;
                            default:
                                A.fail('unknown resource ' + res.fsPath);
                                break;
                        }
                        break;
                    case 'yui-module-z':
                        A.areSame(pkg, res.pkg);
                        A.areSame('yui-module', res.type);
                        A.areSame('z', res.name);
                        A.areSame('z', res.yuiModuleName);
                        switch (res.shortPath) {
                            case 'y/z.common.js':
                                A.areSame('*', res.pathParts.contextKey);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.js', res.pathParts.ext);
                                A.areSame('z', res.pathParts.shortFile);
                                break;
                            case 'y/z.common.android.js':
                                A.areSame('device=android', res.pathParts.contextKey);
                                A.areSame('android', res.pathParts.contextParts.device);
                                A.areSame('common', res.pathParts.affinity.affinity);
                                A.areSame('.js', res.pathParts.ext);
                                A.areSame('z', res.pathParts.shortFile);
                                break;
                            default:
                                A.fail('unknown resource ' + res.fsPath);
                                break;
                        }
                        break;

                    default:
                        A.fail('unknown resource ' + res.id);
                        break;
                }
            }
            A.areSame(31, ress.length, 'wrong number of resources');
        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: ['oop', 'mojito-resource-store-adapter']});
