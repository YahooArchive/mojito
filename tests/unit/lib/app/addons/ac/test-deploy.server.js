/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


YUI().use('mojito-deploy-addon', 'test', 'json-parse', function(Y) {
    var suite = new Y.Test.Suite('mojito-deploy-addon tests'),
        cases = {},
        A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,

        addon;

    cases = {
        name: 'mojito-deploy-addon tests',

        setUp: function() {
            addon = new Y.mojito.addons.ac.deploy({instance: {}});
        },

        tearDown: function() {
            addon = null;
        },


        'YUI.applyConfig() should use application.json yui.config': function() {
            addon.ac = {
                http: {
                    getHeader: function(h) {
                        return null;
                    }
                },
                url: {
                    getRouteMaker: function() {
                        return {
                            getComputedRoutes: function() {
                                return ['routes'];
                            }
                        };
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
                getAllURLs: function() { return {}; },
                getFrameworkConfig: function() {
                    return { ondemandBaseYuiModules:[] };
                },
                yui: {
                    getAppSeedFiles: function () { return ['/static/seed.js']; },
                    getAppGroupConfig: function() { return {}; },
                    getConfigShared: function() { return {}; },
                    langs: { klingon: true }
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
            addon.constructMojitoClientRuntime(assetHandler, binderMap);

            A.areSame(1, blobs.length, 'wrong number of blobs');
            var matches = blobs[0].match(/YUI\.applyConfig\((.+?)\);/);
            A.isNotUndefined(matches[1], 'failed to find YUI.applyConfig() in blob');
            var config = Y.JSON.parse(matches[1]);
            A.isObject(config, 'failed to parse YUI.applyConfig()');
            A.areSame('bar', config.foo, 'failed to base YUI.applyConfig() on application.yui.config');
            A.areSame('klingon', config.lang, 'wrong lang used');
        },


        'test constructMojitoClientRuntime w/ a binderMap': function() {
            var blobs = [],
                assetHandler = {
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
                },
                binderMap = {
                    'viewId1': {
                        needs: 'a drink'
                    },
                    'viewId2': {
                        needs: 'another drink'
                    }
                };

            addon.ac = {
                http: {
                    getHeader: function(h) {
                        return null;
                    }
                },
                context: {
                    lang: 'klingon'
                },
                url: {
                    getRouteMaker: function() {
                        return {
                            getComputedRoutes: function() {
                                return ['routes'];
                            }
                        };
                    }
                }
            };

            addon.setStore({
                getAppConfig: function() {
                    return { yui:{ config:{ foo:'bar' } } };
                },
                getAllURLs: function() { return {}; },
                getFrameworkConfig: function() {
                    return { ondemandBaseYuiModules:[] };
                },
                yui: {
                    getAppSeedFiles: function () { return ['/static/seed.js']; },
                    getAppGroupConfig: function() { return {}; },
                    getConfigShared: function() { return {}; },
                    langs: { klingon: true }
                }
            });

            addon.constructMojitoClientRuntime(assetHandler, binderMap);

            var expected = [
                    '<script type="text/javascript">',
                    '    YUI.applyConfig({"fetchCSS":true,"combine":true,"base":"http://yui.yahooapis.com/3.6.0/build/","comboBase":"http://yui.yahooapis.com/combo?","root":"3.6.0/build/","groups":{"app":{}},"foo":"bar","lang":"klingon"});',
                    '    YUI().use(\'mojito-client\', function(Y) {',
                    '    window.YMojito = { client: new Y.mojito.Client({"context":{"lang":"klingon","runtime":"client"},"binderMap":{"viewId1":{"needs":"a drink"},"viewId2":{"needs":"another drink"}},"appConfig":{"yui":{}},"routes":["routes"]}) };',
                    '        });',
                    '</script>',
                    ''
                ].join("\n");

            A.isArray(blobs);
            A.areSame(expected, blobs[0]);
            A.areSame(1, blobs.length, 'wrong number of blobs');
            var matches = blobs[0].match(/YUI\.applyConfig\((.+?)\);/);
            A.isNotUndefined(matches[1], 'failed to find YUI.applyConfig() in blob');
            var config = Y.JSON.parse(matches[1]);
            A.isObject(config, 'failed to parse YUI.applyConfig()');
            A.areSame('bar', config.foo, 'failed to base YUI.applyConfig() on application.yui.config');
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

            addon.ac = {
                http: {
                    getHeader: function(h) {
                        return null;
                    }
                },
                url: {
                    getRouteMaker: function() {
                        return {
                            getComputedRoutes: function() {
                                return ['routes'];
                            }
                        };
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
                getAllURLs: function() { return {}; },
                getFrameworkConfig: function() {
                    return { ondemandBaseYuiModules:[] };
                },
                yui: {
                    getAppSeedFiles: function () { return ['/static/seed.js']; },
                    getAppGroupConfig: function() { return {}; },
                    getConfigShared: function() { return {}; },
                    langs: { klingon: true }
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
                Y.mojito.Loader = realLoader;
            }

            A.areSame(2, Object.keys(counts).length, 'too many type:location pairs');
            A.areSame(1, counts['js top'], 'wrong number of js:top');
            A.areSame(1, counts['blob bottom'], 'wrong number of blob:bottom');
        },


        'test constructMojitoClientRuntime processes yui config correctly': function() {
            addon.ac = {
                http: {
                    getHeader: function(h) {
                        return null;
                    }
                },
                url: {
                    getRouteMaker: function() {
                        return {
                            getComputedRoutes: function() {
                                return ['routes'];
                            }
                        };
                    }
                }
            };
            addon.ac.context = {
                lang: 'klingon'
            };
            addon.setStore({
                getAppConfig: function() {
                    return {
                        yui: {
                            config: {
                                comboSep: '&',
                                groups: {
                                    app: {
                                        comboSep: '&'
                                    }
                                }
                            }
                        }
                    };
                },
                serializeClientStore: function() {
                    return 'clientstore';
                },
                getAllURLs: function() { return {}; },
                getFrameworkConfig: function() {
                    return { ondemandBaseYuiModules:[] };
                },
                yui: {
                    getAppSeedFiles: function () { return ['/static/seed.js']; },
                    getAppGroupConfig: function() { return {}; },
                    getConfigShared: function() { return {}; },
                    langs: { klingon: true }
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
            addon.constructMojitoClientRuntime(assetHandler, binderMap);

            var matches = blobs[0].match(/YUI\.applyConfig\((.+?)\);/);
            A.isNotUndefined(matches[1], 'failed to find YUI.applyConfig() in blob');
            var config = Y.JSON.parse(matches[1]);
            A.areSame('&', config.comboSep, 'comboSep got mangled');
            A.areSame('&', config.groups.app.comboSep, 'groups.app.comboSep got mangled');
        },

        'test _getSeedAssets with default config': function() {
            var assets = addon._getSeedAssets(['foo', 'bar'], {
                comboBase: 'comboBase?',
                comboSep: '~',
                base: 'base/',
                root: 'root/'
            });

            A.areSame(1, assets.length, 'combine should be the default action');
            A.areSame('comboBase?root/foo~root/bar', assets[0], 'invalid url construction when combo is on');
        },

        'test _getSeedAssets with combo off': function() {
            var assets = addon._getSeedAssets(['foo', 'bar'], {
                comboBase: 'comboBase?',
                comboSep: '~',
                base: 'base/',
                root: 'root/',
                combine: false
            });

            A.areSame(2, assets.length, 'combine: false should be honored');
            A.areSame('base/root/foo', assets[0], 'invalid url construction when combo is off');
            A.areSame('base/root/bar', assets[1], 'invalid url construction when combo is off for secundary module');
        },

        'test _getSeedAssets with combo on with external urls entries': function() {
            var assets = addon._getSeedAssets(['http://mojito.yahoo/baz', 'foo', 'bar'], {
                comboBase: 'comboBase?',
                comboSep: '~',
                base: 'base/',
                root: 'root/',
                combine: true
            });

            A.areSame(2, assets.length, 'external urls should be honored');
            A.areSame('http://mojito.yahoo/baz', assets[0], 'problem with external url detection');
            A.areSame('comboBase?root/foo~root/bar', assets[1], 'invalid url construction when combo is on and external urls are also in the mix');
        },

        'test _getSeedAssets with combo off with external urls entries': function() {
            var assets = addon._getSeedAssets(['http://mojito.yahoo/baz', 'foo', 'bar'], {
                comboBase: 'comboBase?',
                comboSep: '~',
                base: 'base/',
                root: 'root/',
                combine: false
            });

            A.areSame(3, assets.length, 'external urls should be honored');
            A.areSame('http://mojito.yahoo/baz', assets[0], 'problem with external url detection');
            A.areSame('base/root/foo', assets[1], 'invalid url construction when combo is off and external urls are also in the mix');
            A.areSame('base/root/bar', assets[2], 'invalid url construction when combo is off and external urls are also in the mix');
        },

        'test _getSeedAssets flushing order': function() {
            var assets = addon._getSeedAssets([
                    'http://mojito.yahoo/baz', 'foo', 'bar', 'http://mojito.yahoo/bar', 'baz'
                ], {
                comboBase: 'comboBase?',
                comboSep: '~',
                base: 'base/',
                root: 'root/'
            });

            A.areSame(4, assets.length, 'order should be honored');
            A.areSame('http://mojito.yahoo/baz', assets[0], 'initial external url order not honored');
            A.areSame('comboBase?root/foo~root/bar', assets[1], 'combo in second position not honored');
            A.areSame('http://mojito.yahoo/bar', assets[2], 'external url in the middle not honored');
            A.areSame('comboBase?root/baz', assets[3], 'combo at the end not honored');
        }

    };

    suite.add(new Y.Test.Case(cases));
    Y.Test.Runner.add(suite);
});
