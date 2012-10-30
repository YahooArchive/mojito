/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-test-extra', 'test', function(Y) {
    var libvm = require('vm'),
        A = Y.Assert,
        AA = Y.ArrayAssert,
        cases = {},
        factory = require(Y.MOJITO_DIR + 'lib/app/middleware/mojito-combo-handler');


    // returns the data from examples/getting-started-guide/part4/paged-flickr
    function makeStoreFakeGSG4() {
        var store = {
                getAppConfig: function() { return {}; },
                getStaticContext: function() { return {}; },
                getAllModulesURLs: function() {
                    return {
                        "PagedFlickr": "/path/to/mojito/examples/getting-started-guide/part4/paged-yql/mojits/PagedFlickr/controller.common.js",
                        "lang/PagedFlickr_de": "/path/to/mojito/examples/getting-started-guide/part4/paged-yql/mojits/PagedFlickr/lang/PagedFlickr_de.js",
                        "lang/PagedFlickr_en-US": "/path/to/mojito/examples/getting-started-guide/part4/paged-yql/mojits/PagedFlickr/lang/PagedFlickr_en-US.js",
                        "PagedFlickrModel": "/path/to/mojito/examples/getting-started-guide/part4/paged-yql/mojits/PagedFlickr/models/model.common.js",
                        "LazyLoad": "/path/to/mojito/lib/app/mojits/LazyLoad/controller.common.js",
                        "mojito-analytics-addon": "/path/to/mojito/lib/app/addons/ac/analytics.common.js",
                        "mojito-assets-addon": "/path/to/mojito/lib/app/addons/ac/assets.common.js",
                        "mojito-composite-addon": "/path/to/mojito/lib/app/addons/ac/composite.common.js",
                        "mojito-config-addon": "/path/to/mojito/lib/app/addons/ac/config.common.js",
                        "mojito-intl-addon": "/path/to/mojito/lib/app/addons/ac/intl.common.js",
                        "mojito-meta-addon": "/path/to/mojito/lib/app/addons/ac/meta.common.js",
                        "mojito-models-addon": "/path/to/mojito/lib/app/addons/ac/models.common.js",
                        "mojito-output-adapter-addon": "/path/to/mojito/lib/app/addons/ac/output-adapter.common.js",
                        "mojito-params-addon": "/path/to/mojito/lib/app/addons/ac/params.common.js",
                        "mojito-partial-addon": "/path/to/mojito/lib/app/addons/ac/partial.common.js",
                        "mojito-url-addon": "/path/to/mojito/lib/app/addons/ac/url.common.js",
                        "mojito-action-context": "/path/to/mojito/lib/app/autoload/action-context.common.js",
                        "mojito-controller-context": "/path/to/mojito/lib/app/autoload/controller-context.common.js",
                        "mojito-dispatcher": "/path/to/mojito/lib/app/autoload/dispatch.common.js",
                        "mojito-loader": "/path/to/mojito/lib/app/autoload/loader.common.js",
                        "mojito-logger": "/path/to/mojito/lib/app/autoload/logger.common.js",
                        "mojito-test": "/path/to/mojito/lib/app/autoload/mojito-test.common.js",
                        "mojito": "/path/to/mojito/lib/app/autoload/mojito.common.js",
                        "mojito-resource-store-adapter": "/path/to/mojito/lib/app/autoload/resource-store-adapter.common.js",
                        "mojito-rest-lib": "/path/to/mojito/lib/app/autoload/rest.common.js",
                        "mojito-route-maker": "/path/to/mojito/lib/app/autoload/route-maker.common.js",
                        "mojito-util": "/path/to/mojito/lib/app/autoload/util.common.js",
                        "mojito-view-renderer": "/path/to/mojito/lib/app/autoload/view-renderer.common.js",
                        "PagedFlickrBinderIndex": "/path/to/mojitoamples/getting-started-guide/part4/paged-yql/mojits/PagedFlickr/binders/index.js",
                        "LazyLoadBinderIndex": "/path/to/mojito/lib/app/mojits/LazyLoad/binders/index.js",
                        "mojito-cookie-addon": "/path/to/mojito/lib/app/addons/ac/cookie.client.js",
                        "mojito-hb": "/path/to/mojito/lib/app/addons/view-engines/hb.client.js",
                        "mojito-mu": "/path/to/mojito/lib/app/addons/view-engines/mu.client.js",
                        "mojito-mojit-proxy": "/path/to/mojito/lib/app/autoload/mojit-proxy.client.js",
                        "mojito-client": "/path/to/mojito/lib/app/autoload/mojito-client.client.js",
                        "mojito-output-handler": "/path/to/mojito/lib/app/autoload/output-handler.client.js",
                        "mojito-perf": "/path/to/mojito/lib/app/autoload/perf.client.js",
                        "mojito-client-store": "/path/to/mojito/lib/app/autoload/store.client.js",
                        "mojito-tunnel-client": "/path/to/mojito/lib/app/autoload/tunnel.client-optional.js"
                    };
                },
                yui: {
                    getConfigAllMojits: function(env, ctx) {
                        return {
                            modules: {
                                "PagedFlickrBinderIndex": {
                                    "fullpath": "/static/PagedFlickr/binders/index.js",
                                    "requires": []
                                },
                                "PagedFlickr": {
                                    "fullpath": "/static/PagedFlickr/controller.common.js",
                                    "requires": ["mojito-intl-addon", "mojito-util", "PagedFlickrModel"]
                                },
                                "lang/PagedFlickr_de": {
                                    "fullpath": "/static/PagedFlickr/lang/PagedFlickr_de.js",
                                    "requires": ["intl"]
                                },
                                "lang/PagedFlickr_en-US": {
                                    "fullpath": "/static/PagedFlickr/lang/PagedFlickr_en-US.js",
                                    "requires": ["intl"]
                                },
                                "PagedFlickrModel": {
                                    "fullpath": "/static/PagedFlickr/models/model.common.js",
                                    "requires": ["yql", "jsonp-url"]
                                },
                                "LazyLoadBinderIndex": {
                                    "fullpath": "/static/LazyLoad/binders/index.js",
                                    "requires": ["mojito-client", "node", "json"]
                                },
                                "LazyLoad": {
                                    "fullpath": "/static/LazyLoad/controller.common.js",
                                    "requires": ["mojito", "json"]
                                }

                            }
                        };
                    },
                    getConfigShared: function(env, ctx, justApp) {
                        return {
                            "modules": {
                                "mojito-analytics-addon": {
                                    "fullpath": "/static/mojito/addons/ac/analytics.common.js",
                                    "requires": ["mojito", "mojito-util", "mojito-meta-addon"]
                                },
                                "mojito-assets-addon": {
                                    "fullpath": "/static/mojito/addons/ac/assets.common.js",
                                    "requires": ["mojito", "mojito-util"]
                                },
                                "mojito-composite-addon": {
                                    "fullpath": "/static/mojito/addons/ac/composite.common.js",
                                    "requires": ["mojito", "mojito-util", "mojito-perf", "mojito-assets-addon", "mojito-params-addon"]
                                },
                                "mojito-config-addon": {
                                    "fullpath": "/static/mojito/addons/ac/config.common.js",
                                    "requires": ["mojito"]
                                },
                                "mojito-cookie-addon": {
                                    "fullpath": "/static/mojito/addons/ac/cookie.client.js",
                                    "requires": ["cookie", "mojito", "mojito-meta-addon"]
                                },
                                "mojito-intl-addon": {
                                    "fullpath": "/static/mojito/addons/ac/intl.common.js",
                                    "requires": ["intl", "datatype-date", "mojito", "mojito-config-addon"]
                                },
                                "mojito-meta-addon": {
                                    "fullpath": "/static/mojito/addons/ac/meta.common.js",
                                    "requires": ["mojito-util"]
                                },
                                "mojito-models-addon": {
                                    "fullpath": "/static/mojito/addons/ac/models.common.js",
                                    "requires": ["mojito"]
                                },
                                "mojito-output-adapter-addon": {
                                    "fullpath": "/static/mojito/addons/ac/output-adapter.common.js",
                                    "requires": ["json-stringify", "event-custom-base", "mojito-view-renderer", "mojito-util"]
                                },
                                "mojito-params-addon": {
                                    "fullpath": "/static/mojito/addons/ac/params.common.js",
                                    "requires": ["mojito"]
                                },
                                "mojito-partial-addon": {
                                    "fullpath": "/static/mojito/addons/ac/partial.common.js",
                                    "requires": ["mojito-util", "mojito-params-addon", "mojito-view-renderer"]
                                },
                                "mojito-url-addon": {
                                    "fullpath": "/static/mojito/addons/ac/url.common.js",
                                    "requires": ["querystring", "mojito-config-addon", "mojito-route-maker", "mojito-util"]
                                },
                                "mojito-hb": {
                                    "fullpath": "/static/mojito/addons/view-engines/hb.client.js",
                                    "requires": ["io-base", "handlebars"]
                                },
                                "mojito-mu": {
                                    "fullpath": "/static/mojito/addons/view-engines/mu.client.js",
                                    "requires": ["mojito-util", "io-base"]
                                },
                                "mojito-action-context": {
                                    "fullpath": "/static/mojito/autoload/action-context.common.js",
                                    "requires": ["mojito", "json-stringify", "event-custom-base", "mojito-view-renderer", "mojito-util"]
                                },
                                "mojito-controller-context": {
                                    "fullpath": "/static/mojito/autoload/controller-context.common.js",
                                    "requires": ["mojito-action-context", "mojito-util"]
                                },
                                "mojito-dispatcher": {
                                    "fullpath": "/static/mojito/autoload/dispatch.common.js",
                                    "requires": ["mojito-action-context", "mojito-util"]
                                },
                                "mojito-loader": {
                                    "fullpath": "/static/mojito/autoload/loader.common.js",
                                    "requires": ["get", "mojito"]
                                },
                                "mojito-logger": {
                                    "fullpath": "/static/mojito/autoload/logger.common.js",
                                    "requires": ["mojito"]
                                },
                                "mojito-mojit-proxy": {
                                    "fullpath": "/static/mojito/autoload/mojit-proxy.client.js",
                                    "requires": ["mojito", "mojito-util", "querystring"]
                                },
                                "mojito-client": {
                                    "fullpath": "/static/mojito/autoload/mojito-client.client.js",
                                    "requires": ["io-base", "event-delegate", "node-base", "querystring-stringify-simple", "mojito", "mojito-dispatcher", "mojito-route-maker", "mojito-client-store", "mojito-mojit-proxy", "mojito-tunnel-client", "mojito-output-handler", "mojito-util"]
                                },
                                "mojito-test": {
                                    "fullpath": "/static/mojito/autoload/mojito-test.common.js",
                                    "requires": ["mojito"]
                                },
                                "mojito": {
                                    "fullpath": "/static/mojito/autoload/mojito.common.js",
                                    "requires": []
                                },
                                "mojito-output-handler": {
                                    "fullpath": "/static/mojito/autoload/output-handler.client.js",
                                    "requires": ["mojito", "json-parse", "node"]
                                },
                                "mojito-perf": {
                                    "fullpath": "/static/mojito/autoload/perf.client.js",
                                    "requires": []
                                },
                                "mojito-resource-store-adapter": {
                                    "fullpath": "/static/mojito/autoload/resource-store-adapter.common.js",
                                    "requires": ["mojito-util", "json-stringify"]
                                },
                                "mojito-rest-lib": {
                                    "fullpath": "/static/mojito/autoload/rest.common.js",
                                    "requires": ["io-base", "querystring-stringify-simple", "mojito"]
                                },
                                "mojito-route-maker": {
                                    "fullpath": "/static/mojito/autoload/route-maker.common.js",
                                    "requires": ["querystring-stringify-simple", "querystring-parse", "mojito-util"]
                                },
                                "mojito-client-store": {
                                    "fullpath": "/static/mojito/autoload/store.client.js",
                                    "requires": ["mojito-util", "querystring-stringify-simple"]
                                },
                                "mojito-tunnel-client": {
                                    "fullpath": "/static/mojito/autoload/tunnel.client-optional.js",
                                    "requires": ["mojito", "io", "json-stringify", "json-parse"]
                                },
                                "mojito-util": {
                                    "fullpath": "/static/mojito/autoload/util.common.js",
                                    "requires": ["array-extras", "json-stringify", "mojito"]
                                },
                                "mojito-view-renderer": {
                                    "fullpath": "/static/mojito/autoload/view-renderer.common.js",
                                    "requires": ["mojito"]
                                }
                            }
                        };
                    },
                }
            };
        return store;
    }


    // @param {array} capture (optional) a list to which all logs are appended
    function makeLogger(capture) {
        return {
            log: function(msg, lvl, src) {
                if (capture) {
                    capture.push({
                        msg: msg,
                        lvl: lvl,
                        src: src
                    });
                }
            }
        };
    }


    function parseConfig(config) {
        var ctx = { x: undefined };
        config = 'x = ' + config + ';';
        libvm.runInNewContext(config, ctx, 'config');
        return ctx.x;
    }


    cases = {
        name: 'combo handler tests',


        'test produceMeta': function() {
            factory.unitTesting = true;
            var handler = factory({
                context: {},
                store: makeStoreFakeGSG4(),
                logger: makeLogger()
            });
            A.isFunction(factory.produceMeta);

            // loader-app-base_{lang}
            var meta = factory.produceMeta('loader-app-base', 'en-US');
            var matches = meta.match(/Y\.applyConfig\(([\s\S]+?)\);/);
            var config = parseConfig(matches[1]);
            A.isObject(config);
            A.isObject(config.groups);
            A.areSame(1, Object.keys(config.groups).length);
            A.isObject(config.groups.app);
            A.isTrue(config.groups.app.combine);
            A.areSame(1024, config.groups.app.maxURLLength);
            A.areSame('/static/', config.groups.app.base);
            A.areSame('/static/combo?', config.groups.app.comboBase);
            A.areSame('', config.groups.app.root);
            // we'll just spot-check a few things
            A.isObject(config.groups.app.modules);
            A.isObject(config.groups.app.modules['lang/PagedFlickr_en-US']);
            A.isArray(config.groups.app.modules['lang/PagedFlickr_en-US'].requires);
            AA.itemsAreEqual(['intl'], config.groups.app.modules['lang/PagedFlickr_en-US'].requires);
            A.isObject(config.groups.app.modules['mojito-client']);
            A.isArray(config.groups.app.modules['mojito-client'].requires);
            A.isUndefined(config.groups.app.modules['mojito-client'].expanded_map);
            A.isTrue(Object.keys(config.groups.app.modules['mojito-client'].requires).length > 0);
            A.isObject(config.groups.app.modules['PagedFlickrBinderIndex']);
            A.isArray(config.groups.app.modules['PagedFlickrBinderIndex'].requires);
            A.isUndefined(config.groups.app.modules['lang/PagedFlickr_de']);

            // loader-app-full_{lang}
            meta = factory.produceMeta('loader-app-full', 'en-US');
            matches = meta.match(/Y\.applyConfig\(([\s\S]+?)\);/);
            config = parseConfig(matches[1]);
            A.isObject(config);
            A.isObject(config.groups);
            A.areSame(1, Object.keys(config.groups).length);
            A.isObject(config.groups.app);
            A.isTrue(config.groups.app.combine);
            A.areSame(1024, config.groups.app.maxURLLength);
            A.areSame('/static/', config.groups.app.base);
            A.areSame('/static/combo?', config.groups.app.comboBase);
            A.areSame('', config.groups.app.root);
            // we'll just spot-check a few things
            A.isObject(config.groups.app.modules);
            A.isObject(config.groups.app.modules['lang/PagedFlickr_en-US']);
            A.isArray(config.groups.app.modules['lang/PagedFlickr_en-US'].requires);
            AA.itemsAreEqual(['intl'], config.groups.app.modules['lang/PagedFlickr_en-US'].requires);
            A.isObject(config.groups.app.modules['mojito-client']);
            A.isArray(config.groups.app.modules['mojito-client'].requires);
            A.isTrue(Object.keys(config.groups.app.modules['mojito-client'].requires).length > 0);
            A.isObject(config.groups.app.modules['PagedFlickrBinderIndex']);
            A.isArray(config.groups.app.modules['PagedFlickrBinderIndex'].requires);
            A.isUndefined(config.groups.app.modules['lang/PagedFlickr_de']);
            var i, j, obj;
            for (i in config.groups.app.modules) {
                if (config.groups.app.modules.hasOwnProperty(i)) {
                    obj = config.groups.app.modules[i];
                    A.isNotUndefined(obj.name);
                    A.isNotUndefined(obj.type);
                    A.isNotUndefined(obj.fullpath);
                    A.isNotUndefined(obj.requires);
                    A.isNotUndefined(obj.defaults);
                    // language bundles don't have expanded_map
                    if (!obj.langPack) {
                        for (j = 0; j < obj.requires.length; j += 1) {
                            A.isNotUndefined(obj.expanded_map[obj.requires[j]]);
                        }
                    }
                }
            }

            // loader
            meta = factory.produceMeta('loader', 'en-US');
            A.areSame('YUI.add("loader",function(Y){},"",{requires:["loader-base","loader-yui3","loader-app-base"]});', meta);

            // loader-lock
            meta = factory.produceMeta('loader-lock', 'en-US');
            matches = meta.match(/\.modules=[^|]+\|\|([\s\S]+?);},"",{requires:/);
            config = parseConfig(matches[1]);
            A.isObject(config);
            A.isObject(config.intl);
            A.isUndefined(config.intl.expanded_map);
            A.isObject(config['dom-style-ie']);
            A.isObject(config['dom-style-ie'].condition);
            A.areSame('function', typeof config['dom-style-ie'].condition.test);
            A.isUndefined(config['dom-style-ie'].expanded_map);

            // loader-full
            meta = factory.produceMeta('loader-full', 'en-US');
            matches = meta.match(/\.modules=[^|]+\|\|([\s\S]+?);},"",{requires:/);
            config = parseConfig(matches[1]);
            for (i in config) {
                if (config.hasOwnProperty(i)) {
                    obj = config[i];
                    A.isNotUndefined(obj.name, 'name');
                    A.isNotUndefined(obj.type, 'type');
                    A.isNotUndefined(obj.requires, 'requires');
                    A.isNotUndefined(obj.defaults, 'defaults');
                    // language bundles don't have expanded_map
                    if (!obj.langPack) {
                        A.isNotUndefined(obj.expanded_map);
                    }
                }
            }
            A.isObject(config.intl);
            A.isObject(config['dom-style-ie']);
            A.isObject(config['dom-style-ie'].condition);
            A.areSame('function', typeof config['dom-style-ie'].condition.test);
        },


        'ignore: bad or missing files': function() {
            // We can't do this yet, since calling factory() more than once
            // confuses YUI loader.
            // Once the YUI computations have been moved out of combo-handler,
            // we should be able to do deeper testing of combo-handler.
            return;

            factory.unitTesting = true;
            var logs = [],
                handler = factory({
                    context: {},
                    store: makeStoreFakeGSG4(),
                    logger: makeLogger(logs)
                });
            A.isFunction(factory.produceMeta);

            var req = {
                    method: 'GET',
                    url: '/combo?PagedFlickr.js&PagedFlickrModel.js'
                };
            var writeHeadCalled = 0,
                gotCode,
                gotHeaders,
                res = {
                    writeHead: function(code, headers) {
                        writeHeadCalled += 1;
                        gotCode = code;
                        gotHeaders = headers;
                    },
                    end: function(body) {
                        var i;
                        A.areSame(1, writeHeadCalled);
                        A.areSame(400, gotCode);
                        A.isUndefined(gotHeaders);
                        A.isUndefined(body);
                        A.isTrue(logs[1].msg.indexOf('NOT FOUND:') === 0, 'PagedFlickr.js not found');
                        A.isTrue(logs[2].msg.indexOf('NOT FOUND:') === 0, 'PagedFlickrModel.js not found');
                    }
                };
            handler(req, res);
        }


    };

    Y.Test.Runner.add(new Y.Test.Case(cases));
});
