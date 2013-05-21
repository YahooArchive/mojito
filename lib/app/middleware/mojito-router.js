/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint nomen:true, node:true*/

/**
@module moijto-router
**/

'use strict';



var debug = require('debug')('mojito:middleware:router'),
    liburl = require('url'),
    RX_END_SLASHES = /\/+$/,
    NAME = 'UriRouter';

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


/**
The Routing component of Mojito.

@class MojitoRouter
@param {Object} store The resource store for the router to use.
@constructor
@private
**/
function Router() {
}


Router.prototype = {

    handle: function () {

        var my = this,
            Y,
            store,
            routes,
            routeMaker,
            RouteMakerClass;

        return function (req, res, next) {
            var app = req.app,
                command = { instance: { } },
                parsedUrl = liburl.parse(req.url, true),
                pathname = parsedUrl.pathname,
                query = parsedUrl.query,
                url = req.url,
                routeMatch,
                routeMerge;

            if (!store && app.mojito) {
                store = app.mojito.store;
                Y = app.mojito.Y;
                RouteMakerClass = Y.mojito.RouteMaker;
                // Routes are no longer contextualized. Using the base context.
                routes = store.getRoutes(app.mojito.context);
                routeMaker = new RouteMakerClass(routes);
            }

            if (req.url.lastIndexOf('//') > -1) {
                url = req.url.replace(RX_END_SLASHES, '/');
            }
            routeMatch = my.getRoute(req.method, pathname, routeMaker);

            // TODO: [Issue 93] Check to see that there is not
            // already a command attached to req


            // at this point if we haven't found a route, get out
            if (!routeMatch) {
                // debug('Match fail');
                return next();
            }

            if (routeMatch.call[0][0] !== '@') {
                // Otherwise it is "instance"
                command.instance.base = routeMatch.call[0];
            } else {
                // If the route starts with an "@" it is a "type"
                command.instance.type = routeMatch.call[0].slice(1);
            }

            command.action = routeMatch.call[1];
            // TODO: [Issue 95] attach action to command instead
            // of instance
            // command.action = routeMatch.call[1];
            command.context = req.context;

            //routeMatch.param is converted to object in route-maker.common.js
            //and is never a string here. i.e. this assert always passes:
            //require('assert').ok(typeof routeMatch.param !== 'string');
            command.params = {
                route: simpleMerge(routeMatch.query, routeMatch.params),
                url: query || {},
                body: req.body || {},
                file: {} // FUTURE: add multi-part file data here
            };

            // attach the command to the route for the Mojito handler to process
            req.command = command;
            next();
        };

    },

    /**
    Finds a route for a given method+URL
    
    @method getRoute
    @param {string} method The HTTP method.
    @param {string} url The URL to find a route for.
    @param {RouteMaker} routeMaker The route maker.
    @return {Object} The route.
    **/
    getRoute: function (method, url, routeMaker) {

        // debug('routing ' + method + ' ' + url);
        var name, route, call = [];

        // strip query string
        if (url.indexOf('?') > -1) {
            url = url.split('?')[0];
        }
        route = routeMaker.find(url, method);

        if (!route) {
            return null;
        }

        if ('*.*' === route.call) {
            route.call = route.query.module + '.' + route.query.action;
        }

        call[0] = route.call.split('.');
        call[1] = call[0].pop();
        call[0] = call[0].join('.');

        route.call = call;

        // This code does not know what Mojito is so just return the route.
        return route;
    }

};


/**
 * Export a function capable of building a viable router.
 * @param {Object} config Data to configure the router.
 * @return {Object} The newly constructed router.
 */
module.exports = function (config) {
    var router = new Router();
    module.exports.getRoute = router.getRoute;

    return router.handle();
};


