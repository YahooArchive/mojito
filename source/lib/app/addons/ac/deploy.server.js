/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, stupid:true*/
/*global YUI*/


/**
 * @module ActionContextAddon
 */
YUI.add('mojito-deploy-addon', function(Y, NAME) {

    var fs = require('fs'),
        yuiFilter = 'min',
        minify,
        DEPLOY_YUI_PREFIX = '$x_',
        DEPLOY_MOJITO_PREFIX = '$y_',
        DEPLOY_MOJITO_STATIC_PREFIX = '/static/mojito/';


    if (YUI._mojito && YUI._mojito.DEBUG) {
        yuiFilter = 'debug';
    }


    // TODO: [Issue 64] improve this, it's a poor man's minify.
    // a. build minification into static handler?
    // b. build minification into prod-build script ?
    // c. build minification into server-start?
    minify = function(str) {
        // Remove comment blocks /* ... */ and
        // remove white space at the start of lines
        return str.replace(/\/\*[\s\S]*?\*\//g, '').
            replace(/^[ \t\r\n]+/gm, '');
    };


    /**
     * Hacky way to compute object size. Only interested in relative size for
     * comparison.
     * NOTE: Should not be used in production env
     * @private
     * @return -1 if error, otherwise size of object
     */
    function calculateObjectSize(o) {
        var str = '';
        try {
            str = Y.JSON.stringify(o);
        } catch (err) {
            return -1;
        }
        return str.length;
    }

    /**
     * Sanitizes config object for deployRuntimeClient
     *
     * Properties of {opts}:
     * <ul>
     *     <li>appConfig
     *     <li>deployConfig
     * </ul>
     *
     * @method satinizeDeployRunimeClientConfig
     * @private
     * @param {Object} opts
     * @return {Boolean} false if errors, otherwise true
     */
    function sanitizeDeployRuntimeClientConfig(opts) {
        var deployConfig,
            clientConfig,
            useCompression = false,
            useDedupe = false,
            debug = false,
            yuiPrefix = DEPLOY_YUI_PREFIX,
            mojitoPrefix = DEPLOY_MOJITO_PREFIX,
            exclude = [],
            prefix; // staticHandling.prefix

        opts = opts || {};
        deployConfig = opts.deployConfig || {};
        clientConfig = opts.appConfig || {};

        prefix = Y.Object.getValue(clientConfig,
                                  ['store', 'appConfig', 'staticHandling', 'prefix']);
        if (!prefix) {
            prefix = DEPLOY_MOJITO_STATIC_PREFIX;
        } else {
            prefix = '/' + prefix + '/mojito/';
        }

        if (deployConfig.useCompression &&
                typeof deployConfig.useCompression === 'boolean' &&
                true === deployConfig.useCompression) {
            useCompression = true;
        }
        if (deployConfig.useDedupe &&
                typeof deployConfig.useDedupe === 'boolean' &&
                true === deployConfig.useDedupe) {
            useDedupe = true;
        }
        if (deployConfig.debug &&
                typeof deployConfig.debug === 'boolean' &&
                true === deployConfig.debug) {
            debug = true;
        }
        if (deployConfig.yuiPrefix && typeof deployConfig.yuiPrefix === 'string') {
            yuiPrefix = deployConfig.yuiPrefix;
        }
        if (deployConfig.mojitoPrefix && typeof deployConfig.mojitoPrefix === 'string') {
            mojitoPrefix = deployConfig.mojitoPrefix;
        }
        if (deployConfig.exclude && Y.Lang.isArray(deployConfig.exclude)) {
            exclude = deployConfig.exclude;
        }
        deployConfig.useCompression = useCompression;
        deployConfig.useDedupe = useDedupe;
        deployConfig.debug = debug;
        deployConfig.yuiPrefix = yuiPrefix;
        deployConfig.mojitoPrefix = mojitoPrefix;
        deployConfig.exclude = exclude;
        deployConfig.staticHandlingPrefix = prefix;

        return true;
    }

    /**
     * Compress the binderMap module dependencies.
     *
     * Valid properties in {opts}:
     * <ul>
     *     <li>binderMap (see meta.binders.binderMap)
     *     <li>deployConfig (see appConfig.deployRuntimeClient)
     * </ul>
     *
     * The binderMap passed in will be modified in place.
     * @method compressBinders
     * @private
     * @param opts {Object}
     * @return {Object} if no compression , returns empty object
     */
    function compressBinders(opts) {
        var binderMap,
            config,
            yuiPrefix,
            mojitoPrefix,
            mojitoStaticPrefix,
            yuiBase,
            debug = false,
            // end config
            lookup = {},
            viewId,
            module,
            binder,
            path,
            uncompressedSize,
            compressedSize,
            lookupSize,
            compressionRate;

        opts = opts || {};
        if (0 === Y.Object.size(opts)) {
            return {};
        }
        binderMap = opts.binderMap || {};
        config = opts.deployConfig || {};
        yuiPrefix = config.yuiPrefix || DEPLOY_YUI_PREFIX;
        mojitoPrefix = config.mojitoPrefix || DEPLOY_MOJITO_PREFIX;
        mojitoStaticPrefix = config.staticHandlingPrefix ||
            DEPLOY_MOJITO_STATIC_PREFIX;
        yuiBase = config.yuiConfigBase || undefined;
        debug = config.debug || false;

        if (debug) {
            uncompressedSize = calculateObjectSize(binderMap);
        }
        for (viewId in binderMap) {
            if (binderMap.hasOwnProperty(viewId)) {
                binder = binderMap[viewId];
                // From Zed: Prune binderMap prior to deploying to client
                if (!binder.name) {
                    // Delete mojit entries that have no "binder"
                    delete binderMap[viewId];
                    binder = null;
                } else if (binder.children) {
                    // Don't have MVC running locally, so don't need
                    // the "children" mojits either
                    delete binder.children;
                }
                if (binder !== null) {
                    for (module in binder.needs) {
                        if (binder.needs.hasOwnProperty(module)) {
                            if (binder.needs[module] &&
                                    Y.Lang.isString(binder.needs[module])) {
                                path = binder.needs[module];
                                if (yuiBase && -1 !== path.indexOf(yuiBase)) {
                                    path = path.replace(yuiBase, yuiPrefix);
                                } else if (-1 !== path.indexOf(mojitoStaticPrefix)) {
                                    path = path.replace(mojitoStaticPrefix, mojitoPrefix);
                                }
                                if (!lookup[module]) {
                                    lookup[module] = path;
                                }
                                //binder.needs[module] = module;
                                // TODO: make this '0' configurable in app.json
                                binder.needs[module] = '0';
                            }
                        }
                    }
                }
            }
        }

        if (debug) {
            compressedSize = calculateObjectSize(binderMap);
            lookupSize = calculateObjectSize(lookup);
            compressionRate = (uncompressedSize - (compressedSize + lookupSize)) / uncompressedSize * 100;
            compressionRate = compressionRate.toFixed(2);
            Y.log('-- Binders compression rate: ' + compressionRate + ' %', 'info', NAME);
        }

        return lookup;
    }

    /**
     * **Experimental** Remove duplicate needs in binders
     *
     * Configuration for {opts}:
     * <ul>
     *     <li>yuiJsUrlContains
     *     <li>binderMap
     * </ul>
     *
     * @method dedupeBindersNeeds
     * @private
     * @param opts {Object} 
     * @return {Object} module => path to be added to the "bottom" of the page
     */
    function dedupeBindersNeeds(opts) {
        var needs,
            viewId,
            binder,
            module,
            path,
            debug = true,
            cache = {},
            yuiJsUrlContains,
            binderMap,
            uncompressedSize,
            compressedSize,
            cacheSize,
            compressionRate;

        if (!opts) {
            return cache;
        }

        binderMap = opts.binderMap || {};
        if (Y.Object.isEmpty(binderMap)) {
            return cache;
        }

        yuiJsUrlContains = opts.yuiJsUrlContains || {};

        if (debug) {
            uncompressedSize = calculateObjectSize(binderMap);
        }
        for (viewId in binderMap) {
            if (binderMap.hasOwnProperty(viewId)) {
                binder = binderMap[viewId];
                needs = {};
                for (module in binder.needs) {
                    if (binder.needs.hasOwnProperty(module)) {
                        path = binder.needs[module];
                        if (yuiJsUrlContains[module]) {
                            needs[module] = path; // preserve non-mojito module
                        } else {
                            if (!cache.hasOwnProperty(module)) {
                                needs[module] = path;
                                cache[module] = path;
                            }
                        }
                    }
                }
                binder.needs = needs;
            }
        }
        if (debug) {
            compressedSize = calculateObjectSize(binderMap);
            cacheSize = calculateObjectSize(cache);
            if (uncompressedSize > 0 && compressedSize > 0) {
                compressionRate = ((uncompressedSize - (compressedSize + cacheSize)) / uncompressedSize * 100);
                compressionRate = compressionRate.toFixed(2);
                Y.log('-- Dedupe compression rate : ' + compressionRate + ' %', 'info', NAME);
            }
        }
        return cache;
    }

    /**
     * NOTE: Will modify the appConfig Object that is passed in
     *       appConfig can be reasonably large. is cloning a better approach ?
     *
     * {opts} properties:
     * <ul>
     *     <li>appConfig {Object}
     *     <li>exclude {Array} List of keys to remove from appConfig
     * </ul>
     *
     * @method cleanseAppConfig
     * @private
     * @param {Object} opts
     * @return {Object} the modified appConfig, otherwise undefined
     */
    function cleanseAppConfig(opts) {
        var appConfig,
            exclude;

        opts = opts || {};
        if (0 === Y.Object.size(opts)) {
            return;
        }
        appConfig = opts.appConfig || {};
        if (0 === Y.Object.size(appConfig)) {
            return;
        }
        exclude = opts.exclude || [];
        if (!Y.Lang.isArray(exclude) || 0 === exclude.length) {
            return;
        }
        Y.Array.each(exclude, function(key) {
            if (!Y.Lang.isUndefined(appConfig[key])) {
                delete appConfig[key];
            }
        });
        return appConfig;
    }



    /**
     * <strong>Access point:</strong> <em>ac.deploy.*</em>
     * Provides ability to create client runtime deployment HTML
     * @class Deploy.server
     */
    function Addon(command, adapter, ac) {
        this.instance = command.instance;
        this.scripts = {};
        this.ac = ac;
    }


    Addon.prototype = {

        namespace: 'deploy',

        /**
         * Declaration of store requirement.
         * @method setStore
         * @private
         * @param {ResourceStore} rs The resource store instance.
         */
        setStore: function(rs) {
            this.rs = rs;
            if (rs) {
                Y.log('Initialized and activated with Resource Store', 'info',
                        NAME);
            }
        },

        /**
         * Builds up the browser Mojito runtime.
         * @method constructMojitoClientRuntime
         * @param {AssetHandler} assetHandler asset handler used to add scripts
         *     to the DOM under construction.
         * @param {object} binderMap information about the binders that will be
         *     deployed to the client.
         */
        constructMojitoClientRuntime: function(assetHandler, binderMap) {

            //Y.log('Constructing Mojito client runtime', 'debug', NAME);

            var store = this.rs,
                contextServer = this.ac.context,
                appConfigServer = store.getAppConfig(contextServer),
                contextClient,
                appConfigClient,
                yuiConfig = {},
                fwConfig,
                yuiConfigEscaped,
                yuiConfigStr,
                yuiModules,
                loader,
                yuiCombo,
                yuiJsUrls = [],
                yuiCssUrls = [],
                yuiJsUrlContains = {},
                viewId,
                binder,
                i,
                id,
                clientConfig = {},
                clientConfigEscaped,
                clientConfigStr,
                usePrecomputed,
                useOnDemand,
                initialModuleList,
                initializer, // script for YUI initialization
                routeMaker,
                type,
                module,
                path,
                pathToRoot,
                urls,
                // optimizer
                deployNeedsCache, // cache the binderMap[viewId].needs dupes
                deployRuntimeClientConfig = {}; // conf object for fine tuning

            contextClient = Y.mojito.util.copy(contextServer);
            contextClient.runtime = 'client';
            appConfigClient = store.getAppConfig(contextClient);
            clientConfig.context = contextClient;

            if (appConfigClient.yui && appConfigClient.yui.config) {
                yuiConfig = appConfigClient.yui.config;
            }
            yuiConfig.lang = contextServer.lang; // same as contextClient.lang
            yuiConfig.core = yuiConfig.core || [];
            yuiConfig.core = yuiConfig.core.concat(
                ['get', 'features', 'intl-base', 'yui-log', 'mojito',
                    'yui-later']
            );

            // If we have a "base" for YUI use it
            if (appConfigClient.yui && appConfigClient.yui.base) {
                yuiConfig.base = appConfigClient.yui.base;
                yuiConfig.combine = false;
            }

            // If we know where yui "Loader" is tell YUI
            if (appConfigClient.yui && appConfigClient.yui.loader) {
                yuiConfig.loaderPath = appConfigClient.yui.loader;
            }

            clientConfig.store = store.serializeClientStore(contextClient);

            usePrecomputed = appConfigServer.yui &&
                appConfigServer.yui.dependencyCalculations && (-1 !==
                appConfigServer.yui.dependencyCalculations.indexOf(
                        'precomputed'
                    ));
            useOnDemand = appConfigServer.yui &&
                appConfigServer.yui.dependencyCalculations && (-1 !==
                appConfigServer.yui.dependencyCalculations.indexOf(
                        'ondemand'
                    ));
            if (!usePrecomputed) {
                useOnDemand = true;
            }

            urls = store.store.getAllURLs();

            // Set the YUI URL to use on the client (This has to be done
            // before any other scripts are added)
            if (appConfigClient.yui && appConfigClient.yui.url) {
                yuiJsUrls.push(appConfigClient.yui.url);
                // Since the user has given their own rollup of YUI library
                // modules, we need some way of knowing which YUI library
                // modules went into that rollup.
                if (Y.Lang.isArray(appConfigClient.yui.urlContains)) {
                    for (i = 0; i < appConfigClient.yui.urlContains.length;
                            i += 1) {
                        yuiJsUrlContains[appConfigClient.yui.urlContains[i]] =
                            true;
                    }
                }
            } else {
                // YUI 3.4.1 doesn't have actual rollup files, so we need to
                // specify all the parts directly.
                yuiModules = ['yui-base'];
                yuiJsUrlContains['yui-base'] = true;
                yuiModules = ['yui'];
                yuiJsUrlContains.yui = true;
                if (useOnDemand) {
                    fwConfig = store.store.getFrameworkConfig();
                    yuiModules.push('get');
                    yuiJsUrlContains.get = true;
                    yuiModules.push('loader-base');
                    yuiJsUrlContains['loader-base'] = true;
                    yuiModules.push('loader-rollup');
                    yuiJsUrlContains['loader-rollup'] = true;
                    yuiModules.push('loader-yui3');
                    yuiJsUrlContains['loader-yui3'] = true;
                    for (i = 0; i < fwConfig.ondemandBaseYuiModules.length; i += 1) {
                        module = fwConfig.ondemandBaseYuiModules[i];
                        yuiModules.push(module);
                        yuiJsUrlContains[module] = true;
                    }
                }
                if (appConfigClient.yui && appConfigClient.yui.extraModules) {
                    for (i = 0; i < appConfigClient.yui.extraModules.length;
                            i += 1) {
                        yuiModules.push(appConfigClient.yui.extraModules[i]);
                        yuiJsUrlContains[
                            appConfigClient.yui.extraModules[i]
                        ] = true;
                    }
                }
                for (viewId in binderMap) {
                    if (binderMap.hasOwnProperty(viewId)) {
                        binder = binderMap[viewId];
                        for (module in binder.needs) {
                            if (binder.needs.hasOwnProperty(module)) {
                                path = binder.needs[module];
                                // Anything we don't know about we'll assume is
                                // a YUI library module.
                                if (!urls[path]) {
                                    yuiModules.push(module);
                                    yuiJsUrlContains[module] = true;
                                }
                            }
                        }
                    }
                }

                loader = new Y.mojito.Loader(appConfigClient);
                yuiCombo = loader.createYuiLibComboUrl(yuiModules, yuiFilter);
                yuiJsUrls = yuiCombo.js;
                yuiCssUrls = yuiCombo.css;
            }
            for (i = 0; i < yuiJsUrls.length; i += 1) {
                this.addScript('top', yuiJsUrls[i]);
            }
            // defaults to true if missing
            if (!yuiConfig.hasOwnProperty('fetchCSS') || yuiConfig.fetchCSS) {
                for (i = 0; i < yuiCssUrls.length; i += 1) {
                    assetHandler.addCss(yuiCssUrls[i], 'top');
                }
            }

            // add mojito bootstrap
            // With "precomputed" the scripts are listed as binder dependencies
            // and thus loaded that way.  However, with "ondemand" we'll use
            // the YUI loader which we haven't (yet) taught where to find the
            // fw & app scripts.
            if (useOnDemand) {
                // add all framework-level and app-level code
                this.addScripts('bottom', store.store.yui.getConfigShared(
                    'client',
                    contextClient
                ).modules, false);
            }


            // NOTE: currently only supporting compression wih "precomputed"
            if (usePrecomputed) {
                deployRuntimeClientConfig = Y.Object.getValue(clientConfig,
                                                              ['store',
                                                                'appConfig',
                                                                'deployRuntimeClient']) || {};
                sanitizeDeployRuntimeClientConfig({
                    appConfig: clientConfig,
                    deployConfig: deployRuntimeClientConfig
                });
            }
            //

            // add binders' dependencies
            if (deployRuntimeClientConfig.useDedupe) {
                deployNeedsCache = dedupeBindersNeeds({
                    yuiJsUrlContains: yuiJsUrlContains,
                    binderMap: binderMap
                });
                if (deployNeedsCache && Y.Lang.isObject(deployNeedsCache)) {
                    Y.Object.each(deployNeedsCache, function(path, module) {
                        this.addScript('bottom', deployNeedsCache[module]);
                    }, this);
                }
            } else {
                for (viewId in binderMap) {
                    if (binderMap.hasOwnProperty(viewId)) {
                        binder = binderMap[viewId];
                        for (module in binder.needs) {
                            if (binder.needs.hasOwnProperty(module)) {
                                if (!yuiJsUrlContains[module]) {
                                    this.addScript('bottom', binder.needs[module]);
                                }
                            }
                        }
                    }
                }
            }

            clientConfig.binderMap = binderMap;

            // TODO: [Issue 65] Split the app config in to server client
            // sections.
            // we need the app config on the client for log levels (at least)
            clientConfig.appConfig = clientConfig.store.appConfig;

            // this is mainly used by html5app
            pathToRoot = this.ac.http.getHeader('x-mojito-build-path-to-root');
            if (pathToRoot) {
                clientConfig.pathToRoot = pathToRoot;
            }

            // TODO -- decide if this is necessary, since
            // clientConfig.store.mojits is currently unpopulated
            /*
            for (type in clientConfig.store.mojits) {
                for (i in clientConfig.store.mojits[type].yui.sorted) {
                    module = clientConfig.store.mojits[type].yui.sorted[i];
                    path = clientConfig.store.mojits[type].yui.sortedPaths[
                        module];
                    this.scripts[path] = 'bottom';
                }
            }
            */

            routeMaker = new Y.mojito.RouteMaker(clientConfig.store.routes);
            clientConfig.routes = routeMaker.getComputedRoutes();
            delete clientConfig.store;

            initialModuleList = "'*'";
            if (useOnDemand) {
                initialModuleList = "'mojito-client'";
            }

            // optimize if possible
            // NOTE: only apply to "precomputed" for now
            if (deployRuntimeClientConfig.useCompression) {
                if (yuiConfig.base) {
                    deployRuntimeClientConfig.yuiConfigBase = yuiConfig.base;
                } else {
                    // TODO: cheaper way to get YUI "base" ?
                    deployRuntimeClientConfig.yuiConfigBase = (new Y.Loader({})).base;
                }
                // Y.log('yuiConfigBase: ' + yuiConfigBase, 'debug', NAME);
                clientConfig.deployRuntimeClient = {
                    optimized: compressBinders({
                        deployConfig: deployRuntimeClientConfig,
                        binderMap: binderMap
                    }),
                    yuiConfigBase: deployRuntimeClientConfig.yuiConfigBase
                };
                // remove any keys from clientConfig.appConfig as configured
                if (deployRuntimeClientConfig.exclude.length > 0) {
                    cleanseAppConfig({
                        appConfig: clientConfig.appConfig,
                        exclude: deployRuntimeClientConfig.exclude
                    });
                }
            }


            // Unicode escape the various strings in the config data to help
            // fight against possible script injection attacks.
            yuiConfigEscaped = Y.mojito.util.cleanse(yuiConfig);
            yuiConfigStr = Y.JSON.stringify(yuiConfigEscaped);
            clientConfigEscaped = Y.mojito.util.cleanse(clientConfig);
            clientConfigStr = Y.JSON.stringify(clientConfigEscaped);

            initializer = '<script type="text/javascript">\n' +
                '    YUI_config = ' + yuiConfigStr + ';\n' +
                '    YUI().use(' + initialModuleList + ', function(Y) {\n' +
                '    window.YMojito = { client: new Y.mojito.Client(' +
                clientConfigStr + ') };\n' +
                '        });\n' +
                '</script>\n';

            // Add all the scripts we have collected
            assetHandler.addAssets(
                this.getScripts(appConfigServer.embedJsFilesInHtmlFrame, urls)
            );
            // Add the boot script
            assetHandler.addAsset('blob', 'bottom', initializer);
        },


        addScript: function(position, path) {
            this.scripts[path] = position;
        },


        addScripts: function(position, modules) {
            var i;
            for (i in modules) {
                if (modules.hasOwnProperty(i)) {
                    this.scripts[modules[i].fullpath] = position;
                }
            }
        },


        /**
         * TODO: [Issue 66] This can be made faster with a single for
         * loop and caching.
         *
         * Note: A single SCRIPT tag containing all the JS on the pages is
         * slower than many SCRIPT tags (checked on iPad only).
         * @method getScripts
         * @private
         * @param {bool} embed Should returned scripts be embedded in script
         *     tags.
         * @param {object} urls Mapping of URLs to filesystem paths.  The keys
         *      are the URLs, and the values are the cooresponding filesystem
         *      paths.
         * @return {object} An object containing script descriptors.
         */
        getScripts: function(embed, urls) {
            var i,
                path,
                x,
                assets = {},
                blob = {
                    type: 'blob',
                    position: 'bottom',
                    content: ''
                };

            // Walk over the scripts and check what we can do
            for (i in this.scripts) {
                if (this.scripts.hasOwnProperty(i)) {
                    path = urls[i];
                    if (embed && path) {
                        this.scripts[i] = {
                            type: 'blob',
                            position: 'bottom',
                            content: '<script type="text/javascript">' +
                                minify(fs.readFileSync(path, 'utf8')) +
                                    '</script>'
                        };
                    } else {
                        this.scripts[i] = {
                            type: 'js',
                            position: this.scripts[i],
                            content: i
                        };
                    }
                }
            }


            // Convert the scripts to the Assets format
            for (x in this.scripts) {
                if (this.scripts.hasOwnProperty(x)) {
                    if (!assets[this.scripts[x].position]) {
                        assets[this.scripts[x].position] = {};
                    }
                    if (!assets[this.scripts[x].position][this.scripts[x].
                            type]) {
                        assets[this.scripts[x].position][this.scripts[x].
                                type] = [];
                    }
                    assets[this.scripts[x].position][this.scripts[x].type].push(
                        this.scripts[x].content
                    );
                }
            }

            return assets;
        },

        /**
         * for unit tests
         */
        sanitizeDeployRuntimeClientConfig: function(opts) {
            return sanitizeDeployRuntimeClientConfig(opts);
        },
        compressBinders: function(opts) {
            return compressBinders(opts);
        },
        dedupeBindersNeeds: function(opts) {
            return dedupeBindersNeeds(opts);
        },
        cleanseAppConfig: function(opts) {
            return cleanseAppConfig(opts);
        }
    };

    Y.namespace('mojito.addons.ac').deploy = Addon;

}, '0.1.0', {requires: [
    'mojito-loader',
    'mojito-util',
    'mojito-http-addon'
]});
