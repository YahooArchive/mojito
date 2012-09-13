/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-resource-store-adapter-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        path = require('path'),
        fixtures = path.join(__dirname, '../../../fixtures/store'),
        resourceStore,
        dummyLog = {log: function() {}},
        A = YUITest.Assert;

    suite.add(new YUITest.TestCase({

        name: 'Resource Store Adapter Tests',

        init: function() {
            resourceStore = new Y.mojito.ResourceStore({ root: fixtures });
            resourceStore.preload();
        },

        'pre load': function() {
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            A.isTrue(store.getAppPath() === fixtures);
        },

        'server app config value': function() {
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            var config = store.getAppConfig(null);
            A.isTrue(config.testKey1 === 'testVal1');
        },

        'server mojit config value': function() {
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            var instance = {base:'test1'};
            store.expandInstance(instance, {}, function(err, instance){
                A.isTrue(instance.id === 'test1');
                A.isTrue(instance.type === 'test_mojit_1');
                A.isTrue(instance.config.testKey4 === 'testVal4');
            });
        },

        'server mojit config value via type': function() {
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            var instance = {type:'test_mojit_1'};
            store.expandInstance(instance, {}, function(err, instance){
                A.isTrue(instance.type === 'test_mojit_1');
                A.isTrue(instance.config.testKey4 === 'testVal4');
                A.isTrue(instance.config.testKey6.testKey7 === 'testVal7');
            });
        },

        'server mojit config value via type & overrride': function() {
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
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
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            var instance = {type:'test_mojit_1'};
            store.expandInstance(instance, {}, function(err, instance){
                A.isTrue(instance.assets['css/main.css'] !== undefined);
                A.isTrue(instance.assets['js/main.js'] !== undefined);
            });
        },

        'server mojit config views': function() {
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            var instance = {type:'test_mojit_1'};
            store.expandInstance(instance, {}, function(err, instance){
                A.isTrue(instance.views['test_1'] !== undefined);
                A.isTrue(instance.views['test_2'] !== undefined);
            });
        },

        'server mojit config models': function() {
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            var instance = {type:'test_mojit_1'};
            store.expandInstance(instance, {}, function(err, instance){
                A.isTrue(instance.models['test_1'] !== undefined);
                A.isTrue(instance.models['test_2'] !== undefined);
            });
        },

        'server mojit config actions': function() {
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            var instance = {type:'test_mojit_1'};
            store.expandInstance(instance, {}, function(err, instance){
                A.isNotUndefined(instance.yui.config.modules['test_mojit_1_actions_test_1']);
                A.isNotUndefined(instance.yui.config.modules['test_mojit_1_actions_test_2']);
            });
        },

        'server mojit config appConfig': function() {
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            var command = {
                type:'test_mojit_1',
                appConfig:{
                    testKey3: 'other'
                }
            };
            store.expandInstance(command, {}, function(err, instance) {
                A.areSame('testVal2', instance.appConfig.testKey2);
                A.areSame('other', instance.appConfig.testKey3);
            });
        },

        'TODO: server mojit config definition override': function() {
            A.skip(); return;

            var store = new Y.mojito.ResourceStore({ root: fixtures });
            store.preload();

            var command = {type:'test_mojit_1'};
            store.expandInstance(command, {}, function(err, instance){
                A.isTrue(instance.models['other_1'] === '/path/to/other_1');
            });
        },

        'server mojit instance definition override': function() {
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
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
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            var instance = {type:'TestMojit2'};
            store.expandInstance(instance, {}, function(err, instance){
                A.isNotUndefined(instance['controller-path']);
                A.areSame('/static/TestMojit2/assets', instance.assetsRoot);
                A.isNotUndefined(instance.yui.config.modules.test_mojit_2);
            });
        },

        'server mojit view index.hb.html is loaded correctly': function(){
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            var instance = {type:'TestMojit3'};
            store.expandInstance(instance, {}, function(err, instance){
                A.areSame('index.hb.html', instance.views.index['content-path'].split('/').pop());
            });
        },

        'server mojit view index.iphone.hb.html is loaded correctly': function(){
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            var instance = {type:'TestMojit3'};
            store.expandInstance(instance, {device:'iphone'}, function(err, instance){
                A.areSame('index.iphone.hb.html', instance.views.index['content-path'].split('/').pop());
            });
        },

        'test getSpec() from specs dir': function(){
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            store.getSpec('server', 'TestMojit2', {}, function(err, instance){
                A.isTrue(instance.type === 'TestMojit2');
                A.isTrue(instance.config.testKey1 === 'testVal1');
            });
        },

        'test getType()': function(){
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            store.getType('server', 'test_mojit_1', {}, function(err, instance){
                A.isTrue(instance.type === 'test_mojit_1');
                A.isTrue(instance.config.testKey4 === 'testVal4');
                A.isTrue(instance.config.testKey6.testKey7 === 'testVal7');
            });
        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: [
    'mojito-resource-store',
    'mojito-resource-store-adapter'
]});
