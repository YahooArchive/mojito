/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-dispatcher-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        AA = YUITest.ArrayAssert,
        OA = YUITest.ObjectAssert;

    suite.add(new YUITest.TestCase({

        name: 'basics',

        'dependencyCalculations precomputed': function() {

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

        'dependencyCalculations ondemand': function() {

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

        'dependencyCalculations precomputed+ondemand': function() {

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

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: ['mojito-dispatcher']});
