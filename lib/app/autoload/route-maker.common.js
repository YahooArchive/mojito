/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp: true, nomen:true*/
/*global YUI,console*/

YUI.add('mojito-route-maker', function (Y, NAME) {

    var CACHE = { routes: { }, computedRoutes: { } };

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

        // straight match if no keys
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
    Given a uri, extract the route parametrized paths and store in the
    `route.annotation.dispatch.params` annotation.

    @method doCallReplacement
    @private
    @param {Object} route
    @param {String} uri
    **/
    function doCallReplacement(route, uri) {
        var uriParts = uri.split('/'),
            pathParts = route.path.split('/'),
            index = 0,
            // route.annotations is set in dispatcher.js
            params = route.annotations.dispatch.params;

        Y.Array.each(pathParts, function (pathPart) {
            var key,
                val;

            if (pathPart.indexOf(':') === 0) {
                key = pathPart.substr(1);
                val = uriParts[index];

                params[key] = val;
            }
            index = index + 1;
        });
        return route;
    }

    /**
    Convert a single route from express format to the "old" mojito format
    for BC.

    @method convertAppRoute
    @private
    @param {Object} appRoute routes object from express
    @return {Object}
    **/
    function convertAppRoute(route) {
        var annotations = route.annotations,
            dispatch = annotations.dispatch,
            name = annotations.name,
            template = {},
            verb = route.method.toUpperCase(),
            verbs = {};

        verbs[verb] = true;

        if (!name) {
            // for the name to be unique per route entry
            name = route.path + '.' + (dispatch && dispatch.call);
            Y.log('route path "' + route.path + '" is not named. set to "' + name + '"', 'warn', NAME);
        }

        template = {
            path: route.path,
            call: dispatch && dispatch.call,
            name: name,
            verbs: verbs,
            params: dispatch.params,
            regex: {},
            ext_match: route.regexp,
            annotations: annotations
        };

        return template;
    }

    /**
    Convert the routes configuration to "old" Mojito format for BC.

    @method convertAppRoutes
    @protected
    @param {Object} appRoutes routes object from express
    @return {Object}
    **/
    function convertAppRoutes(appRoutes) {
        var methods = ['get', 'post'],
            template = {};

        Y.Array.each(methods, function (method) {
            var routes,
                route;
            routes = appRoutes[method];
            if (routes && routes.length > 0) {
                Y.Array.each(routes, function (route) {
                    var r;

                    r = convertAppRoute(route);
                    template[r.name] = r;
                });
            }
        });

        return template;
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
            CACHE.computedRoutes = {};
        }

        CACHE.routes = routes;
    }

    Maker.prototype = {
        // For unit tests only
        // DO NOT USE
        _doCallReplacement: doCallReplacement,
        _resolveParams: resolveParams,
        _convertAppRoute: convertAppRoute,
        _convertAppRoutes: convertAppRoutes,
        //

        /**
        Return the matching route based on the `call` parameter, which is
        of the following format: callId.callAction

        Example usage:

            var route = _lookupRouteForCall("admin.help", {foo: 'bar'}, 'get', {xxx});

        @method _lookupRouteForCall
        @protected
        @param {String} call
        @param {Object} params
        @param {String} verb `get`|`post`| ...
        @param {Object} routes the routes object from express annotated
        @return {Object} the matching route, otherwise falsy
        **/
        _lookupRouteForCall: function (call, params, verb, routes) {
            var match,
                matches;

            params = params || {};
            matches = routes[verb];

            if (!matches || matches.length === 0) {
                Y.log("no match found for '" + call + "' (" + verb + ")", 'debug', NAME);
                return false;
            }

            Y.Array.some(matches, function (route) {

                if (call === route.dispatch.call) {
                    match = resolveParams(route, params);
                    if (match) {
                        // Y.log('match found for call: ' + call, 'debug', NAME);
                        return true;
                    }
                }

                // skip to next one
                return false;
            });

            return match;
        },

        /**
        Lookup a route configuration given a URI and a VERB.

        @method _lookupRouteForURI
        @protected
        @param {String} uri
        @param {String} verb
        @param {Object} routes
        @return {Object|null}
        **/
        _lookupRouteForURI: function (uri, verb, routes) {
            var match,
                matches,
                copy;

            matches = routes[verb];
            if (!matches) {
                Y.log("no match found for '" + uri + "' (" + verb + ")", 'debug', NAME);
                return false;
            }

            Y.Array.some(matches, function (route) {
                if (route.regexp.test(uri)) {
                    if (route.path.indexOf(':') > -1) {
                        // route.annotations is not enumerable
                        copy = Y.mojito.util.copy(route);
                        copy.annotations = Y.mojito.util.copy(route.annotations);
                        route = doCallReplacement(copy, uri);
                        // route = doCallReplacement(Y.mojito.util.copy(route), uri);
                    }
                    match = route;
                    return true;
                }
            });

            return match;
        },

        /**
        Generates a URL from a route query
        @method make
        @param {String} query string to convert to a URL
        @param {String} verb http method
        @param {Object} params object representing extra querystring
                               params. `query` might have querystring portion
                               portion, in which case they have priority.
        @return {String} the generated path uri for the query, or null
        **/
        make: function(query, verb, params) {
            // Y.log('make(' + query + ', ' + verb + ')', 'debug', NAME);
            var my = this,
                parts = query.split('?'),
                call = parts[0],
                residual = {},
                i,
                k,
                keys,
                paramKeys,
                route,
                uri;

            verb = (verb && verb.toLowerCase()) || 'get';
            params = params || {};

            if (parts[1]) {
                params = Y.QueryString.parse(parts[1]);
            }

            route = my._lookupRouteForCall(call, params, verb, CACHE.routes);

            if (!route) {
                Y.log("No route match found for '" + query + "' (" + verb + ")",
                      'error', NAME);
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
                        // Y.log('---- replacing key : ' + k + '; uri = ' + uri, 'debug', NAME);
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
        Finds a route for a given uri and verb.

        @method find
        @public
        @param {string} url the URL to find a route for.
        @param {string} verb the HTTP method.
        @return {Object} the route object
        **/
        find: function(uri, verb) {
            var my = this,
                route;

            // Y.log('[UriRouter] find( ' + uri + ', ' + verb + ' )');

            verb = (verb && verb.toLowerCase()) || 'get';

            route = my._lookupRouteForURI(uri, verb, CACHE.routes);

            if (!route) {
                return null;
            }

            // for BC
            return convertAppRoute(route);
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

            Y.log('The old Mojito route format is deprecated and will' +
                  'change in the next version.', 'warn', NAME);
            if (Object.keys(CACHE.computedRoutes).length === 0) {
                // for BC
                CACHE.computedRoutes = convertAppRoutes(CACHE.routes);
            }
            return CACHE.computedRoutes;
        }
    };

    Y.namespace('mojito').RouteMaker = Maker;

}, '0.1.0', {  requires: [
    'querystring-stringify-simple',
    'querystring-parse',
    'mojito-util'
]});

