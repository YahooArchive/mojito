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

    app.use(mojito.middleware()); 
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
    extend = require('./util').extend,
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
    Reads the `routes` configuration, and mounts the paths as express
    routes. Supported formats include YAML and JSON.

    If no `routesFiles` is specified, it will default to the following
    config files in the application directory, in this specific order:

    <ul>
      <li>`routes.yaml`</li>
      <li>`routes.yml`</li>
      <li>`route.json`</li>
    </ul>

    @param {String|Array} routeFiles optional absolute paths to `routes.*` 
    **/
    attachRoutes: function (routesFiles) {
        var app = this._app,     // express app
            mojito = app.mojito, // the mojito instance
            appRoot = mojito.options.root,
            routesConfig,
            routeMaker,
            RouteMakerClass;

        routesFiles = routesFiles || [
            libpath.join(appRoot, 'routes.json')
        ];
        if (!Array.isArray(routesFiles)) {
            routesFiles = [routesFiles];
        }

        /**
         * Returns express middleware function that will copy all `routes.params`
         * keys to `req.mojito.route.query`.
         *
         * NOTE: This is only supported for routes defined in `routes.json`.
         * This is marked as a deprecated feature and will be removed in the
         * near future.
         *
         * @param {Object} params the `params` property as defined in `routes`
         * configuration file.
         * @returns {Function} express middleware
         */
        // function mid(params) {
        //     var o = params;

        //     return function (req, res, next) {
        //         var cloned,
        //             k,
        //             query = {},
        //             route;

        //         req.mojito = req.mojito || {};
        //         req.mojito.route = req.mojito.route || {};
        //         route = req.mojito.route;

        //         route.query = route.query || {};
        //         // add the fixed params to the query object if they are not
        //         // there
        //         for (k in o) {
        //             if (o.hasOwnProperty(k) && !query[k]) {
        //                 debug('copying params from routes configuration: %s', k);
        //                 query[k] = o[k];
        //             }
        //         }

        //         extend(route.query, query);

        //         return next();
        //     };
        // }

        /**
         * Adds a route for handlng tunnel requests from clients
         */
        function registerTunnelRpc() {
            var appConfig,
                dimPath,
                store = mojito.store;

            // This might be a potential use case for locator to provide 
            // an alternative "sync" api for specific use during app startup

            // TODO: how to deal with async locator ? 
            // HACK: this is a quick way to access appConfig
            appConfig = store.getStaticAppConfig();
            debug('[tunnelProxy %s] installing handler', appConfig.tunnelPrefix);
            app.post(appConfig.tunnelPrefix, dispatcher.handleRequest);
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

                            // Removed support for route.params
                            // Will delete code after next review
                            // if (route.params) {
                            //     // register mid()
                            // }
                            app[verb](route.path, dispatcher.dispatch(route.call));
                        }
                    }
                }
            }
        }

        registerTunnelRpc();

        routesFiles.forEach(function (routesFile) {
            debug('loading routes config: %s', routesFile);
            var routes = getRoutes(routesFile);
            registerRoutes(routes);
        });

    }

};

