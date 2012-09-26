/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-dispatcher-tests', function(Y, NAME) {

    var suite = new Y.Test.Suite(NAME),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,
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

    suite.add(new Y.Test.Case({

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

        'test dependencyCalculations precomputed': function() {

            store.getAppConfig = function() {
                return { yui: { dependencyCalculations: 'precomputed' } };
            };

            var res = dispatcher.init(store, coreModules, logger, loader);
            A.areSame(res, dispatcher);
            A.areSame(true, res.usePrecomputed);
            A.areSame(false, res.useOnDemand);
        },

        'test dependencyCalculations ondemand': function() {

            store.getAppConfig = function() {
                return { yui: { dependencyCalculations: 'ondemand' } };
            };

            var res = dispatcher.init(store, coreModules, logger, loader);
            A.areSame(res, dispatcher);
            A.areSame(false, res.usePrecomputed);
            A.areSame(true, res.useOnDemand);
        },

        'test dependencyCalculations precomputed+ondemand': function() {

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
    
    suite.add(new Y.Test.Case({

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

        'test store cached': function() {

            var res = dispatcher.init(store, coreModules, logger, loader);
            A.areSame(res, dispatcher);
            A.areSame(res.store, store);
        },

        'test modules used for ondemand': function() {

            var modules = ['foo'];
            var res = dispatcher.init(store, modules, logger, loader);
            A.areSame(res, dispatcher);
            A.areNotSame(res.coreYuiModules, modules);
            // when 'ondemand' is true the loader should be included.
            modules.push('loader');
            AA.itemsAreSame(res.coreYuiModules, modules);
        },

        'test modules used for precomputed': function() {

            store.getAppConfig = function() {
                return { yui: { dependencyCalculations: 'precomputed' } };
            };

            var modules = ['foo'];
            var res = dispatcher.init(store, modules, logger, loader);
            A.areSame(res, dispatcher);
            A.areNotSame(res.coreYuiModules, modules);
            AA.itemsAreSame(res.coreYuiModules, modules);
        },

        'test creates YUI instance cache': function() {

            var res = dispatcher.init(store, coreModules, logger, loader);
            A.areSame(res, dispatcher);
            A.isNotUndefined(res.CACHE);
            A.isNotUndefined(res.CACHE.YUI);
        }

    }));
 
    suite.add(new Y.Test.Case({

        name: 'dispatch',

        'setUp': function() {
            store = {
                getAppConfig: function() {
                    return { yui: { dependencyCalculations: 'ondemand' } };
                },
                getRoutes: function() {
                },
                validateContext: function() {
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

        'test dispatch uses supplied getter': function() {

            var getterInvoked = false,
                res;

            Y.namespace('mojito').ActionContext = function(opts) {
                return this;
            }

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
                            config: {
                                modules: ['mojito', 'mojito-action-context',
                                    'mojito-perf']
                            },
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

        'test dispatch uses supplied action': function() {

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
                            config: {
                                modules: ['mojito', 'mojito-action-context',
                                    'mojito-perf']
                            },
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
 

    Y.Test.Runner.add(suite);

}, '0.0.1', {requires: ['mojito-dispatcher']});
