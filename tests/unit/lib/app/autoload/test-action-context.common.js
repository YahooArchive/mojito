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
            // fake out the http plugin so the others will load
            Y.namespace('mojito.addons.ac').http = function() {
                this.namespace = 'http';
                this.getRequest = function() {};
            };
            // fake out the url plugin so it won't try to load routes
            Y.namespace('mojito.addons.ac').url = function() {
                this.namespace = 'url';
            };
            // fake out the intl plugin so the others will load
            Y.namespace('mojito.addons.ac').intl = function() {
                this.namespace = 'intl';
            };
            ac = new Y.mojito.ActionContext({
                dispatch: 'the dispatch',
                command: {
                    action: 'index',
                    context: 'context',
                    instance: {
                        type: 'Type',
                        config: 'instance config',
                        views: 'views'
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
            // fake out the http plugin so the others will load
            Y.namespace('mojito.addons.ac').http = function() {
                this.namespace = 'http';
                this.getRequest = function() {};
            };
            // fake out the url plugin so it won't try to load routes
            Y.namespace('mojito.addons.ac').url = function() {
                this.namespace = 'url';
            };
            // fake out the intl plugin so the others will load
            Y.namespace('mojito.addons.ac').intl = function() {
                this.namespace = 'intl';
            };
            ac = new Y.mojito.ActionContext({
                dispatch: 'the dispatch',
                command: {
                    action: 'index',
                    context: 'context',
                    instance: {
                        type: 'Type',
                        config: 'instance config',
                        views: 'views'
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
            // fake out the http plugin so the others will load
            Y.namespace('mojito.addons.ac').http = function() {
                this.namespace = 'http';
                this.getRequest = function() {};
            };
            // fake out the url plugin so it won't try to load routes
            Y.namespace('mojito.addons.ac').url = function() {
                this.namespace = 'url';
            };
            // fake out the intl plugin so the others will load
            Y.namespace('mojito.addons.ac').intl = function() {
                this.namespace = 'intl';
            };
            ac = new Y.mojito.ActionContext({
                dispatch: 'the dispatch',
                command: {
                    action: 'index',
                    context: 'context',
                    instance: {
                        type: 'Type',
                        config: 'instance config',
                        views: 'views'
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
            // fake out the http plugin so the others will load
            Y.namespace('mojito.addons.ac').http = function() {
                this.namespace = 'http';
                this.getRequest = function() {};
            };
            // fake out the url plugin so it won't try to load routes
            Y.namespace('mojito.addons.ac').url = function() {
                this.namespace = 'url';
            };
            // fake out the intl plugin so the others will load
            Y.namespace('mojito.addons.ac').intl = function() {
                this.namespace = 'intl';
            };
            ac = new Y.mojito.ActionContext({
                dispatch: 'the dispatch',
                command: {
                    action: 'index',
                    context: 'context',
                    instance: {
                        type: 'Type',
                        config: 'instance config',
                        views: 'views'
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

            A.areSame('the dispatch', ac._dispatch, "dispatch function wasn't stashed.");
        },

        'test all default plugins are preloaded and plugged': function() {
            Y.namespace('mojito').controller = { index: function() {} };
            Y.namespace('mojito.addons').ac = {
                core: function () {},
                http: function () {},
                intl: function () {},
                config: function () {},
                url: function () {},
                cookie: function () {},
                params: function () {},
                composite: function () {},
                assets: function () {}
            };
            Y.Object.each(Y.namespace('mojito.addons').ac, function (addon, namespace) {
                addon.prototype.namespace = namespace;
            });
            var ac = new Y.mojito.ActionContext({
                dispatch: 'the dispatch',
                command: {
                    action: 'index',
                    instance: {
                        id: 'id',
                        type: 'Type42'
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

            A.isObject(ac.config, 'Missing config addon');
            A.isObject(ac.url, 'Missing url addon');
            A.isObject(ac.cookie, 'Missing cookie addon');
            A.isObject(ac.params, 'Missing config params');
            A.isObject(ac.composite, 'Missing config composite');

        },

        'test AC properties': function() {
            var ac;
            Y.namespace('mojito').controller = {
                index: function() {}
            };
            // fake out the http plugin so the others will load
            Y.namespace('mojito.addons.ac').http = function() {
                this.namespace = 'http';
                this.getRequest = function() {};
            };
            // fake out the url plugin so it won't try to load routes
            Y.namespace('mojito.addons.ac').url = function() {
                this.namespace = 'url';
            };
            // fake out the intl plugin so the others will load
            Y.namespace('mojito.addons.ac').intl = function() {
                this.namespace = 'intl';
            };
            ac = new Y.mojito.ActionContext({
                dispatch: 'the dispatch',
                command: {
                    action: 'index',
                    context: 'context',
                    instance: {
                        type: 'Type',
                        config: 'instance config',
                        views: 'views'
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

            OA.areEqual({config: 'app config', routes: 'routes'}, ac.app, 'bad app property');
            A.areSame(ac.app.config, 'app config', 'bad app config');
            A.areSame('the dispatch', ac._dispatch, "dispatch function wasn't stashed.");
            A.isObject(ac.models, 'bad models');

        },

        // TODO: move to controller context tests
//        'controller is initialized': function() {
//            var controllerInit = false;
//            var controller = {
//                init: function(cfg) {
//                    controllerInit = true;
//                    A.areSame('instance config', cfg, 'controller init bad config object');
//                },
//                index: function() {}
//            };
//            // fake out the http plugin so the others will load
//            Y.mojito.addons.ac.http = function() {
//                this.namespace = 'http';
//                this.getRequest = function() {};
//            };
//            var ac = new Y.mojito.ActionContext({
//                dispatch: 'the dispatch',
//                command: {
//                    instance: {
//                        id: 'id',
//                        type: 'Type',
//                        action: 'index',
//                        config: 'instance config'
//                    }
//                },
//                controller: controller,
//                store: {
//                    getAppConfig: function() {
//                    },
//                    getRoutes: function() {
//                    }
//                }
//            });
//
//            A.isTrue(controllerInit, 'controller not initalized');
//        },

        // TODO: move to controller context tests
//        'models are initialized': function() {
//            var fooModelInit = false;
//            var barModelInit = false;
//            Y.mojito.controller = {
//                index: function() {}
//            };
//            Y.mojito.models.foo = {
//                init: function(cfg) {
//                    fooModelInit = true;
//                    A.areSame('instance config', cfg, 'model init bad config object');
//                }
//            };
//            Y.mojito.models.bar = {
//                init: function(cfg) {
//                    barModelInit = true;
//                    A.areSame('instance config', cfg, 'model init bad config object');
//                }
//            };
//            // fake out the http plugin so the others will load
//            Y.mojito.addons.ac.http = function() {
//                this.namespace = 'http';
//                this.getRequest = function() {};
//            };
//            var ac = new Y.mojito.ActionContext({
//                dispatch: 'the dispatch',
//                command: {
//                    instance: {
//                        id: 'id',
//                        type: 'Type',
//                        action: 'index',
//                        config: 'instance config'
//                    }
//                },
//                controller: {index: function() {}},
//                store: {
//                    getAppConfig: function() {
//                    },
//                    getRoutes: function() {
//                    }
//                }
//            });
//
//            A.isTrue(fooModelInit, 'controller not initalized');
//            A.isTrue(barModelInit, 'controller not initalized');
//
//        },

        // TODO: move to controller context tests
//        'actions are mixed into controller': function() {
//            var actionCalled = false;
//            var controller = {
//                index: function() {}
//            };
//            Y.mojito.actions = {
//                foo: function(ac) {
//                    actionCalled = true;
//                    A.areSame(Y.mojito.controller, this, 'action not executed within the scope of the controller');
//                }
//            };
//            // fake out the http plugin so the others will load
//            Y.mojito.addons.ac.http = function() {
//                this.namespace = 'http';
//                this.getRequest = function() {};
//            };
//            var ac = new Y.mojito.ActionContext({
//                dispatch: 'the dispatch',
//                command: {
//                    instance: {
//                        id: 'id',
//                        type: 'Type',
//                        action: 'foo',
//                        config: 'instance config'
//                    }
//                },
//                controller: controller,
//                store: {
//                    getAppConfig: function() {
//                    },
//                    getRoutes: function() {
//                    }
//                }
//            });
//
//            A.isTrue(actionCalled, 'action never called');
//
//        },

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
            Y.namespace('mojito.addons.ac').first.dependsOn = ['second'];
            Y.namespace('mojito.addons.ac').second.dependsOn = ['third'];
            Y.namespace('mojito.addons.ac').third.dependsOn = ['fourth'];

            new Y.mojito.ActionContext({
                dispatch: 'the dispatch',
                command: {
                    action: 'index',
                    instance: {
                        id: 'id',
                        type: 'Type2' // Need to clear the addons cache
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

            OA.areEqual([4,3,2,1], mixes, 'wrong addon load order');

        }

    }));

    Y.Test.Runner.add(suite);

});
