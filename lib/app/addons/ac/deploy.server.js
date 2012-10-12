/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node: true*/
/*global YUI*/


/**
 * @module ActionContextAddon
 */
YUI.add('mojito-deploy-addon', function(Y, NAME) {

    'use strict';

    var fs = require('fs');

    /**
     * <strong>Access point:</strong> <em>ac.deploy.*</em>
     * Provides ability to create client runtime deployment HTML
     * @class Deploy.server
     */
    function Addon(command, adapter, ac) {
        this.instance = command.instance;
        this.scripts = {};
        this.ac = ac;
        this.rs = null;
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
                yuiConfigEscaped,
                yuiConfigStr,
                viewId,
                i,
                clientConfig = {},
                clientConfigEscaped,
                clientConfigStr,
                initialModuleList = {},
                initializer, // script for YUI initialization
                pathToRoot;

            contextClient = Y.mojito.util.copy(contextServer);
            contextClient.runtime = 'client';
            appConfigClient = store.getAppConfig(contextClient);
            clientConfig.context = contextClient;

            yuiConfig = Y.merge({

                fetchCSS: true,
                combine: true,
                base: "/combo?",
                comboBase: "/combo?",
                root: "",
                url: "/combo?yui-base/yui-base.js&loader-base/loader-base.js&" +
                    "loader-app-base{langPath}.js"

            }, ((appConfigClient.yui && appConfigClient.yui.config) || {}), {
                lang: contextServer.lang // same as contextClient.lang
            });

            // adjusting the url based on {langPath} to facilitate
            // the customization of the combo url.
            yuiConfig.url = yuiConfig.url.replace('{langPath}',
                (contextServer.lang ? '_' + contextServer.lang : ''));

            clientConfig.store = store.serializeClientStore(contextClient);

            // Set the YUI URL to use on the client (This has to be done
            // before any other scripts are added)
            assetHandler.addAsset('js', 'top', yuiConfig.url);

            // adding the default module for the Y.use statement in the client
            initialModuleList['mojito-client'] = true;

            // add binders' dependencies
            for (viewId in binderMap) {
                if (binderMap.hasOwnProperty(viewId)) {
                    if (binderMap[viewId].name) {
                        initialModuleList[binderMap[viewId].name] = true;
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

            clientConfig.routes = this.ac.url.getRouteMaker().getComputedRoutes();
            delete clientConfig.store;

            // Unicode escape the various strings in the config data to help
            // fight against possible script injection attacks.
            yuiConfigEscaped = Y.mojito.util.cleanse(yuiConfig);
            yuiConfigStr = JSON.stringify(yuiConfigEscaped);
            clientConfigEscaped = Y.mojito.util.cleanse(clientConfig);
            clientConfigStr = JSON.stringify(clientConfigEscaped);

            initialModuleList = "'" + Y.Object.keys(initialModuleList).join("','") + "'";

            initializer = '<script type="text/javascript">\n' +
                '    YUI.applyConfig(' + yuiConfigStr + ');\n' +
                '    YUI().use(' + initialModuleList + ', function(Y) {\n' +
                '    window.YMojito = { client: new Y.mojito.Client(' +
                clientConfigStr + ') };\n' +
                '        });\n' +
                '</script>\n';

            // Add the boot script
            assetHandler.addAsset('blob', 'bottom', initializer);
        }

    };

    Y.namespace('mojito.addons.ac').deploy = Addon;

}, '0.1.0', {requires: [
    'mojito-util',
    'mojito-http-addon',
    'mojito-url-addon'
]});
