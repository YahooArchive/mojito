/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*global YUI, YUITest*/
/*jslint anon:true, sloppy:true, nomen:true, node:true*/

YUI.add('HTMLFrameMojit-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        AA = YUITest.ArrayAssert,
        OA = YUITest.ObjectAssert,
        controller;

    suite.add(new YUITest.TestCase({

        name: 'HTMLFrameMojit user tests',

        // setUp for every testcase
        setUp: function () {
            controller = Y.clone(Y.mojito.controllers.HTMLFrameMojit);
        },

        // tearDown for every testcase
        tearDown: function () {
            controller = null;
        },

        'test action on child mojit': function() {

            var dispatchCalled,
                executeCalled,
                ac = {
                    action: 'index',
                    config: {
                        get: function (name) {
                            return controller.config[name];
                        }
                    },
                    composite: {
                        execute: function (cfg, callback) {
                            executeCalled = {
                                cfg: cfg
                            };
                        }
                    }
                };

            // default action
            controller.init({
                child: {
                    base: "child-1"
                }
            });
            controller.index(ac);
            A.isObject(executeCalled, 'ac.composite.execute was not executed');
            A.areEqual('index', executeCalled.cfg.children.child.action, 'the default action index was not set');

            // custom action
            controller.init({
                child: {
                    base: "child-1",
                    action: "custom"
                }
            });
            controller.index(ac);
            A.isObject(executeCalled, 'ac.composite.execute was not executed');
            A.areEqual('custom', executeCalled.cfg.children.child.action, 'the custom action was not honored');

        },

        'test index()': function() {

            var dispatchCalled,
                doneCalled,
                executeCalled,
                assetsAdded,
                ac = {
                    config: {
                        get: function (name) {
                            return controller.config[name];
                        }
                    },
                    composite: {
                        execute: function (cfg, callback) {
                            executeCalled = {
                                cfg: cfg
                            };
                            callback({}, {
                                metaFromChildGoesHere: true,
                                assets: {
                                    bottom: {}
                                }
                            });
                        }
                    },
                    done: function(data, viewMeta) {
                        doneCalled = {
                            data: data,
                            viewMeta: viewMeta
                        };
                    },
                    assets: {
                        getAssets: function() {
                            return [];
                        },
                        addAssets: function(assets) {
                            assetsAdded = assets;
                        }
                    }
                };

            controller.init({
                child: {
                    base: "child-1"
                },
                deploy: false
            });

            controller.index(ac);
            A.isObject(executeCalled, 'ac.composite.execute was not called');
            A.areEqual('child-1', executeCalled.cfg.children.child.base,   'the child base config was not honored');

            A.isObject(doneCalled, 'ac.done was not called');

            A.isString(doneCalled.data.mojito_version, 'mojito_version is required');
            A.isString(doneCalled.data.title, 'title is required');

            A.isTrue(doneCalled.viewMeta.metaFromChildGoesHere, 'meta should be passed into done');
            A.areEqual('index', doneCalled.viewMeta.view.name, 'the view name should always be index');

            A.isObject(assetsAdded, 'ac.assets.addAssets was not called');
            A.isObject(doneCalled.viewMeta.assets.bottom, 'assets coming from the child should be inserted in the correct position');
        },

        'TODO: deploy flag': function() {
            A.skip();
            return;
        },

        'TODO: global assets': function() {
            A.skip();
            return;
        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.1.0', {requires: ['HTMLFrameMojit']});
