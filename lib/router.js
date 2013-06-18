/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE.txt file for terms.
 */

/*jslint nomen:true, node:true*/

/**
Attaches the Mojito specific router to the Express application instane.

Example usage:

    var express = require('express'),
        mojito = require('mojito'),
        app;

    app = express();
    ...
    app.use(mojito.attachRoutes());
    ...

@module mojito
@submodule router
@uses *debug, url, dispatcher
**/

"use strict";

var liburl = require('url'),
    debug = require('debug')('mojito:router'),
    dispatcher = require('./dispatcher');

function simpleMerge(to, from) {
    var p;
    for (p in from) {
        if (from.hasOwnProperty(p)) {
            if (!to[p]) {
                to[p] = from[p];
            }
        }
    }
    return to;
}

module.exports = {
    /**
     * Reads the `routes.json` configuration, and mounts the paths as express
     * routes.
     */
    attachRoutes: function () {
        var app = this._app, // express app
            mojito = app.mojito, // the mojito instance
            fn,
            name,
            route,
            routes,
            routesConfig,
            routeMaker,
            verb,
            RouteMakerClass;

        // debug('attachRoutes start');

        routesConfig = mojito.store.getRoutes();
        RouteMakerClass = mojito.Y.mojito.RouteMaker;
        routeMaker = new RouteMakerClass(routesConfig, true);

        // READ ONLY
        routes = routeMaker.getComputedRoutes();

        /**
         * Install a request handler for a given route
         *
         * @param {String} name name of the route based on `routes.json` config
         * @param {Object} route route configuration
         * @return {Function} express.middleware
         */
        function handler(name, route) {
            var routeName = name,
                routeObject = route;

            return function (req, res, next) {
                var call = [],
                    command = { instance: { } },
                    parsedUrl = liburl.parse(req.url, true),
                    pathname = parsedUrl.pathname,
                    query = parsedUrl.query,
                    routeMatch,
                    routeMerge,
                    url = req.url;

                // debug('matched route name [' + routeName + '] : ' + req.url);

                //

                // strip query string to do the matching and necessary
                // substitutions in route object
                if (url.indexOf('?') > -1) {
                    url = url.split('?')[0];
                }


                // Expand the `routeObject` regex properties based on current
                // request
                routeMatch = routeMaker.expand(url, req.method, routeObject);
                //

                // TODO: [Issue 93] check to see that there is not already
                // a command attached to req

                // at this point, no route found.
                if (!routeMatch) {
                    // TODO: should this be an error ?
                    // If there is no route, something went wrong here.
                    debug('No match found for route: ' + routeName);
                    return next();
                }

                if ('*.*' === route.call) {
                    routeMatch.call = routeMatch.query.module + '.' + routeMatch.query.action;
                }
                call[0] = routeMatch.call.split('.');
                call[1] = call[0].pop();
                call[0] = call[0].join('.');

                routeMatch.call = call;
                // debug('routeMatch: ' + require('util').inspect(routeMatch));


                //
                // If the route starts with an "@" it is a "type"
                if (routeMatch.call[0][0] !== '@') {
                    command.instance.base = routeMatch.call[0];
                } else {
                    command.instance.type = routeMatch.call[0].slice(1);
                }

                command.action = routeMatch.call[1];
                command.context = req.context;

                // routeMatch.param is converted to object in route-maker.common.js
                // and is never a string here. i.e. this assert always passes:
                // require('assert').ok(typeof routeMatch.param !== 'string');
                command.params = {
                    route: simpleMerge(routeMatch.query, routeMatch.params),
                    url: query || {},
                    body: req.body || {},
                    file: {} // FUTURE: add multi-part file data here
                };
                req.command = command;

                debug('dispatch cmd for url: ' + url);
                // debug('command: ' + require('util').inspect(command));

                mojito.dispatch(req, res, next);
            };
        }

        for (name in routes) {
            if (routes.hasOwnProperty(name)) {
                route = routes[name];
                for (verb in route.verbs) {
                    if (route.verbs.hasOwnProperty(verb)) {
                        // debug('instaling handler: [' + verb + '] ' + name);
                        verb = verb.toLowerCase();
                        app[verb](new RegExp(route.ext_match), handler(name, route));
                    }
                }
            }
        }

        // debug('attachRoutes end');
    }

};

