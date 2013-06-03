/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp: true, nomen:true*/
/*global YUI*/


YUI.add('mojito-route-maker', function(Y, NAME) {

    var doCallReplacement,
        CACHE = { routes: {} }; // cache for _routes


    function wild(it) {
        // if {it}, then it is a wildcard
        if (it.indexOf('{') === 0) {
            // so return the true value without the {}
            return it.substring(1, it.length - 1);
        }
    }


    function resolveParams(route, params) {
        var tester = [];

        // we don't need to do anything if this route requires no params
        if (Y.Object.size(route.requires) === 0) {
            return route;
        }

        Y.Object.each(params, function(pval, pname) {
            if (route.requires && route.requires[pname]) {
                tester.push(pname + '=' + pval);
            }
        });

        if (tester.length) {
            tester.sort();
            if (new RegExp(route.int_match).test(tester.join('&'))) {
                Y.Object.each(params, function(pval, pname) {
                    route.query[pname] = pval;
                });
                return route;
            }
        }
    }


    function buildRoute(name, route) {

        var i,
            verbObj,
            path,
            matches,
            build,
            segment,
            key;

        if (!route.name) {
            route.name = name;
        }
        if (!route.verbs) {
            route.verbs = ['GET'];
        }

        // Checking route.verbs is changed from an array to an object by the
        // building process, so routes that have already been computed are
        // not recomputed.

        if (route.verbs.length && route.path && route.call) {
            if (!route.params) {
                route.params = {};
            }
            if (!route.regex) {
                route.regex = {};
            }
            if (!route.query) {
                route.query = {};
            }

            /*
             * Here we convert the verb array to a map for easy use later on
             **/
            verbObj = {};
            for (i in route.verbs) {
                if (route.verbs.hasOwnProperty(i)) {
                    verbObj[route.verbs[i].toUpperCase()] = true;
                }
            }
            route.verbs = verbObj;

            path = route.path.split('/');

            /*
             * Here we build the matching regex for external URI's
             */
            for (segment in path) {
                if (path.hasOwnProperty(segment)) {
                    if (path[segment][0] === ':') {
                        key = path[segment].substr(1);
                        route.query[key] = '';
                        path[segment] = route.regex[key] ?
                                '(' + route.regex[key] + ')' :
                                '([^\/]+)';
                    }

                    if (path[segment][0] === '*') {
                        path[segment] = '(.*)';
                    }
                }
            }

            /*
             * Here we build the matching regex for internal URI's
             */
            route.requires = {};
            matches = route.path.match(/:([^\/]+)/g);
            if (matches) {
                for (i = 0; i < matches.length; i += 1) {
                    route.requires[matches[i].substr(1)] = '[^&]+';
                }
            }
            for (i in route.regex) {
                if (route.regex.hasOwnProperty(i)) {
                    route.requires[i] = route.regex[i];
                }
            }

            if (typeof route.params !== 'object') {
                route.params = Y.QueryString.parse(String(route.params));
            }

            build = [];
            for (i in route.requires) {
                if (route.requires.hasOwnProperty(i)) {
                    build.push(i + '=' + route.requires[i]);
                }
            }
            build.sort();

            /*
             * We are done so lets store the regex's for the route.
             */
            // TODO: [Issue 74] These Regexes are recreated on
            // every request because they need to be serialized and sent to the
            // client, need to figure out a way to prevent that
            route.ext_match = '^' + path.join('\/') + '$';
            route.int_match = '^' + build.join('&') + '$';
        }

        return route;
    }


    doCallReplacement = function(route, uri) {
        var uriParts = uri.substr(1).split('\/'),
            pathParts = route.path.substr(1).split('\/'),
            template = {},
            cnt = 0;

        pathParts.forEach(function(pathPart) {
            var key,
                val,
                regex;

            // process only those keyed by ':'
            if (pathPart.indexOf(':') === 0) {
                key = pathPart.substr(1);
                val = uriParts[cnt];
                template[key] = val;
                regex = new RegExp('{' + key + '}', 'g');
                if (regex.test(route.call)) {
                    route.call = route.call.replace(regex, template[key]);
                } else {
                    route.params[key] = val;
                }
            }
            cnt += 1;
        });
        return route;
    };


    /*
     * The route maker for reverse URL lookup.
     * @class Maker
     * @namespace Y.mojito
     * @param {Object} routes key value store of all routes in the system
     * @param {Boolean} init if true, reset the routes cache
     */
    function Maker(routes, init) {
        var name;

        if (init) {
            CACHE.routes = {};
        }
        // TODO: [Issue 75] Cache these computed routes so we
        // don't have to do this on each request.
        for (name in routes) {
            if (routes.hasOwnProperty(name)) {
                if (!CACHE.routes[name]) {
                    CACHE.routes[name] = buildRoute(name, routes[name]);
                }
            }
        }
    }


    Maker.prototype = {

        /*
         * Generates a URL from a route query
         * @method make
         * @param {String} query string to convert to a URL
         * @param {String} verb http method
         * @param {Object} params object representing extra querystring
         *                        params. `query` might have querystring portion
         *                        portion, in which case they have priority.
         */
        make: function(query, verb, params) {
            // Y.log('make(' + query + ', ' + verb + ')', 'debug', NAME);

            var parts = query.split('?'),
                call = parts[0],
                residual = {},
                route,
                uri,
                k;

            params = params || {};

            // TODO: don't assign to a parameter.
            verb = verb || 'GET';

            if (parts[1]) {
                params = Y.QueryString.parse(parts[1]);
            }
            route = this._matchToExternal(call, params, verb, CACHE.routes);

            if (!route) {
                throw new Error(
                    "No route match found for '" + query + "' (" + verb + ')'
                );
            }

            uri = route.path;

            for (k in params) {
                if (params.hasOwnProperty(k)) {
                    if (route.query && route.query[k]) {
                        uri = uri.replace(':' + k, params[k]);
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
         * Finds a route for a given method+URL
         * @method find
         * @param {string} url the URL to find a route for.
         * @param {string} verb the HTTP method.
         */
        find: function(uri, verb) {
            // Y.log('[UriRouter] find( ' + uri + ', ' + verb + ' )');

            var route,
                match,
                ret,
                i,
                id;

            // TODO: don't assign to parameter.
            verb = verb || 'GET';

            route = this._matchToInternal(uri, verb, CACHE.routes);
            if (!route) {
                return null;
            }

            // Y.log('[UriRouter] found route: ' + JSON.stringify(route));

            // NOTE:  We used to copy() here. Research suggested that it was safe to drop.
            match = route;

            // Add the extracted URI params to the query obj
            ret = new RegExp(route.ext_match).exec(uri);
            i = 1;

            for (id in match.query) {
                if (match.query.hasOwnProperty(id)) {
                    match.query[id] = ret[i];
                    i += 1;
                }
            }

            // Add the fixed params to a query obj if they are not there
            for (i in match.params) {
                if (match.params.hasOwnProperty(i) && !match.query[i]) {
                    match.query[i] = match.params[i];
                }
            }

            return match;
        },


        /**
         * For optimization. Call this to get the computed routes that can be
         * passed to the constructor to avoid recomputing the routes.
         * @method getComputedRoutes
         * @return {object} computed routes.
         */
        getComputedRoutes: function() {
            // NOTE:  We used to copy() here. Research suggested that it was safe to drop.
            return CACHE.routes;
        },


        /**
         * Returns a matching route for the given URI
         * @method _matchToInternal
         * @param {string} uri The uri to find a route for.
         * @param {string} verb. The HTTP verb for the route.
         * @private
         */
        _matchToInternal: function(uri, verb, routes) {
            var name;

            // TODO: don't assign to a parameter.
            if (!verb) {
                verb = 'GET';
            }

            verb = verb.toUpperCase();

            // Y.log('[UriRouter] Start Matching ...');
            for (name in routes) {
                if (routes.hasOwnProperty(name)) {
                    // Y.log('[UriRouter] testing ' + name);

                    // TODO: [Issue 74] See comment elsewhere
                    // about regexes being created... we need to stash these
                    // objects somewhere instead of creating them on every
                    // request
                    if (new RegExp(routes[name].ext_match).test(uri) &&
                            routes[name].verbs &&
                            routes[name].verbs.hasOwnProperty(verb)) {

                        // TODO: [Issue 74] Prevent more Regex creations.
                        return doCallReplacement(Y.mojito.util.copy(routes[name]), uri);
                    }
                    // Y.log('[UriRouter] ' + verb + ' ' + uri + ' ' +
                    //     routes[name].ext_match);
                }
            }
            return false;
        },


        /*
         * @method _matchToExternal
         * @private
         */
        _matchToExternal: function(call, params, verb, routes) {
            var match,
                callParts = call.split('.'),
                callId = callParts[0],
                callAction = callParts[1];

            Y.Object.some(routes, function(route) {
                var routeCall,
                    routeId,
                    routeAction,
                    wildId,
                    wildAction;

                // it might be an exact match
                if (call === route.call && route.verbs[verb]) {
                    match = resolveParams(route, params);
                    if (match) {
                        return true;
                    }
                }

                // if we have a wild card try a match
                if ('*.*' === route.call && route.verbs[verb]) {
                    params.module = callId;
                    params.action = callAction;
                    match = resolveParams(route, params);
                    if (match) {
                        return true;
                    }
                }

                routeCall = route.call.split('.');
                routeId = routeCall[0];
                routeAction = routeCall[1];

                wildId = wild(routeId);
                if (wildId) {
                    params[wildId] = callId;
                }
                wildAction = wild(routeAction);
                if (wildAction) {
                    params[wildAction] = callAction;
                }

                // if action is wild, or action matches
                if ((wildAction || (callAction === routeAction)) &&
                        // and if id is wild, or id matches
                        ((wildId || (callId === routeId))) &&
                        // and if the verb is correct
                        route.verbs[verb]) {

                    // then we can try a param match
                    match = resolveParams(route, params);
                    if (match) {
                        return true;
                    }
                }
            });
            return match;
        }
    };

    Y.namespace('mojito').RouteMaker = Maker;

}, '0.1.0', {  requires: [
    'querystring-stringify-simple',
    'querystring-parse',
    'mojito-util'
]});
