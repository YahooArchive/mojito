/**
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint nomen:true, node:true*/

/**
Submodule used by mojito to configure and intialized middleware.

Because the middleware registration now supports lazy init, those can be 
decoupled from the main module.

By default, Mojito does not add its built-in middleware, in case the
application would like to need customization. Users have to explicity
request Mojito to add them.

If `application.json` has any app specific middleware, those are added before
Mojito's built-in ones.

Usage:

    app.use(mojito.middleware());

If the application want complete controll over the order in which
middleware are executed by Mojito, the recommended approach is to register 
middleware in `app.js` via `app.use()` instead.

For example for using a custom error handler:

    app.use(mojito.middleware['mojito-handler-static']);
    app.use(mojito.middleware['mojito-contextualizer']);
    app.use(mojito.middleware['mojito-router']);
    app.use(mojito.middleware['mojito-handler-dispatcher']);
    app.use(require('./middleware/my-error-handler')());

For application specific middleware, the `module.exports` object should 
return a function that matches the `express` middleware signature.

For example:

    // my-middleware.js
    module.exports = function () {
        return function (req, res, next) {
            // ...
        };
    };

@module mojito
@submodule middleware
**/

'use strict';

var debug = require('debug')('mojito:middleware'),
    libpath = require('path'),
    MOJITO_MIDDLEWARE;

/**
An ordered list of the middleware module names to load for a standard Mojito
server instance.
@type Array
**/
MOJITO_MIDDLEWARE = [
    'mojito-handler-static',
    'mojito-parser-body',
    'mojito-parser-cookies',
    'mojito-contextualizer',
    'mojito-handler-tunnel',
    'mojito-router',
    'mojito-handler-dispatcher',
    'mojito-handler-error'
];


/**
Registers the default middleware that ships with Mojito.

The most common usage is:

    var express = require('express'),
        mojito = require('mojito'),
        app;

    app = express();
    app.use(mojito.middleware());
    ....
    // or to use a specific Mojito middleware
    // app.use(mojito.middleware['mojito-handler-static']);

@method middleware 
@public
@return {Function} middleware
**/
function middleware() {

    var staticCache,
        store;

    /**
    @param {Object} mojito mojito instance
    **/
    function composeHandlers(mojito) {
        var handlers = [],
            mm,
            mid,
            appDir,    // app root directory
            appConfig; // base application config


        store = mojito.store;
        appConfig = store.getStaticAppConfig();

        if (appConfig.middleware && appConfig.middleware.length > 0) {
            debug('loading app specific middleware first');
            // TODO: this path should come from `app.js` and/or `locator`.
            // Revisit after `locator` integration.
            appDir = mojito.options.root;
            mm = [].concat(appConfig.middleware).concat(MOJITO_MIDDLEWARE);
        } else {
            mm = [].concat(MOJITO_MIDDLEWARE);
        }

        mm.forEach(function (m) {
            if (MOJITO_MIDDLEWARE.indexOf(m) > -1) {
                handlers.push(middleware[m]);
            } else {
                mid  = libpath.join(appDir, m);
                mid = require(mid);
                handlers.push(mid());
            }
            debug('adding middleware %s to be exec', m);
        });

        return handlers;
    }

    return function (req, res, next) {
        var handlers = staticCache;

        function run(index) {
            if (handlers && index < handlers.length) {
                handlers[index](req, res, function (err) {
                    if (err) {
                        return next(err);
                    }
                    index = index + 1;
                    run(index);
                });
            } else {
                next();
            }
        }

        if (!store && req.app && req.app.mojito) {
            handlers = staticCache = composeHandlers(req.app.mojito);
        }

        run(0);
    };
}


(function expose() {
    var m,
        midName,
        midPath,
        midFactory,
        fn = middleware,
        list = [].concat(MOJITO_MIDDLEWARE);


    for (m = 0; m < list.length; m = m + 1) {
        midName = list[m];
        try {
            midFactory = require(midName);
        } catch (e1) {
            try {
                midPath = libpath.join(__dirname, 'app', 'middleware', midName);
                midFactory = require(midPath);
            } catch (e2) {
                midFactory = null;
                throw new Error('failed to attach middleware: ' + midName);
            }
        }
        if (midFactory) {
            debug('attach mid %s to middleware', midName);
            fn[midName] = midFactory();
        }
    }
}());

exports = module.exports = {
    middleware: middleware
};
