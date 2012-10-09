/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-dispatcher-tests', function(Y, NAME) {

    var suite = new Y.Test.Suite(NAME),
        A = Y.Assert,
        dispatcher = Y.mojito.Dispatcher,
        store,
        command,
        adapter;
    
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

            var originalActionContext = Y.namespace('mojito').ActionContext;

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
                                modules: ['mojito', 'mojito-action-context']
                            },
                            langs: [],
                            requires: [],
                            sorted: ['mojito', 'mojito-action-context'],
                            sortedPaths: {}
                        }
                    });
                };

            Y.namespace('mojito').ActionContext = originalActionContext;

            res = dispatcher.init(store);
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
                                modules: ['mojito', 'mojito-action-context']
                            },
                            langs: [],
                            requires: [],
                            sorted: ['mojito', 'mojito-action-context'],
                            sortedPaths: {}
                        }
                    });
                };

            res = dispatcher.init(store);
            A.areSame(res, dispatcher);

            res.dispatch(command, adapter);
            A.isTrue(actionInvoked);
        }

    }));
 

    Y.Test.Runner.add(suite);

}, '0.0.1', {requires: ['mojito-dispatcher']});
