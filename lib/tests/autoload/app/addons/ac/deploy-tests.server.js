/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-deploy-addon-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        addon,
        A = YUITest.Assert,
        AA = YUITest.ArrayAssert,
        OA = YUITest.ObjectAssert;

    suite.add(new YUITest.TestCase({

        name: 'basics',

        setUp: function() {
            addon = new Y.mojito.addons.ac.deploy({instance: {}});
        },

        tearDown: function() {
            addon = null;
        },


        'YUI_config uses application.json yui.config': function() {

            var realRouteMaker = Y.mojito.RouteMaker;
            Y.mojito.RouteMaker = function() {};
            Y.mojito.RouteMaker.prototype = {
                getComputedRoutes: function() {
                    return ['routes'];
                }
            };

            addon.ac = {
                http: {
                    getHeader: function(h) {
                        return null;
                    }
                }
            };
            addon.ac.context = {
                lang: 'klingon'
            };
            addon.setStore({
                getAppConfig: function() {
                    return { yui:{ config:{ foo:'bar' } } };
                },
                serializeClientStore: function() {
                    return 'clientstore';
                },
                store: {
                    getAllURLs: function() { return {}; },
                    getFrameworkConfig: function() {
                        return { ondemandBaseYuiModules:[] };
                    },
                    yui: {
                        getConfigShared: function() { return {}; }
                    }
                }
            });

            var blobs = [];
            var assetHandler = {
                    addCss: function(path, location) {
                        // not testing this
                        return;
                    },
                    addAssets: function(type, location, content) {
                        // not testing this
                        return;
                    },
                    addAsset: function(type, location, content) {
                        if ('blob' === type) {
                            blobs.push(content);
                        }
                    }
                };
            var binderMap = {};

            try {
                addon.constructMojitoClientRuntime(assetHandler, binderMap);
            }
            finally {
                Y.mojito.RouteMaker = realRouteMaker;
            }

            A.areSame(1, blobs.length, 'wrong number of blobs');
            var matches = blobs[0].match(/YUI_config = ({[^}]+})/);
            A.isNotUndefined(matches[1], 'failed to find YUI_config in blob');
            var config = Y.JSON.parse(matches[1]);
            A.isObject(config, 'failed to parse YUI_config');
            A.areSame('bar', config.foo, 'failed to base YUI_config on application.yui.config');
            A.areSame('klingon', config.lang, 'wrong lang used');
        },


        'honor context.lang as YUI_config.lang when application.json yui.config is undefined': function() {

            var realLoader = Y.mojito.Loader,
                finalLoaderConfig;
            Y.mojito.Loader = function (config) {
                finalLoaderConfig = config;
            };
            Y.mojito.Loader.prototype = {
                createYuiLibComboUrl: function(yuiModules, yuiFilter) {
                    return {
                        'css': [],
                        'js':  []
                    };
                }
            };

            var realRouteMaker = Y.mojito.RouteMaker;
            Y.mojito.RouteMaker = function() {};
            Y.mojito.RouteMaker.prototype = {
                getComputedRoutes: function() {
                    return ['routes'];
                }
            };

            addon.ac = {
                http: {
                    getHeader: function(h) {
                        return null;
                    }
                }
            };
            addon.ac.context = {
                lang: 'es'
            };
            addon.setStore({
                getAppConfig: function() {
                    return {};
                },
                serializeClientStore: function() {
                    return 'clientstore';
                },
                store: {
                    getAllURLs: function() { return {}; },
                    getFrameworkConfig: function() {
                        return { ondemandBaseYuiModules:[] };
                    },
                    yui: {
                        getConfigShared: function() { return {}; }
                    }
                }
            });

            var counts = {};
            var assetHandler = {
                    addCss: function(path, location) {
                    },
                    addAssets: function(args) {
                    },
                    addAsset: function(type, location, content) {
                    }
                };
            var binderMap = {};

            try {
                addon.constructMojitoClientRuntime(assetHandler, binderMap);
            }
            finally {
                Y.mojito.RouteMaker = realRouteMaker;
                Y.mojito.Loader = realLoader;
            }

            A.isObject(finalLoaderConfig, 'loader is not receiving the appConfig');
            A.areSame('es', finalLoaderConfig.yui.config.lang, 'the context.lang is not propagated correctly');
        },



        'honor yui.config.fetchCSS=false in application.json': function() {

            var realLoader = Y.mojito.Loader;
            Y.mojito.Loader = function () {};
            Y.mojito.Loader.prototype = {
                createYuiLibComboUrl: function(yuiModules, yuiFilter) {
                    return {
                        'css': ['css-1','css-2'],
                        'js':  ['js-1','js-2']
                    };
                }
            };

            var realRouteMaker = Y.mojito.RouteMaker;
            Y.mojito.RouteMaker = function() {};
            Y.mojito.RouteMaker.prototype = {
                getComputedRoutes: function() {
                    return ['routes'];
                }
            };

            addon.ac = {
                http: {
                    getHeader: function(h) {
                        return null;
                    }
                }
            };
            addon.ac.context = {
                lang: 'klingon'
            };
            addon.setStore({
                getAppConfig: function() {
                    return { yui:{ config:{ fetchCSS:false } } };
                },
                serializeClientStore: function() {
                    return 'clientstore';
                },
                store: {
                    getAllURLs: function() { return {}; },
                    getFrameworkConfig: function() {
                        return { ondemandBaseYuiModules:[] };
                    },
                    yui: {
                        getConfigShared: function() { return {}; }
                    }
                }
            });

            var counts = {};
            var assetHandler = {
                    addCss: function(path, location) {
                        counts['css ' + location] = counts['css ' + location] || 0;
                        counts['css ' + location]++;
                        return;
                    },
                    addAssets: function(args) {
                        for (var location in args) {
                            if (args.hasOwnProperty(location)) {
                                for (var type in args[location]) {
                                    if (args[location].hasOwnProperty(type)) {
                                        var contents = args[location][type];
                                        counts[type + ' ' + location] = counts[type + ' ' + location] || 0;
                                        counts[type + ' ' + location] += contents.length;
                                    }
                                }
                            }
                        }
                        return;
                    },
                    addAsset: function(type, location, content) {
                        counts[type + ' ' + location] = counts[type + ' ' + location] || 0;
                        counts[type + ' ' + location]++;
                    }
                };
            var binderMap = {};

            try {
                addon.constructMojitoClientRuntime(assetHandler, binderMap);
            }
            finally {
                Y.mojito.RouteMaker = realRouteMaker;
                Y.mojito.Loader = realLoader;
            }

            A.areSame(2, Object.keys(counts).length, 'too many type:location pairs');
            A.areSame(2, counts['js top'], 'wrong number of js:top');
            A.areSame(1, counts['blob bottom'], 'wrong number of blob:bottom');
        },


        'dependencyCalculations precomputed': function() {
            var calledYuiModules;
            var realLoader = Y.mojito.Loader;
            Y.mojito.Loader = function () {};
            Y.mojito.Loader.prototype = {
                createYuiLibComboUrl: function(yuiModules, yuiFilter) {
                    calledYuiModules = yuiModules;
                    return {
                        'css': ['css-1','css-2'],
                        'js':  ['js-1','js-2']
                    };
                }
            };

            var realRouteMaker = Y.mojito.RouteMaker;
            Y.mojito.RouteMaker = function() {};
            Y.mojito.RouteMaker.prototype = {
                getComputedRoutes: function() {
                    return ['routes'];
                }
            };

            addon.ac = {
                http: {
                    getHeader: function(h) {
                        return null;
                    }
                }
            };
            addon.ac.context = {
                lang: 'klingon'
            };
            addon.setStore({
                getAppConfig: function() {
                    return { yui: { dependencyCalculations:'precomputed' } };
                },
                serializeClientStore: function() {
                    return 'clientstore';
                },
                store: {
                    getAllURLs: function() { return {}; },
                    getFrameworkConfig: function() {
                        return { ondemandBaseYuiModules:[] };
                    },
                    yui: {
                        getConfigShared: function() { return {}; }
                    }
                }
            });

            var YUI_use;
            var assetHandler = {
                    addCss: function(path, location) {
                        // not testing this
                        return;
                    },
                    addAssets: function(args) {
                        // not testing this
                        return;
                    },
                    addAsset: function(type, location, content) {
                        if ('blob' === type && 'bottom' === location) {
                            var matches = content.match(/YUI\(\)\.use\((.*), function/);
                            YUI_use = matches[1];
                        }
                        return;
                    }
                };
            var binderMap = {};

            try {
                addon.constructMojitoClientRuntime(assetHandler, binderMap);
            }
            finally {
                Y.mojito.RouteMaker = realRouteMaker;
                Y.mojito.Loader = realLoader;
            }

            AA.itemsAreEqual(['yui'], calledYuiModules);
            A.areSame("'*'", YUI_use);
        },


        'dependencyCalculations ondemand': function() {
            var calledYuiModules;
            var realLoader = Y.mojito.Loader;
            Y.mojito.Loader = function () {};
            Y.mojito.Loader.prototype = {
                createYuiLibComboUrl: function(yuiModules, yuiFilter) {
                    calledYuiModules = yuiModules;
                    return {
                        'css': ['css-1','css-2'],
                        'js':  ['js-1','js-2']
                    };
                }
            };

            var realRouteMaker = Y.mojito.RouteMaker;
            Y.mojito.RouteMaker = function() {};
            Y.mojito.RouteMaker.prototype = {
                getComputedRoutes: function() {
                    return ['routes'];
                }
            };

            addon.ac = {
                http: {
                    getHeader: function(h) {
                        return null;
                    }
                }
            };
            addon.ac.context = {
                lang: 'klingon'
            };
            addon.setStore({
                getAppConfig: function() {
                    return { yui: { dependencyCalculations:'ondemand' } };
                },
                serializeClientStore: function() {
                    return 'clientstore';
                },
                store: {
                    getAllURLs: function() { return {}; },
                    getFrameworkConfig: function() {
                        return { ondemandBaseYuiModules:[] };
                    },
                    yui: {
                        getConfigShared: function() { return {}; }
                    }
                }
            });

            var YUI_use;
            var assetHandler = {
                    addCss: function(path, location) {
                        // not testing this
                        return;
                    },
                    addAssets: function(args) {
                        // not testing this
                        return;
                    },
                    addAsset: function(type, location, content) {
                        if ('blob' === type && 'bottom' === location) {
                            var matches = content.match(/YUI\(\)\.use\((.*), function/);
                            YUI_use = matches[1];
                        }
                        return;
                    }
                };
            var binderMap = {};

            try {
                addon.constructMojitoClientRuntime(assetHandler, binderMap);
            }
            finally {
                Y.mojito.RouteMaker = realRouteMaker;
                Y.mojito.Loader = realLoader;
            }

            AA.itemsAreEqual(['yui','get','loader-base','loader-rollup','loader-yui3'], calledYuiModules);
            A.areSame("'mojito-client'", YUI_use);
        },


        'dependencyCalculations precomputed+ondemand': function() {
            var calledYuiModules;
            var realLoader = Y.mojito.Loader;
            Y.mojito.Loader = function () {};
            Y.mojito.Loader.prototype = {
                createYuiLibComboUrl: function(yuiModules, yuiFilter) {
                    calledYuiModules = yuiModules;
                    return {
                        'css': ['css-1','css-2'],
                        'js':  ['js-1','js-2']
                    };
                }
            };

            var realRouteMaker = Y.mojito.RouteMaker;
            Y.mojito.RouteMaker = function() {};
            Y.mojito.RouteMaker.prototype = {
                getComputedRoutes: function() {
                    return ['routes'];
                }
            };

            addon.ac = {
                http: {
                    getHeader: function(h) {
                        return null;
                    }
                }
            };
            addon.ac.context = {
                lang: 'klingon'
            };
            addon.setStore({
                getAppConfig: function() {
                    return { yui: { dependencyCalculations:'precomputed+ondemand' } };
                },
                serializeClientStore: function() {
                    return 'clientstore';
                },
                store: {
                    getAllURLs: function() { return {}; },
                    getFrameworkConfig: function() {
                        return { ondemandBaseYuiModules:[] };
                    },
                    yui: {
                        getConfigShared: function() { return {}; }
                    }
                }
            });

            var YUI_use;
            var assetHandler = {
                    addCss: function(path, location) {
                        // not testing this
                        return;
                    },
                    addAssets: function(args) {
                        // not testing this
                        return;
                    },
                    addAsset: function(type, location, content) {
                        if ('blob' === type && 'bottom' === location) {
                            var matches = content.match(/YUI\(\)\.use\((.*), function/);
                            YUI_use = matches[1];
                        }
                        return;
                    }
                };
            var binderMap = {};

            try {
                addon.constructMojitoClientRuntime(assetHandler, binderMap);
            }
            finally {
                Y.mojito.RouteMaker = realRouteMaker;
                Y.mojito.Loader = realLoader;
            }

            AA.itemsAreEqual(['yui','get','loader-base','loader-rollup','loader-yui3'], calledYuiModules);
            A.areSame("'mojito-client'", YUI_use);
        },

        // optimize binders payload
        'test sanitizeDeployRuntimeClientConfig with all defaults': function() {
            A.isFunction(addon.sanitizeDeployRuntimeClientConfig);
            var appConfig = {},
                deployConfig = {};
           addon.sanitizeDeployRuntimeClientConfig({
               appClient: appConfig,
               deployConfig: deployConfig
           });
           // appConfig should not be modified
           A.isTrue(0 === Y.Object.size(appConfig), 'appConfig should not be modified');
           // useCompression, useDedupe, debug, yuiPrefix, mojitoPrefix,
           // exclude, staticHandlingPrefix
           A.isTrue(7 === Y.Object.size(deployConfig), 'deployConfig should be set with defaults');
           A.isFalse(deployConfig.useCompression, 'useCompression');
           A.isFalse(deployConfig.useDedupe, 'useDedupe');
           A.isFalse(deployConfig.debug, 'debug');
           A.areEqual('$x_', deployConfig.yuiPrefix, '$x_');
           A.areEqual('$y_', deployConfig.mojitoPrefix, '$y_');
           A.isTrue(Y.Lang.isArray(deployConfig.exclude), 'exclude should be Array');
           A.isTrue(0 === deployConfig.exclude.length, 'exclude array should be empty');
           A.areEqual('/static/mojito/', deployConfig.staticHandlingPrefix, 'staticHandlingPrefix should be set to /static/mojito/');
        },
        'test sanitizeDeployRuntimeClientConfig with staticHandling.prefix set': function() {
            var config = {};
            addon.sanitizeDeployRuntimeClientConfig({
                appConfig: { store: { appConfig: { staticHandling: { prefix: 'unit' } } } },
                deployConfig: config
            });
            A.areEqual('/unit/mojito/', config.staticHandlingPrefix,
                       'wrong staticHandlingPrefix');
        },
        'test sanitizeDeployRuntimeClientConfig with invalid deployConfig settings': function() {
            A.isFunction(addon.sanitizeDeployRuntimeClientConfig);
            var config;
            config = {
                useCompression: 'true', // should be boolean
                useDedupe: 'true', // should be boolean
                debug: 'debug', // should be boolean
                yuiPrefix: 23, // should be string
                mojitoPrefix: { foo: 'bar' }, // should be string
                exclude: 'hello' // should be array
            };
            addon.sanitizeDeployRuntimeClientConfig({
                appConfig: {},
                deployConfig: config
            });
            A.isFalse(config.useCompression, 'useCompression');
            A.isFalse(config.useDedupe, 'useDedupe');
            A.isFalse(config.debug, 'debug');
            A.areEqual('$x_', config.yuiPrefix, 'yuiPrefix');
            A.areEqual('$y_', config.mojitoPrefix, 'mojitoPrefix');
            A.isTrue(0 === config.exclude.length, 'exclude');
        },
        'test sanitizeDeployRuntimeClientConfig with user provided deployConfig settings': function() {
            var config = {
                useCompression: true,
                useDedupe: true,
                debug: true,
                yuiPrefix: 'YUIPREFIX',
                mojitoPrefix: 'MOJITOPREFIX',
                exclude: ['logs', 'assets']
            };
            addon.sanitizeDeployRuntimeClientConfig({
                appConfig: {},
                deployConfig: config
            });
            A.isTrue(config.useCompression, 'useCompression');
            A.isTrue(config.useDedupe, 'useDedupe');
            A.isTrue(config.debug, 'debug');
            A.areEqual('YUIPREFIX', config.yuiPrefix, 'yuiPrefix');
            A.areEqual('MOJITOPREFIX', config.mojitoPrefix, 'mojitoPrefix');
            A.isTrue(2 === config.exclude.length, 'exclude');
            A.areEqual('logs', config.exclude[0], 'exclude[0]');
            A.areEqual('assets', config.exclude[1], 'exclude[1]');
        },
        'test compressBinders with no binders': function() {
            A.isFunction(addon.compressBinders);

            var o = addon.compressBinders({});
            A.isTrue(0 === Y.Object.size(o), 'should be empty!');
        },

        mockBinderMap: function() {
            var binderMap,
                yuiBase,
                mojitoBase;

            yuiBase = 'http://yui.yahooapis.com/3.5.1/build/';
            mojitoBase = '/static/mojito/';
            binderMap = {
                view1: {
                    name: "view1",
                    needs: {
                        'yui-base': yuiBase + 'yui-base/yui-base-min.js',
                        'mojito-view-renderer': mojitoBase + 'autoload/view-renderer.common.js',
                        'moduleOne': '/foo/bar/moduleOne.js'
                    }
                },
                view2: {
                    name: "view2",
                    needs: {
                        'moduleOne': '/foo/bar/moduleOne.js',
                        'moduleTwo': '/foo/bar/moduleTwo.js'
                    }
                }
            };
            return binderMap;
        },
        'test compressBinders with binders but no yuiBase': function() {

            var binderMap = this.mockBinderMap(),
                hashMap,
                SUB = '0';

            A.isFunction(addon.compressBinders);
            hashMap = addon.compressBinders({
                binderMap: binderMap
            });
            A.isTrue(4 === Y.Object.size(hashMap), 'should be 4 keys!');
            A.isNotUndefined(hashMap['yui-base'], 'missing yui-base');
            A.isNotUndefined(hashMap['mojito-view-renderer'], 'missing mojito-view-renderer');
            A.isNotUndefined(hashMap['moduleOne'], 'missing moduleOne');
            A.isNotUndefined(hashMap['moduleTwo'], 'missing moduleTwo');
            A.areEqual('http://yui.yahooapis.com/3.5.1/build/yui-base/yui-base-min.js',
                       hashMap['yui-base'],
                       'module path mismatch!');
            A.areEqual('$y_autoload/view-renderer.common.js',
                       hashMap['mojito-view-renderer'],
                       'module path mismatch!');
            A.areEqual('/foo/bar/moduleOne.js',
                       hashMap['moduleOne'],
                       'module path mismatch!');
            A.areEqual('/foo/bar/moduleTwo.js',
                       hashMap['moduleTwo'],
                       'module path mismatch!');
            /*
            A.areEqual('yui-base',
                       binderMap['view1'].needs['yui-base'],
                       'wrong module set!');
            A.areEqual('mojito-view-renderer',
                       binderMap['view1'].needs['mojito-view-renderer'],
                       'wrong module set!');
            A.areEqual('moduleOne',
                       binderMap['view1'].needs['moduleOne'],
                       'wrong module set!');
            A.areEqual('moduleOne',
                       binderMap['view2'].needs['moduleOne'],
                       'wrong module set!');
            A.areEqual('moduleTwo',
                       binderMap['view2'].needs['moduleTwo'],
                       'wrong module set!');
            */
            A.areEqual(SUB,
                       binderMap['view1'].needs['yui-base'],
                       'wrong module set!');
            A.areEqual(SUB,
                       binderMap['view1'].needs['mojito-view-renderer'],
                       'wrong module set!');
            A.areEqual(SUB,
                       binderMap['view1'].needs['moduleOne'],
                       'wrong module set!');
            A.areEqual(SUB,
                       binderMap['view2'].needs['moduleOne'],
                       'wrong module set!');
            A.areEqual(SUB,
                       binderMap['view2'].needs['moduleTwo'],
                       'wrong module set!');

        },

        'test compressBinders with binders and yuiBase': function() {
            var binderMap = this.mockBinderMap(),
                hashMap,
                yuiBase = 'http://yui.yahooapis.com/3.5.1/build/';

            A.isFunction(addon.compressBinders);
            hashMap = addon.compressBinders({
                binderMap: binderMap,
                deployConfig: { yuiConfigBase: yuiBase }
            });
            A.isTrue(4 === Y.Object.size(hashMap), 'should be 4 keys!');
            A.areEqual('$x_yui-base/yui-base-min.js',
                       hashMap['yui-base'],
                       'module path mismatch!');
        },
        // remove any binders missing "name" property
        'test compressBinders with binders and no name': function() {
            A.isFunction(addon.compressBinders);
            var binderMap;

            binderMap = {
                view1: {
                    needs: {}
                },
                view2: {
                    name: "view2",
                    needs: {}
                }
            };
            addon.compressBinders({
                binderMap: binderMap,
                deployConfig: { }
            });
            A.isTrue(1 === Y.Object.size(binderMap), 'view1 should have been deleted');
        },
        // remove any binder.children property if they exist
        'test compressBinders with binders that has children': function() {
            A.isFunction(addon.compressBinders);
            var binderMap;

            binderMap = {
                view1: {
                    name: "view1",
                    needs: {},
                    children: { }
                },
                view2: {
                    name: "view2",
                    needs: {}
                }
            };
            addon.compressBinders({
                binderMap: binderMap,
                deployConfig: {}
            });
            A.isTrue(2 === Y.Object.size(binderMap), '2 views expected');
            A.isUndefined(binderMap.view1.children, 'children Object should be been deleted');
        },
        'test compressBinders with user provided yuiPrefix': function() {
            A.isFunction(addon.compressBinders);
            var binderMap,
                lookup,
                config;

            config = {
                yuiPrefix: '####',
                yuiConfigBase: 'http://api.yahooapis.com/'
            };
            binderMap = {
                view1: {
                    name: 'name',
                    needs: {
                        moduleOne: 'http://api.yahooapis.com/build/view.js'
                    }
                }
            };
            lookup = addon.compressBinders({
                binderMap: binderMap,
                deployConfig: config
            });
            A.areEqual('####build/view.js',
                       lookup.moduleOne,
                       'module compressed path does not match');
        },
        'test compressBinders with user provided mojitoPrefix': function() {
            A.isFunction(addon.compressBinders);
            var binderMap,
                lookup,
                config;

            config = {
                mojitoPrefix: '####',
                staticHandlingPrefix: '/user/prefix/',
                yuiConfigBase: 'http://api.yahooapis.com/'
            };
            binderMap = {
                view1: {
                    name: 'name',
                    needs: {
                        moduleOne: '/user/prefix/build/view.js'
                    }
                }
            };
            lookup = addon.compressBinders({
                binderMap: binderMap,
                deployConfig: config
            });
            A.areEqual('####build/view.js',
                       lookup.moduleOne,
                       'module compressed path does not match');
        },
        'test compressBinders with user provided staticHandling.prefix': function() {
            A.isFunction(addon.compressBinders);
            var binderMap,
                lookup;

            binderMap = {
                view1: {
                    name: "view1",
                    needs: {
                        module1: '/test-static/mojito/FooBar'
                    }
                }
            };
            lookup = addon.compressBinders({
                binderMap: binderMap,
                deployConfig: {
                    staticHandlingPrefix: '/test-static/mojito/'
                }
            });
            A.isTrue(1 === Y.Object.size(binderMap), '1 view expected');
            A.areEqual('0', binderMap.view1.needs.module1, 'unexpected path!');
            A.areEqual('$y_FooBar',
                       lookup.module1,
                       'path mismatch!');
        },


        'test dedupeBindersNeeds with no args': function() {
            A.isFunction(addon.dedupeBindersNeeds);
            var cache = addon.dedupeBindersNeeds();
            OA.areEqual({}, cache, 'cache should be empty');
        },
        'test dedupeBindersNeeds with empty args': function() {
            A.isFunction(addon.dedupeBindersNeeds);
            var cache = addon.dedupeBindersNeeds({});
            OA.areEqual({}, cache, 'cache should be empty');
        },
        'test dedupeBindersNeeds with valid args': function() {
            A.isFunction(addon.dedupeBindersNeeds);
            var binderMap =this.mockBinderMap(),
                cache = addon.dedupeBindersNeeds({
                binderMap: binderMap,
                yuiJsUrlContains: {
                    'yui-base': true
                }
            });
            /*
            console.log(cache);
{ 'mojito-view-renderer': '/static/mojito/autoload/view-renderer.common.js',
  moduleOne: '/foo/bar/moduleOne.js',
  moduleTwo: '/foo/bar/moduleTwo.js' }
            console.log(binderMap);
{ view1: 
   { needs: 
      { 'yui-base': 'http://yui.yahooapis.com/3.5.1/build/yui-base/yui-base-min.js',
        'mojito-view-renderer': '/static/mojito/autoload/view-renderer.common.js',
        moduleOne: '/foo/bar/moduleOne.js' } },
  view2: { needs: { moduleTwo: '/foo/bar/moduleTwo.js' } } }
             */
            A.isTrue(3 === Y.Object.size(cache), 'cache should have 3 keys');
            A.isUndefined(cache['yui-base'], 'yui-base should not be cached!');
            A.isUndefined(binderMap.view2.needs['moduleOne'],
                'moduleOne should have been cached because it was added in view1');
        },
        'test cleanseAppConfig with no argument': function() { A.isFunction(addon.cleanseAppConfig);
            A.isUndefined(addon.cleanseAppConfig(), 'should return undefined');
        },
        'test cleanseAppConfig with missing specification': function() {
            A.isFunction(addon.cleanseAppConfig);
            A.isUndefined(addon.cleanseAppConfig({}), 'should return undefined');
        },
        'test cleanseAppConfig with missing appConfig': function() {
            A.isFunction(addon.cleanseAppConfig);
            A.isUndefined(addon.cleanseAppConfig({exclude: []}), 'should return undefined');
        },
        'test cleanseAppConfig with missing exclude': function() {
            A.isFunction(addon.cleanseAppConfig);
            A.isUndefined(addon.cleanseAppConfig({appConfig: {}}), 'should return undefined');
        },
        'test cleanseAppConfig': function() {
            A.isFunction(addon.cleanseAppConfig);
            var result;

            result =  addon.cleanseAppConfig({
                exclude: ['log'],
                appConfig: {
                    foo: 'bar',
                    log: { foo: 'bar' },
                    bar: 'foo'
                }
            });
            A.isObject(result, 'config should be object');
            A.isUndefined(result.log, 'config.log should be been deleted!');
            A.isNotUndefined(result.foo, 'config.bar should exist!');
            A.isNotUndefined(result.bar, 'config.bar should exist!');

        }


    }));

    YUITest.TestRunner.add(suite);


}, '0.0.1', {requires: [
    'mojito-deploy-addon',
    'json'
]});
