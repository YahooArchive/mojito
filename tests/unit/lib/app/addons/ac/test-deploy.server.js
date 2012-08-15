/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
/*

javascript error: require is not defined at 17, url: http://localhost:4459/arrow/static/Users/isao/Repos/mojito/myfork/source/lib/app/addons/ac/deploy.server.js

*/
YUI().use('mojito-deploy-addon', 'test', 'json-parse', function(Y) {
    var suite = new Y.Test.Suite('mojito-deploy-addon tests'),
        cases = {},
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert;

    cases = {
        name: 'basics',

        setUp: function() {
            addon = new Y.mojito.addons.ac.deploy({instance: {}});
        },

        tearDown: function() {
            addon = null;
        },

        'test YUI_config should use application.json yui.config': function() {

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


        'test application.json should honor yui.config.fetchCSS=false': function() {

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


        'test dependencyCalculations precomputed': function() {
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


        'test dependencyCalculations ondemand': function() {
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


        'test dependencyCalculations precomputed+ondemand': function() {
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
        }
    };

    suite.add(new Y.Test.Case(cases));
    Y.Test.Runner.add(suite);
});
