/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-resource-store-adapter-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        path = require('path'),
        fixtures = path.join(__dirname, '../../../fixtures/store'),
        ResourceStore = require(path.join(__dirname, '../../../../store.server')),
        dummyLog = {log: function() {}},
        A = YUITest.Assert;

    suite.add(new YUITest.TestCase({

        name: 'Resource Store Adapter Tests',

        'pre load': function() {

            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            //Y.log(JSON.stringify(store,null,4));

            A.isTrue(store.getAppPath() === fixtures);
        },

        'server app config value': function() {

            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var config = store.getAppConfig(null, 'application');

            A.isTrue(config.testKey1 === 'testVal1');
        },

        'server mojit config value': function() {

            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var instance = {base:'test1'};

            store.expandInstance(instance, {}, function(err, instance){

                A.isTrue(instance.id === 'test1');
                A.isTrue(instance.type === 'test_mojit_1');
                A.isTrue(instance.config.testKey4 === 'testVal4');
            });
        },

        'server mojit config value via type': function() {

            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var instance = {type:'test_mojit_1'};

            store.expandInstance(instance, {}, function(err, instance){

                A.isTrue(instance.type === 'test_mojit_1');
                A.isTrue(instance.config.testKey4 === 'testVal4');
                A.isTrue(instance.config.testKey6.testKey7 === 'testVal7');
            });
        },

        'server mojit config value via type & overrride': function() {

            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var instance = {
                type:'test_mojit_1',
                config:{testKey4: 'other'}
            };

            store.expandInstance(instance, {}, function(err, instance){

                A.isTrue(instance.type === 'test_mojit_1');
                A.isTrue(instance.config.testKey4 === 'other');
                A.isTrue(instance.config.testKey5 === 'testVal5');
            });
        },

        'server mojit config assets': function() {

            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var instance = {type:'test_mojit_1'};

            store.expandInstance(instance, {}, function(err, instance){

                A.isTrue(instance.assets['css/main.css'] !== undefined);
                A.isTrue(instance.assets['js/main.js'] !== undefined);
            });
        },

        'server mojit config views': function() {

            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var instance = {type:'test_mojit_1'};

            store.expandInstance(instance, {}, function(err, instance){

                A.isTrue(instance.views['test_1'] !== undefined);
                A.isTrue(instance.views['test_2'] !== undefined);
            });
        },

        'server mojit config models': function() {

            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var instance = {type:'test_mojit_1'};

            store.expandInstance(instance, {}, function(err, instance){

                A.isTrue(instance.models['test_1'] !== undefined);
                A.isTrue(instance.models['test_2'] !== undefined);
            });
        },

        'server mojit config actions': function() {

            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var instance = {type:'test_mojit_1'};

            store.expandInstance(instance, {}, function(err, instance){

                A.isTrue(instance.actions.length === 2);
            });
        },

        'server mojit config appConfig': function() {

            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var command = {
                type:'test_mojit_1',
                appConfig:{
                    testKey3: 'other'
                }
            };

            store.expandInstance(command, {}, function(err, instance){

                A.isTrue(instance.appConfig.testKey2 === 'testVal2');
                A.isTrue(instance.appConfig.testKey3 === 'other');
            });
        },

        'TODO: server mojit config definition override': function() {

            A.skip(); return;

            var store = new ResourceStore(fixtures);

            store.preload();

            var command = {type:'test_mojit_1'};

            store.expandInstance(command, {}, function(err, instance){

                A.isTrue(instance.models['other_1'] === '/path/to/other_1');
            });
        },

        'server mojit instance definition override': function() {

            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var command = {
                type:'test_mojit_1',
                models: {
                    'other_2': '/path/to/other_2'
                }
            };

            store.expandInstance(command, {}, function(err, instance){

                A.isTrue(instance.models['other_2'] === '/path/to/other_2');
            });
        },

        'server mojit type name can come from package.json': function() {
            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var instance = {type:'TestMojit2'};
            store.expandInstance(instance, {}, function(err, instance){
                A.isNotUndefined(instance.controller);
                A.areSame('/static/TestMojit2/assets', instance.assetsRoot);
                A.isNotUndefined(instance.yui.config.modules.test_mojit_2);
            });
        },

        'server mojit is NOT loaded becuase of pacakge mojito version miss-match': function(){
            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            A.isTrue(typeof store._staticURLs['/static/test_mojit_4/package.json'] === 'undefined');
            A.isTrue(typeof store._staticURLs['/static/TestMojit4/package.json'] === 'undefined');
        },

        'server mojit is loaded becuase of pacakge mojito version match': function(){
            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var instance = {type:'TestMojit2'};
            store.expandInstance(instance, {}, function(err, instance){
                A.areSame('/static/TestMojit2/assets', instance.assetsRoot);
            });
        },

        'server a mojits package.json file is NOT publicly accessible': function(){
            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            A.isTrue(typeof store._staticURLs['/static/TestMojit2/package.json'] === 'undefined');
        },

        'server a mojits package.json file is publicly accessible': function(){
            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            A.isTrue(typeof store._staticURLs['/static/TestMojit3/package.json'] === 'string');
        },

        'server a mojit is NOT loaded because it has a package.json file with no mojito config': function(){
            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            A.isTrue(typeof store._staticURLs['/static/TestMojit5/package.json'] === 'undefined');
        },

        'server mojit view index.mu.html is loaded correctly': function(){
            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var instance = {type:'TestMojit3'};
            store.expandInstance(instance, {}, function(err, instance){
                A.areSame('index.mu.html', instance.views.index['content-path'].split('/').pop());
            });
        },

        'server mojit view index.iphone.mu.html is loaded correctly': function(){
            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var instance = {type:'TestMojit3'};
            store.expandInstance(instance, {device:'iphone'}, function(err, instance){
                A.areSame('index.iphone.mu.html', instance.views.index['content-path'].split('/').pop());
            });
        },

        'server mojit view index1.mu.html is loaded correctly': function(){
            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var instance = {type:'TestMojit3', action: 'index1'};
            store.expandInstance(instance, {device:'forotheriphone'}, function(err, instance){
                A.areSame('index1.forotheriphone.mu.html', instance.views.index1['content-path'].split('/').pop());
            });
        },

        'server mojit view index1.iphone.mu.html is loaded correctly': function(){
            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            var instance = {type:'TestMojit3', action: 'index1'};
            store.expandInstance(instance, {device:'otheriphone'}, function(err, instance){
                A.areSame('index1.otheriphone.mu.html', instance.views.index1['content-path'].split('/').pop());
            });
        },

        'test getSpec() from specs dir': function(){
            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            store.getSpec('server', 'TestMojit2', {}, function(err, instance){

                A.isTrue(instance.type === 'TestMojit2');
                A.isTrue(instance.config.testKey1 === 'testVal1');
            });
        },

        'test getType()': function(){
            var resourceStore = new ResourceStore(fixtures),
                store;

            resourceStore.preload();

            store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);

            store.getType('server', 'test_mojit_1', {}, function(err, instance){

                A.isTrue(instance.type === 'test_mojit_1');
                A.isTrue(instance.config.testKey4 === 'testVal4');
                A.isTrue(instance.config.testKey6.testKey7 === 'testVal7');
            });
        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: ['mojito-resource-store-adapter']});
