/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-action-context', 'test', function (Y) {

    var suite = new Y.Test.Suite('mojito-action-context tests'),
        acStash = {},
        A = Y.Assert,
        OA = Y.ObjectAssert;

    suite.add(new Y.Test.Case({

        name: 'instantiation',

        setUp: function() {
            Y.Object.each(Y.namespace('mojito.addons').ac, function(v, k) {
                acStash[k] = v;
            });
        },

        tearDown: function() {
            Y.namespace('mojito').controller = null;
            Y.namespace('mojito').models = {};
            Y.Object.each(acStash, function(v, k) {
                Y.namespace('mojito.addons').ac[k] = v;
            });
        },

        'test flush function': function() {

            var ac;
            Y.namespace('mojito').controller = {
                index: function() {}
            };
            ac = new Y.mojito.ActionContext({
                dispatcher: 'the dispatcher',
                command: {
                    action: 'index',
                    context: 'context',
                    instance: {
                        type: 'Type',
                        config: 'instance config',
                        views: 'views',
                        yui: { sorted: [] }
                    }
                },
                models: {},
                controller: {index: function() {}},
                store: {
                    getAppConfig: function() {
                        return 'app config';
                    },
                    getRoutes: function(ctx) {
                        A.areSame('context', ctx, "wrong context for getRoutes");
                        return "routes";
                    }
                }
            });

            ac._adapter = {
                flush: function (data, meta) {
                    A.areSame(data, 'test flush data', 'improper test data');
                }
            };

            ac.flush('test flush data');
        },

        'test done function': function() {

            var ac;
            Y.namespace('mojito').controller = {
                index: function() {}
            };
            ac = new Y.mojito.ActionContext({
                dispatcher: 'the dispatcher',
                command: {
                    action: 'index',
                    context: 'context',
                    instance: {
                        type: 'Type',
                        config: 'instance config',
                        views: 'views',
                        yui: { sorted: [] }
                    }
                },
                models: {},
                controller: {index: function() {}},
                store: {
                    getAppConfig: function() {
                        return 'app config';
                    },
                    getRoutes: function(ctx) {
                        A.areSame('context', ctx, "wrong context for getRoutes");
                        return "routes";
                    }
                }
            });

            ac._adapter = {
                done: function (data, meta) {
                    A.areSame(data, 'test done data', 'improper test data');
                }
            };

            ac.done('test done data');
        },

        'test error function': function() {

            var ac;
            Y.namespace('mojito').controller = {
                index: function() {}
            };
            ac = new Y.mojito.ActionContext({
                dispatcher: 'the dispatcher',
                command: {
                    action: 'index',
                    context: 'context',
                    instance: {
                        type: 'Type',
                        config: 'instance config',
                        views: 'views',
                        yui: { sorted: [] }
                    }
                },
                models: {},
                controller: {index: function() {}},
                store: {
                    getAppConfig: function() {
                        return 'app config';
                    },
                    getRoutes: function(ctx) {
                        A.areSame('context', ctx, "wrong context for getRoutes");
                        return "routes";
                    }
                }
            });

            ac._adapter = {
                error: function (data, meta) {
                    A.areSame(data, 'test error data', 'improper test data');
                }
            };

            ac.error('test error data');
        },

        'test dispatch function': function() {

            var ac;
            Y.namespace('mojito').controller = {
                index: function() {}
            };
            ac = new Y.mojito.ActionContext({
                command: {
                    action: 'index',
                    context: 'context',
                    instance: {
                        type: 'Type',
                        config: 'instance config',
                        views: 'views',
                        yui: { sorted: [] }
                    }
                },
                models: {},
                controller: {index: function() {}},
                dispatcher: 'the dispatcher',
                adapter: { },
                store: {
                    getAppConfig: function() {
                        return 'app config';
                    },
                    getRoutes: function(ctx) {
                        A.areSame('context', ctx, "wrong context for getRoutes");
                        return "routes";
                    }
                }
            });

            A.areSame('the dispatcher', ac.dispatcher,
                "dispatcher wasn't stashed.");
        },

        'test all required (was: default) plugins are preloaded and plugged': function() {
            Y.namespace('mojito.addons.ac').custom = function() {
                return { namespace: 'custom' };
            };
            var ac = new Y.mojito.ActionContext({
                dispatcher: 'the dispatcher',
                command: {
                    action: 'index',
                    instance: {
                        id: 'id',
                        type: 'Type666',
                        yui: { sorted: [] },
                        acAddons: ['custom']
                    }
                },
                controller: {index: function() {}},
                store: {
                    getAppConfig: function() {
                    },
                    getRoutes: function() {
                    }
                }
            });

            A.isObject(ac.custom, 'custom required addon is missing');
        },

        'test AC properties': function() {
            var ac;
            Y.namespace('mojito').controller = {
                index: function() {}
            };
            ac = new Y.mojito.ActionContext({
                dispatcher: 'the dispatcher',
                command: {
                    action: 'index',
                    context: 'context',
                    instance: {
                        type: 'Type',
                        config: 'instance config',
                        views: 'views',
                        yui: { sorted: [] }
                    }
                },
                models: {},
                controller: {index: function() {}},
                store: {
                    getAppConfig: function() {
                        return 'app config';
                    },
                    getRoutes: function(ctx) {
                        A.areSame('context', ctx, "wrong context for getRoutes");
                        return "routes";
                    }
                }
            });

            A.areSame('Type', ac.type, 'bad type');
            A.areSame('index', ac.action, 'bad action');
            A.areSame('context', ac.context, 'bad context');

            A.areSame('the dispatcher', ac.dispatcher,
                "dispatcher wasn't stashed.");
        },

        'test ac plugins plugged in proper order': function() {
            var mixes = [];

            Y.namespace('mojito').controller = { index: function() {} };

            // null out all existing
            Y.Object.each(Y.namespace('mojito.addons').ac, function(v, k) {
                delete Y.namespace('mojito.addons').ac[k];
            });

            Y.namespace('mojito.addons.ac').third = function() {
                mixes.push(3);
                return { namespace: 'third' };
            };
            Y.namespace('mojito.addons.ac').second = function() {
                mixes.push(2);
                return { namespace: 'second' };
            };
            Y.namespace('mojito.addons.ac').first = function() {
                mixes.push(1);
                return { namespace: 'first' };
            };
            Y.namespace('mojito.addons.ac').fourth = function() {
                mixes.push(4);
                return { namespace: 'fourth' };
            };

            new Y.mojito.ActionContext({
                dispatch: 'the dispatch',
                command: {
                    action: 'index',
                    instance: {
                        id: 'id',
                        type: 'Type2', // Need to clear the addons cache
                        yui: { sorted: [] },
                        acAddons: [
                            'first',
                            'second',
                            'third',
                            'fourth'
                        ]
                    }
                },
                controller: {index: function() {}},
                store: {
                    getAppConfig: function() {
                    },
                    getRoutes: function() {
                    }
                }
            });

            OA.areEqual([1,2,3,4], mixes, 'wrong addon attach order, should be based on acAddons');
        }

    }));

    Y.Test.Runner.add(suite);

});
