/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-resource-store-adapter', 'test', function(Y) {

    var suite = new Y.Test.Suite('mojito-resource-store-adapter-tests'),
        resourceStore,
        dummyLog = {log: function() {}},
        A = Y.Assert;

    suite.add(new Y.Test.Case({

        setUp: function () {
            resourceStore = {
                _config: { root: 'testRoot' },
                getAppConfig: function (context) {
                    return {
                        mojitsDirs: [ 'mojits' ],
                        routesFiles: [ 'routes.json' ],
                        tunnelPrefix: '/tunnel',
                        yui: { dependencyCalculations: 'precomputed' },
                        specs: {
                            tunnelProxy: { type: 'TunnelProxy' },
                            test1: { type: 'test_mojit_1' }
                        },
                        mojitDirs: [ 'soloMojit' ],
                        staticHandling: { useRollups: true },
                        testKey1: 'testVal1',
                        testKey2: 'testVal2',
                        testKey3: 'testVal3'
                    };
                },
                getSpec: function (env, id, context, callback) {
                    var specs = {
                        'test1': {
                            type: 'test_mojit_1',
                            id: 'test1',
                            config: {
                                testKey4: 'testVal4',
                                testKey5: 'testVal5',
                                testKey6: {
                                    testKey7: 'testVal7'
                                }
                            },
                            action: 'index',
                            instanceId: 'yui_3_5_1_2_8_1345575332231_57351',
                            yui: {}
                        }
                    };
                    callback(null, specs[id]);
                },
                getType: function (env, type, context, callback) {
                    var specs = {
                        'test_mojit_1': {
                            type: 'test_mojit_1',
                            id: 'test1',
                            config: {
                                testKey4: 'testVal4',
                                testKey5: 'testVal5',
                                testKey6: {
                                    testKey7: 'testVal7'
                                }
                            },
                            action: 'index',
                            instanceId: 'yui_3_5_1_2_8_1345575332231_57351',
                            yui: {}
                        }
                    };
                    callback(null, specs[type]);
                },
                serializeClientStore: function (ctx) {
                    return {};
                },
                getMojitTypeDetails: function (env, ctx, mojitType, dest) {
                    return {};
                },
                getRoutes: function (ctx) {
                    return {};
                }
            };
        },

        'pre load': function() {
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            A.areEqual(resourceStore._config.root, store.getAppPath());
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
                A.isTrue(instance.id === 'test1', 'instance id was wrong');
                A.isTrue(instance.type === 'test_mojit_1', 'instance type was wrong');
                A.isTrue(instance.config.testKey4 === 'testVal4', 'testKey4 was wrong');
            });
        },

        'server mojit config value via type': function() {
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            var instance = {type:'test_mojit_1'};
            store.expandInstance(instance, {}, function(err, instance){
                A.isTrue(instance.type === 'test_mojit_1', 'type was wrong');
                A.isTrue(instance.config.testKey4 === 'testVal4', 'testKey4 was wrong');
                A.isTrue(instance.config.testKey6.testKey7 === 'testVal7', 'testKey6 was wrong');
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

        'test getType()': function(){
            var store = Y.mojito.ResourceStoreAdapter.init('server', resourceStore, dummyLog);
            store.getType('server', 'test_mojit_1', {}, function(err, instance){
                A.isTrue(instance.type === 'test_mojit_1');
                A.isTrue(instance.config.testKey4 === 'testVal4');
                A.isTrue(instance.config.testKey6.testKey7 === 'testVal7');
            });
        }

    }));

    Y.Test.Runner.add(suite);

});
