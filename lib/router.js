/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE.txt file for terms.
 */

/*jslint nomen:true, node:true*/

/**
Attaches the Mojito specific router to the Express application instance.

Example usage:

    var libpath = require('path'),
        express = require('express'),
        mojito = require('mojito'),
        app;

    app = express();
    ...
    // or specify app specific paths (preferred)
    app.mojito.attachRoutes(libpath.resolve(__dirname, 'config', 'routes.json'));
    // or specify multiple paths
    app.mojito.attachRoutes([
        libpath.resolve(__dirname, 'config', 'routes01.json')
        libpath.resolve(__dirname, 'config', 'routes02.json')
    );
    ...
    // or let mojito to mount all routes defined in `routes.json`
    app.mojito.attachRoutes();
    ...

@module mojito
@submodule router
@uses *debug, url, dispatcher
**/

"use strict";

var libfs = require('fs'),
    libpath = require('path'),
    liburl = require('url'),
    libycb = require('ycb'),
    libyaml = require('js-yaml'),
    inspect = require('util').inspect, // for debug
    debug = require('debug')('mojito:router'),
    dispatcher = require('./dispatcher'),
    readConfig = require('./util').readConfig;


/**
Reads `routes` configuration either in JSON or YAML format.

@param {String} fullPath the absolute path to the config file
@return {Object} the parsed configuration
**/
function readConfigYCB(fullPath) {
    var obj,
        ycb,
        ycbDims = [{}];

    obj = readConfig(fullPath);
    obj = ycbDims.concat(obj);
    ycb = libycb.read(obj, {});

    return ycb;
}


/**
Normalizes the `routes.json` configuration.

@param {String} name 
@param {Object} route the route object from `routes.json`
@return {Object} normalized route object
**/
function buildRoute(name, route) {

    var i,
        verbObj;

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
        // Here we convert the verb array to a map for easy use later on
        verbObj = {};
        for (i in route.verbs) {
            if (route.verbs.hasOwnProperty(i)) {
                verbObj[route.verbs[i].toUpperCase()] = true;
            }
        }
        route.verbs = verbObj;
    }

    return route;
}

function getRoutes(fullPath) {
    var routes,
        name,
        out = {};

    routes = readConfigYCB(fullPath);
    for (name in routes) {
        if (routes.hasOwnProperty(name)) {
            out[name] = buildRoute(name, routes[name]);
        }
    }
    return out;
}

module.exports = {
    /**
    Only used for unit tests
    @protected
    **/
    readConfigYCB: readConfigYCB,


    /**
     Reads the `routes.json` configuration, and mounts the paths as express
     routes.

     If no `routesFiles` is specified, it will default to the following
     config files in this specific order:
     - `routes.yaml`
     - `routes.yml`
     - `route.json`

     These default files are assumed to be in application directory.

     @param {String|Array} routeFiles absolute paths to `routes.*` config
    **/
    attachRoutes: function (routesFiles) {
        var app = this._app, // express app
            mojito = app.mojito, // the mojito instance
            appRoot = mojito.options.root,
            args,
            routesConfig,
            routeMaker,
            RouteMakerClass;

        routesFiles = routesFiles || [
            libpath.resolve(appRoot, 'routes.json')
        ];
        if (!Array.isArray(routesFiles)) {
            routesFiles = [routesFiles];
        }

        /**
         * Returns a middleware function that will copy all `routes.params`
         * keys to `req.routeMatch.query`.
         *
         * NOTE: This is only supported for routes defined in `routes.json`.
         * This is marked as a deprecated feature and will be removed in the
         * near future.
         *
         * @param {Object} params the `params` property as defined in `routes`
         * configuration file.
         * @returns {Function} express middleware
         */
        function mid(params) {
            var o = params;

            return function (req, res, next) {
                var cloned,
                    k,
                    query;

                // TODO: find a more appropriate namespace for this
                req.routeMatch = req.routeMatch || {};
                req.routeMatch.query = req.routeMatch.query || {};
                query = req.routeMatch.query;

                // add the fixed params to the query object if they are not
                // there
                for (k in o) {
                    if (o.hasOwnProperty(k) && !query[k]) {
                        debug('copying params from routes configuration: %s', k);
                        query[k] = o[k];
                    }
                }

                return next();
            };
        }

        /**
         * @param {Object} routes the routes configuration
         */
        function registerRoutes(routes) {
            var name,
                route,
                verb;
            for (name in routes) {
                if (routes.hasOwnProperty(name)) {
                    route = routes[name];
                    for (verb in route.verbs) {
                        if (route.verbs.hasOwnProperty(verb)) {
                            debug('[%s %s] installing handler', name, route.path);
                            verb = verb.toLowerCase();

                            args = [route.path];

                            if (route.params) {
                                console.warn('** Deprecated ** [%s] route.params is a ' +
                                      'deprecated feature and will be removed ' +
                                      'in a future release.', name);
                                args.push(mid(route.params));
                            }

                            args.push(dispatcher.dispatch(route.call));

                            app[verb].apply(app, args);
                        }
                    }
                }
            }
        }

        routesFiles.forEach(function (routesFile) {
            debug('loading routes config: %s', routesFile);
            var routes = getRoutes(routesFile);
            registerRoutes(routes);
        });
    }

};

