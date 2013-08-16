/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
/*jslint node: true, nomen: true*/
/*global YUI: true, YUITest: true*/
YUI().use('addon-rs-config', 'addon-rs-hotswap-yui', 'base', 'oop', 'test', function (Y) {
    'use strict';

    var suite = new YUITest.TestSuite('mojito-addon-rs-hotswap-yui-tests'),
        libfs = require('fs'),
        libpath = require('path'),
        mojitoRoot = libpath.join(__dirname, '../../../../../../lib'),
        A = YUITest.Assert,
        fixtures = libpath.join(__dirname, '../../../../../fixtures/store'),
        hotswapMojitYUIResource = libpath.join(fixtures, 'mojits/HotswapMojit/controller.server.js'),
        oldControllerContent = "YUI.add('HotswapMojit', function (Y, NAME) {'use strict'; " +
            "Y.hotswap = 'originalValue'; }, '0.1.0', {requires: []});",
        newControllerContent = "YUI.add('HotswapMojit', function (Y, NAME) {'use strict'; " +
            "Y.hotswap = 'modifiedValue'; }, '0.1.0', {requires: []});";

    function MockRS(config) {
        MockRS.superclass.constructor.apply(this, arguments);
    }
    MockRS.NAME = 'MockResourceStore';
    MockRS.ATTRS = {};
    Y.extend(MockRS, Y.Base, {

        initializer: function (cfg) {
            this._config = cfg || {};
            this.plug(Y.mojito.addons.rs.config, { appRoot: fixtures, mojitoRoot: mojitoRoot });
            this.plug(Y.mojito.addons.rs['hotswap-yui'], { appRoot: fixtures, mojitoRoot: mojitoRoot });
        },

        blendStaticContext: function (ctx) {
            return Y.mojito.util.blend(this._config.context, ctx);
        },

        parseResourceVersion: function (source, type, subtype, mojitType) {
            return {
                yui: {
                    name: 'HotswapMojit'
                }
            };
        },

        getStaticAppConfig: function () {
            return {
                resourceStore: {
                    hotswap: true
                }
            };
        },
        listAllMojits: function () {
            return ['HotswapMojit'];
        },
        getResourceVersions: function () {
            return [{
                yui: {
                    name: 'HotswapMojit'
                },
                affinity: {
                    affinity: 'server'
                },
                source: {
                    pkg: {
                        name: 'mojito'
                    }
                }
            }];
        }

    });

    function configureYUI(Y, store) {
        var modules = {
            modules: {
                HotswapMojit: {
                    fullpath: hotswapMojitYUIResource,
                    requires: []
                }
            }
        };

        Y.applyConfig(modules);

        store.runtimeYUI = Y;

        return Object.keys(modules.modules);
    }

    suite.add(new YUITest.TestCase({

        name: 'hotswap yui rs addon tests',

        tearDown: function () {
            // reset the fixture to the original content
            libfs.writeFile(hotswapMojitYUIResource, oldControllerContent);
        },

        'disk change is propagated to live YUI module': function () {
            var store = new MockRS({ root: fixtures }),
                modules = configureYUI(Y, store),
                testCase = this;

            // execute the original module
            Y.applyConfig({ useSync: true });
            Y.use.apply(Y, modules);
            Y.applyConfig({ useSync: false });

            // trigger the addon hook on this method so the file is watched
            store.parseResourceVersion({
                fs: {
                    ext: '.js',
                    fullPath: hotswapMojitYUIResource
                }
            });

            A.areEqual('originalValue', Y.hotswap);

            // modify the resource on the filesystem
            libfs.writeFile(hotswapMojitYUIResource, newControllerContent, function (err) {

                // the callback of the addon should have executed at this time
                // and set the correct value in the Y instance
                testCase.resume();
                A.areEqual('modifiedValue', Y.hotswap);
            });

            testCase.wait();
        }

    }));

    Y.Test.Runner.add(suite);
});
