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
    YUI = require('yui').YUI,
    Y = YUI(), // TODO: find a simpler way to access Y.mix
    debug = require('debug')('mojito:router'),
    dispatcher = require('./dispatcher');

/**
Reads `routes` configuration either in JSON or YAML format.

@param {String} fullPath the absolute path to the config file
@return {Object} the parsed configuration
**/
function readConfigYCB(fullPath) {
    var raw,
        obj,
        ycb,
        ycbDims = [{}];

    try {
        raw = libfs.readFileSync(fullPath, 'utf8');

        if (/\.json$/.test(fullPath)) {
            obj = JSON.parse(raw);
        } else {
            obj = libyaml.load(raw);
        }
    } catch (err) {
        if (err.errno !== 34) {
            // fatal error, cannot load routes.
            throw new Error("Error parsing file: " + fullPath + "\n" + err);
        }
    }
    if (!obj) {
        obj = {};
    }
    obj = ycbDims.concat(obj);
    ycb = libycb.read(obj, {});

    return ycb;
}

/**
Given a list of routesFiles, iterate through and merge.

@param {Array} routesFiles
@return {Object} the merged routes configurations
**/
function getRoutes(routesFiles) {
    var p,
        path,
        routes,
        out = {};

    routesFiles = routesFiles || [];

    for (p = 0; p < routesFiles.length; p += 1) {
        path = routesFiles[p];
        // relative paths are relative to the application
        routes = readConfigYCB(path, {});
        Y.mix(out, routes, true);
    }

    return out;
}

module.exports = {
    /**
    Only used for unit tests
    @protected
    **/
    getRoutes: getRoutes,
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
            fn,
            name,
            route,
            routes,
            routesConfig,
            routeMaker,
            verb,
            RouteMakerClass;

        routesFiles = routesFiles || [
            libpath.resolve(appRoot, 'routes.yaml'),
            libpath.resolve(appRoot, 'routes.yml'),
            libpath.resolve(appRoot, 'routes.json')
        ];
        if (!Array.isArray(routesFiles)) {
            routesFiles = [routesFiles];
        }
        routesConfig = getRoutes(routesFiles);
        RouteMakerClass = mojito.Y.mojito.RouteMaker;
        routeMaker = new RouteMakerClass(routesConfig, true);
        routes = routeMaker.getComputedRoutes(); // read only

        for (name in routes) {
            if (routes.hasOwnProperty(name)) {
                route = routes[name];
                for (verb in route.verbs) {
                    if (route.verbs.hasOwnProperty(verb)) {
                        debug('installing handler: [' + verb + '] ' + name);
                        verb = verb.toLowerCase();

                        // TODO: if (route.params) ...
                        // TODO: if (route.query) ...

                        app[verb](route.path, dispatcher.dispatch(route));
                    }
                }
            }
        }
    }

};

