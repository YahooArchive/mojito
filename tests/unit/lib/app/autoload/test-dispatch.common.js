/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-dispatcher', 'test', function(Y) {

    var suite = new Y.Test.Suite('mojito-dispatcher-tests'),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert;

    suite.add(new Y.Test.Case({

        'test dependencyCalculations precomputed': function() {

            var store = {
                getAppConfig: function() {
                    return { yui: { dependencyCalculations: 'precomputed' } };
                },
                expandInstance: function(instance, context, cb) {
                    cb(null, {
                        type: instance.type,
                        id: 'xyz123',
                        instanceId: 'xyz123',
                        yui: {
                            config: {},
                            langs: [],
                            requires: [],
                            sorted: [],
                            sortedPaths: {}
                        }
                    });
                }
            };

            var coreModules = [];

            var logger = {
                log: function(msg, lvl, src) {
                    // not testing this
                }
            };

            var loaderCalled = 0;
            var loader = {
                load: function(paths, cb) {
                    loaderCalled++;
                    cb();
                }
            };

            var dispatcher = Y.mojito.Dispatcher;

            var res = dispatcher.init(store, coreModules, logger, loader);
            A.areSame(dispatcher, res);

            var realCC = Y.mojito.ControllerContext;
            Y.mojito.ControllerContext = function(cfg) {};
            Y.mojito.ControllerContext.prototype.invoke = function(command, adapter) {};

            var command = {
                action: 'index',
                instance: {
                    type: 'M'
                },
                context: {
                    lang: 'klingon',
                    langs: 'klingon'
                }
            };
            var adapter = {
            };
            try {
                dispatcher.dispatch(command, adapter);
            }
            finally {
                Y.mojito.ControllerContext = realCC;
            }

            // this is about all we can get at
            A.areSame(1, loaderCalled);
        },

        'test dependencyCalculations ondemand': function() {

            var store = {
                getAppConfig: function() {
                    return { yui: { dependencyCalculations: 'ondemand' } };
                },
                expandInstance: function(instance, context, cb) {
                    cb(null, {
                        type: instance.type,
                        id: 'xyz123',
                        instanceId: 'xyz123',
                        yui: {
                            config: {},
                            langs: [],
                            requires: [],
                            sorted: [],
                            sortedPaths: {}
                        }
                    });
                }
            };

            var coreModules = [];

            var logger = {
                log: function(msg, lvl, src) {
                    // not testing this
                }
            };

            var loaderCalled = 0;
            var loader = {
                load: function(paths, cb) {
                    loaderCalled++;
                    cb();
                }
            };

            var dispatcher = Y.mojito.Dispatcher;

            var res = dispatcher.init(store, coreModules, logger, loader);
            A.areSame(dispatcher, res);

            var realCC = Y.mojito.ControllerContext;
            Y.mojito.ControllerContext = function(cfg) {};
            Y.mojito.ControllerContext.prototype.invoke = function(command, adapter) {};

            var command = {
                action: 'index',
                instance: {
                    type: 'M'
                },
                context: {
                    lang: 'klingon',
                    langs: 'klingon'
                }
            };
            var adapter = {
            };
            try {
                dispatcher.dispatch(command, adapter);
            }
            finally {
                Y.mojito.ControllerContext = realCC;
            }

            // this is about all we can get at
            A.areSame(0, loaderCalled);
        },

        'test dependencyCalculations precomputed+ondemand': function() {

            var store = {
                getAppConfig: function() {
                    return { yui: { dependencyCalculations: 'precomputed+ondemand' } };
                },
                expandInstance: function(instance, context, cb) {
                    cb(null, {
                        type: instance.type,
                        id: 'xyz123',
                        instanceId: 'xyz123',
                        yui: {
                            config: {},
                            langs: [],
                            requires: [],
                            sorted: [],
                            sortedPaths: {}
                        }
                    });
                }
            };

            var coreModules = [];

            var logger = {
                log: function(msg, lvl, src) {
                    // not testing this
                }
            };

            var loaderCalled = 0;
            var loader = {
                load: function(paths, cb) {
                    loaderCalled++;
                    cb();
                }
            };

            var dispatcher = Y.mojito.Dispatcher;

            var res = dispatcher.init(store, coreModules, logger, loader);
            A.areSame(dispatcher, res);

            var realCC = Y.mojito.ControllerContext;
            Y.mojito.ControllerContext = function(cfg) {};
            Y.mojito.ControllerContext.prototype.invoke = function(command, adapter) {};

            var command = {
                action: 'index',
                instance: {
                    type: 'M'
                },
                context: {
                    lang: 'klingon',
                    langs: 'klingon'
                }
            };
            var adapter = {
            };
            try {
                dispatcher.dispatch(command, adapter);
            }
            finally {
                Y.mojito.ControllerContext = realCC;
            }

            // this is about all we can get at
            A.areSame(0, loaderCalled);
        }

    }));

    Y.Test.Runner.add(suite);

});
