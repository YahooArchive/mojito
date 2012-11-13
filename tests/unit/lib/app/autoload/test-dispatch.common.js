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
                getStaticContext: function () {
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

        'test rpc with tunnel': function () {
            var tunnel,
                errorTriggered,
                tunnelCommand;

            tunnel = {
                rpc: function (c, a) {
                    tunnelCommand = c;
                }
            };
            errorTriggered = false;
            dispatcher.init(store, tunnel);
            dispatcher.rpc(command, {
                error: function () {
                    errorTriggered = true;
                }
            });
            A.isFalse(errorTriggered, 'if tunnel is set, it should not call adapter.error');
            A.areSame(command, tunnelCommand, 'delegate command to tunnel');
        },

        'test rpc without tunnel available': function () {
            var tunnel,
                errorTriggered,
                tunnelCommand;

            tunnel = null;
            errorTriggered = false;
            dispatcher.init(store, tunnel);
            dispatcher.rpc(command, {
                error: function () {
                    errorTriggered = true;
                }
            });
            A.isTrue(errorTriggered, 'if tunnel is not set, it should call adapter.error');
        },

        'test dispatch with command.rpc=1': function () {
            var tunnel,
                errorTriggered,
                tunnelCommand;

            tunnel = {
                rpc: function (c, a) {
                    tunnelCommand = c;
                }
            };
            command.rpc = 1;
            errorTriggered = false;
            dispatcher.init(store, tunnel);
            dispatcher.rpc(command, {
                error: function () {
                    errorTriggered = true;
                }
            });
            A.isFalse(errorTriggered, 'tunnel should be called');
            A.areSame(command, tunnelCommand, 'delegate command to tunnel');
        },

        'test dispatch with invalid mojit': function () {
            var tunnel,
                errorTriggered,
                tunnelCommand;

            tunnel = {
                rpc: function (c, a) {
                    tunnelCommand = c;
                }
            };
            errorTriggered = false;
            dispatcher.init(store, tunnel);
            // if the expandInstance calls with an error, the tunnel
            // should be tried.
            store.expandInstance = function (instance, context, callback) {
                callback({error: 1});
            };
            dispatcher.dispatch(command, {
                error: function () {
                    errorTriggered = true;
                }
            });
            A.isFalse(errorTriggered, 'tunnel should be called');
            A.areSame(command, tunnelCommand, 'delegate command to tunnel');
        },

        'test dispatch with valid controller': function () {
            var tunnel,
                errorTriggered,
                useCommand,
                acCommand,
                _createActionContext = dispatcher._createActionContext,
                _useController = dispatcher._useController;

            errorTriggered = false;
            dispatcher.init(store, tunnel);
            // if the expandInstance calls with an error, the tunnel
            // should be tried.
            store.expandInstance = function (instance, context, callback) {
                instance.controller = 'foo';
                Y.mojito.controllers[instance.controller] = {};
                callback(null, instance);
            };
            dispatcher._useController = function (c) {
                useCommand = c;
            };
            dispatcher._createActionContext = function (c) {
                acCommand = c;
            };
            dispatcher.dispatch(command, {
                error: function () {
                    errorTriggered = true;
                }
            });
            A.isFalse(errorTriggered, '_createActionContext should be called');
            A.areSame(command, acCommand, 'AC should be created based on the original command');

            // restoring references
            dispatcher._createActionContext = _createActionContext;
        },

        'test dispatch with invalid controller': function () {
            var tunnel,
                errorTriggered,
                useCommand,
                acCommand,
                _createActionContext = dispatcher._createActionContext,
                _useController = dispatcher._useController;

            errorTriggered = false;
            dispatcher.init(store, tunnel);
            // if the expandInstance calls with an error, the tunnel
            // should be tried.
            store.expandInstance = function (instance, context, callback) {
                instance.controller = 'foo';
                Y.mojito.controllers[instance.controller] = null;
                callback(null, instance);
            };
            dispatcher._useController = function (c) {
                useCommand = c;
            };
            dispatcher._createActionContext = function (c) {
                acCommand = c;
            };
            dispatcher.dispatch(command, {
                error: function () {
                    errorTriggered = true;
                }
            });
            A.isFalse(errorTriggered, '_useController should be called');
            A.areSame(command, useCommand, '_useController should be called based on the original command');

            // restoring references
            dispatcher._createActionContext = _createActionContext;
            dispatcher._useController = _useController;
        }

    }));


    Y.Test.Runner.add(suite);

}, '0.0.1', {requires: ['mojito-dispatcher']});
