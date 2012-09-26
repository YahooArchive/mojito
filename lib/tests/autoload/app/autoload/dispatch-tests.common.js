/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-dispatcher-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        AA = YUITest.ArrayAssert,
        OA = YUITest.ObjectAssert,
        logger = {
            log: function() {
                // Not testing this.
            }
        },
        loader = {
            load: function() {
                // Not testing this.
            }
        },
        dispatcher = Y.mojito.Dispatcher,
        coreModules = [],
        store,
        command,
        adapter;

    suite.add(new YUITest.TestCase({

        name: 'dependencyCalcs',

        'setUp': function() {
            store = {
                getAppConfig: function() {
                    return { yui: { dependencyCalculations: 'ondemand' } };
                },
                getRoutes: function() {
                },
                expandInstance: function(instance, context, cb) {
                    cb(null, {
                        type: instance.type,
                        id: 'xyz123',
                        instanceId: 'xyz123',
                        'controller-module': 'dispatch',
                        getController: function() {
                            return { index: function() {} }
                        },
                        yui: {
                            config: {},
                            langs: [],
                            requires: [],
                            sorted: ['mojito', 'mojito-action-context'],
                            sortedPaths: {}
                        }
                    });
                }
            };
        },

        'tearDown': function() {
            store = null;
        },

        'dependencyCalculations precomputed': function() {

            store.getAppConfig = function() {
                return { yui: { dependencyCalculations: 'precomputed' } };
            };

            var res = dispatcher.init(store, coreModules, logger, loader);
            A.areSame(res, dispatcher);
            A.areSame(true, res.usePrecomputed);
            A.areSame(false, res.useOnDemand);
        },

        'dependencyCalculations ondemand': function() {

            store.getAppConfig = function() {
                return { yui: { dependencyCalculations: 'ondemand' } };
            };

            var res = dispatcher.init(store, coreModules, logger, loader);
            A.areSame(res, dispatcher);
            A.areSame(false, res.usePrecomputed);
            A.areSame(true, res.useOnDemand);
        },

        'dependencyCalculations precomputed+ondemand': function() {

            store.getAppConfig = function() {
                return { yui: 
                    { dependencyCalculations: 'precomputed+ondemand' } };
            };

            var res = dispatcher.init(store, coreModules, logger, loader);
            A.areSame(res, dispatcher);
            A.areSame(true, res.usePrecomputed);
            A.areSame(true, res.useOnDemand);
        }

    }));
    
    suite.add(new YUITest.TestCase({

        name: 'init',

        'setUp': function() {
            store = {
                getAppConfig: function() {
                    return { yui: { dependencyCalculations: 'ondemand' } };
                },
                getRoutes: function() {
                },
                expandInstance: function(instance, context, cb) {
                    cb(null, {
                        type: instance.type,
                        id: 'xyz123',
                        instanceId: 'xyz123',
                        'controller-module': 'dispatch',
                        getController: function() {
                            return { index: function() {} }
                        },
                        yui: {
                            config: {},
                            langs: [],
                            requires: [],
                            sorted: ['mojito', 'mojito-action-context'],
                            sortedPaths: {}
                        }
                    });
                }
            };
        },

        'tearDown': function() {
            store = null;
        },

        'store cached': function() {

            var res = dispatcher.init(store, coreModules, logger, loader);
            A.areSame(res, dispatcher);
            A.areSame(res.store, store);
        },

        'modules used for ondemand': function() {

            var modules = ['foo'];
            var res = dispatcher.init(store, modules, logger, loader);
            A.areSame(res, dispatcher);
            A.areNotSame(res.coreYuiModules, modules);
            // when 'ondemand' is true the loader should be included.
            modules.push('loader');
            AA.itemsAreSame(res.coreYuiModules, modules);
        },

        'modules used for precomputed': function() {

            store.getAppConfig = function() {
                return { yui: { dependencyCalculations: 'precomputed' } };
            };

            var modules = ['foo'];
            var res = dispatcher.init(store, modules, logger, loader);
            A.areSame(res, dispatcher);
            A.areNotSame(res.coreYuiModules, modules);
            AA.itemsAreSame(res.coreYuiModules, modules);
        },

        'creates YUI instance cache': function() {

            var res = dispatcher.init(store, coreModules, logger, loader);
            A.areSame(res, dispatcher);
            A.isNotUndefined(res.CACHE);
            A.isNotUndefined(res.CACHE.YUI);
        }

    }));
 
    suite.add(new YUITest.TestCase({

        name: 'dispatch',

        'setUp': function() {
            store = {
                getAppConfig: function() {
                    return { yui: { dependencyCalculations: 'ondemand' } };
                },
                getRoutes: function() {
                },
                expandInstance: function(instance, context, cb) {
                    cb(null, {
                        type: instance.type,
                        id: 'xyz123',
                        instanceId: 'xyz123',
                        'controller-module': 'dispatch',
                        getController: function() {
                            return { index: function() {} }
                        },
                        yui: {
                            config: {},
                            langs: [],
                            requires: [],
                            sorted: ['mojito', 'mojito-action-context'],
                            sortedPaths: {}
                        }
                    });
                }
            };

            command = {
                action: 'index',
                instance: {
                    type: 'M'
                },
               context: {
                    lang: 'klingon',
                    langs: 'klingon'
                }
            };

            adapter = {};
        },

        'tearDown': function() {
            store = null;
            command = null;
            adapter = null;
        },

        'dispatch uses supplied getter': function() {

            var getterInvoked = false,
                res;

            store.expandInstance = function(instance, context, cb) {
                    cb(null, {
                        type: instance.type,
                        id: 'xyz123',
                        instanceId: 'xyz123',
                        'controller-module': 'dispatch',
                        getController: function() {
                            getterInvoked = true;
                            return { index: function() {} }
                        },
                        yui: {
                            config: {},
                            langs: [],
                            requires: [],
                            sorted: ['mojito', 'mojito-action-context'],
                            sortedPaths: {}
                        }
                    });
                };

            res = dispatcher.init(store, coreModules, logger, loader);
            A.areSame(res, dispatcher);

            res.dispatch(command, adapter);
            A.isTrue(getterInvoked);
        },

        'dispatch uses supplied action': function() {

            var actionInvoked = false,
                res;

            store.expandInstance = function(instance, context, cb) {
                    cb(null, {
                        type: instance.type,
                        id: 'xyz123',
                        instanceId: 'xyz123',
                        'controller-module': 'dispatch',
                        getController: function() {
                            return { index: function() {
                                actionInvoked = true;
                            } }
                        },
                        yui: {
                            config: {},
                            langs: [],
                            requires: [],
                            sorted: ['mojito', 'mojito-action-context'],
                            sortedPaths: {}
                        }
                    });
                };

            res = dispatcher.init(store, coreModules, logger, loader);
            A.areSame(res, dispatcher);

            res.dispatch(command, adapter);
            A.isTrue(actionInvoked);
        }

    }));
 

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: ['mojito-dispatcher']});
