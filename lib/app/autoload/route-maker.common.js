/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp: true, nomen:true*/
/*global YUI,console*/

YUI.add('mojito-route-maker', function (Y, NAME) {

    var CACHE = { routes: {} };

    /**
    Given a route with parametrized variable, this function will attempt to
    resolve it based on a set of parameters.

    @method resolveParams
    @private
    @param {Object} route
    @param {Object} params
    @return {Object|null} the route if there is a match, otherwise null
    **/
    function resolveParams(route, params) {
        var keys = route.keys,
            len = keys.length,
            i;

        if (len === 0) {
            return route;
        }

        for (i = 0; i < len; i = i + 1) {
            if (!params[keys[i].name]) {
                return null;
            }
        }

        return route;
    }

    /**
    Given a uri, extract the route parametrized paths and store in `route.params`.

    @method resolveRouteParams
    @private
    @param {Object} route
    @param {String} uri
    **/
    function resolveRouteParams(route, uri) {
        var uriParts = uri.split('/'),
            pathParts = route.path.split('/'),
            index = 0,
            params;

        Y.Array.each(pathParts, function (pathPart) {
            var key,
                val;

            if (pathPart.indexOf(':') === 0) {
                key = pathPart.substr(1);
                val = uriParts[index];

                if (!params) {
                    route.params = route.params || {};
                    params = route.params;
                }
                params[key] = val;
            }
            index = index + 1;
        });
        return route;
    }


    /**
    @class Maker
    @namespace Y.mojito
    @param {Object} routes routes configuration 
    @param {Boolean} init if true, reset the routes cache
    **/
    function Maker(routes, init) {

        if (init) {
            CACHE.routes = {};
        }

        CACHE.routes = routes;
    }

    Maker.prototype = {
        // For unit tests only
        // DO NOT USE
        _doCallReplacement: resolveRouteParams,
        _resolveParams: resolveParams,
        //

        /**
        Returns the matching route path based on the route name.

        @method linkTo
        @param {String} name
        @return {String|null} path
        **/
        linkTo: function(name) {
            // TODO How can we leverage express-map#pathTo ?
            // return (CACHE.routes[name] && CACHE.routes[name].path) || null;
            return null;
        },

        /**
        Generates a URL from a route query

        NOTE: Adding query string to "query" (e.g. "foo.index?src=dot") is 
              deprecated feature.

        @method make
        @param {String} query string to convert to a URL
        @param {String} verb http method
        @param {Object} params object representing extra querystring
                               params. `query` might have querystring portion
                               portion, in which case they have priority.
        @return {String} the generated path uri for the query, or null
        **/
        make: function(query, verb, params) {
            var parts = query.split('?'),
                call = parts[0],
                residual = {},
                i,
                k,
                key,
                keys,
                paramKeys,
                route,
                uri;

            query = query || '';
            verb = verb || 'get';
            params = params || {};

            if (parts[1]) {
                params = Y.QueryString.parse(parts[1]);
            }

            key = Y.mojito.util.encodeRouteName(verb, call);
            // Y.log('Lookup key: ' + key, 'debug', NAME);
            route = CACHE.routes[key];

            if (!route) {
                return null;
            }

            // Check that the params is applicable to the route
            route = resolveParams(route, params);
            if (!route) {
                return null;
            }

            uri = route.path;

            keys = [];
            Y.Array.each(route.keys, function (key) {
                keys.push(key.name);
            });
            paramKeys = Y.Object.keys(params).sort();
            // Y.log('---- paramKeys: ' + paramKeys, 'debug', NAME);

            // handle left over params by appending them to query string
            for (i = paramKeys.length - 1; i >= 0; i = i - 1) {
                k = paramKeys[i];
                if (params.hasOwnProperty(k)) {
                    if (keys.indexOf(k) > -1) {
                        uri = uri.replace(':' + k, params[k]);
                        // Y.log('---- replacing key : ' + k + '; uri = ' + uri,
                        //       'debug', NAME);
                    } else {
                        residual[k] = params[k];
                    }
                }
            }

            if (!Y.Object.isEmpty(residual)) {
                uri += '?' + Y.QueryString.stringify(residual);
            }

            return uri;
        },

        /**
         * For optimization. Call this to get the computed routes that can be
         * passed to the constructor to avoid recomputing the routes.
         *
         * @method getComputedRoutes
         * @return {object} computed routes.
         */
        getComputedRoutes: function() {
            // NOTE: We used to copy() here. Research suggested that it was
            // safe to drop.

            return CACHE.routes;
        }
    };

    Y.namespace('mojito').RouteMaker = Maker;

}, '0.1.0', {  requires: [
    'querystring-stringify-simple',
    'querystring-parse',
    'mojito-util'
]});

