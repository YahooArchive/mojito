/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/
/*global YUI*/


/**
 * @module ActionContextAddon
 */
YUI.add('mojito-url-addon', function(Y, NAME) {


    /**
     * <strong>Access point:</strong> <em>ac.url.*</em>
     * Generates URL's based on the applictions routing configuration
     * @class Url.common
     */
    function UrlAcAddon(command, adapter, ac) {
        this.context = command.context;
        this.rs = null;
        this.pathToRoot = ac.staticAppConfig.pathToRoot;
        this.maker =  null;
    }


    UrlAcAddon.prototype = {

        namespace: 'url',

        /**
         * Generates a URL from the given parameters
         * @method make
         * @param {string} base Base mojit defined at the root level of the
         *     Mojito application configuration.
         * @param {string} action Action reference, concatenated to the base
         *     using a period (.) separator.
         * @param {object} routeParams used to lookup the route in the routing
         *     table.
         * @param {string} varb GET, POST, PUT, DELETE (case insensitive).
         * @param {object} urlParams added to the looked up route as query
         *     params, this has priority over routeParams.
         */
        make: function(base, action, routeParams, verb, urlParams) {
            var url,
                key,
                params,
                query = base + '.' + action;

            params = Y.merge(routeParams || {});

            if (urlParams && Y.Lang.isObject(urlParams)) {
                // adding querystring params to routeParams and let
                // the url maker to create the proper url. Empty params
                // will be left out. TODO: why?
                for (key in urlParams) {
                    if (urlParams.hasOwnProperty(key) && urlParams[key]) {
                        params[key] = urlParams[key];
                    }
                }
            } else {
                Y.log('ac.url.make is expecting an object as urlParams instead of: ' + urlParams, 'warn', NAME);
            }

            url = this.getRouteMaker().make(query, verb, params);

            // IOS PATCH
            if (url && (typeof window !== 'undefined')) {
                url = Y.mojito.util.iOSUrl(url);
            }

            // this is mainly used by html5app
            if (url && this.pathToRoot) {
                url = this.pathToRoot + url;
            }

            return url;
        },


        /**
         * Finds the first matching route from the given URL
         * @method find
         * @param {string} url the URL to find a route for.
         * @param {string} verb the HTTP method.
         */
        find: function(url, verb) {

            // Remove http://some.domain.com/ stuff
            if (url.indexOf('http://') === 0) {
                url = url.slice(url.indexOf('/', 7));
            }

            // Remove an query params given
            if (url.indexOf('?') > 0) {
                url = url.slice(0, url.indexOf('?'));
            }

            return this.getRouteMaker().find(url, verb);
        },

        getRouteMaker: function() {
            if (!this.maker) {
                this.maker = new Y.mojito.RouteMaker(
                    this.rs.getRoutes(this.context)
                );
            }
            return this.maker;
        },

        /**
         * Storing a reference to the store.
         * @method setStore
         * @private
         * @param {ResourceStore} rs The resource store instance.
         */
        setStore: function(rs) {
            this.rs = rs;
        }

    };

    Y.namespace('mojito.addons.ac').url = UrlAcAddon;

}, '0.1.0', {requires: [
    'mojito-config-addon',
    'mojito-route-maker',
    'mojito-util'
]});
