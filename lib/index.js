/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true*/

/**
 * The Mojito Server bootstrap
 * @module MojitoServer
 * @class MojitoServer
 * @constructor
 */

var MOJITO_MIDDLEWARE = [
        'mojito-handler-static',
        'mojito-parser-body',
        'mojito-parser-cookies',
        'mojito-contextualizer',
        'mojito-handler-tunnel',
        'mojito-router',
        'mojito-handler-dispatcher'
    ],
    CORE_YUI_MODULES = ['get', 'features', 'intl-base', 'mojito'],
    CORE_MOJITO_MODULES = ['mojito', 'mojito-route-maker'],

    MOJITO_INIT = new Date().getTime(),
    YUI = require('yui').YUI,
    serverLog = require('./server-log'),
    requestCounter = 0, // used to scope logs per request
    logger;

// TODO: [Issue 80] go back to connect?
var express = require('express'),
    OutputHandler = require('./output-handler.server'),
    libpath = require('path');

// The only global namespace within the framework code
// transaction counts (really session ID?)
/**
 */
global._mojito = {};


// This configures YUI with both the Mojito framework and all the
// YUI modules in the application.
function configureYUI(Y, store, load) {
    var shared,
        module;
    shared = store.yui.getConfigShared('server', {}, false);
    Y.applyConfig(shared);
    // also pre-load shared modules
    for (module in shared.modules) {
        if (shared.modules.hasOwnProperty(module)) {
            load.push(module);
        }
    }
}


// TODO: [Issue 81] try to make this not a function
var MojitoServer = function() {};

MojitoServer.prototype = {

    /* private properties */

    _logFormatter: null,

    _logPublisher: null,

    _logWriter: null,

    /* public interface */

    /**
     * Adds the Mojito framework to the Express application.
     *
     * You only need to call one of addMojitoToExpressApp() or createServer().
     * If you want to create your own Express app do that then use
     * addMojitoToExpressApp().  Otherwise Mojito can create an app for you
     * if you use createServer().
     *
     * @method addMojitoToExpressApp
     * @param {Object} app Express application.
     * @param {Object} options The directory to start the application in.
     */
    addMojitoToExpressApp: function(app, options) {

        var store,
            loader,
            Y,
            startupTime,
            appConfig,
            logConfig = {},
            middleware,
            m,
            midName,
            midBase,
            midPath,
            midFactory,
            hasMojito,
            midConfig,
            dispatcher;

        if (!options) {
            options = {};
        }
        if (!options.dir) {
            options.dir = process.cwd();
        }
        if (!options.context) {
            options.context = {};
        }

        // all logging that comes from YUI comes from here
        // We need to do this early, since creating a Y instance appears to copy
        // the function.
        YUI.applyConfig({ logFn: function(msg, lvl, src) {
            // translating YUI logs so they are categorized outside the rest
            // of Mojito's log levels
            var args = Array.prototype.slice.call(arguments);
            if (!this.mojito || src === 'yui' || src === 'loader' ||
                    src === 'get') {
                if ((!logger) && (!logConfig.yui)) {
                    return;
                }
                args[1] = 'YUI-' + lvl.toUpperCase();
            }
            if (logger) {
                logger.log.apply(logger, args);
            } else {
                console.log(serverLog.options.formatter(msg, lvl, src,
                    new Date().getTime(), serverLog.options));
            }
        }});

        Y = YUI({ core: CORE_YUI_MODULES, useSync: true });

        Y.applyConfig({
            modules: {
                'mojito-resource-store': {
                    fullpath: libpath.join(__dirname, 'store.server.js')
                }
            }
        });
        Y.applyConfig({ useSync: true });
        Y.use('mojito-resource-store');
        store = new Y.mojito.ResourceStore({
            root: options.dir,
            context: options.context,
            appConfig: options.appConfig
        });

        // share the resource store as a property of the application instance
        // (useful for the Mojito CLI)
        app.store = store;

        store.preload();
        appConfig = store.getAppConfig(null);

        // TODO: extract function
        if (appConfig.log && appConfig.log.server) {
            logConfig = appConfig.log.server;
            // attach custom formatter, writer, and publisher
            if (this._logFormatter) {
                logConfig.formatter = this._logFormatter;
            }
            if (this._logWriter) {
                logConfig.writer = this._logWriter;
            }
            if (this._logPublisher) {
                logConfig.publisher = this._logPublisher;
            }
        }

        // merge application log options over top defaults
        Object.keys(logConfig).forEach(function(k) {
            if (logConfig[k] !== undefined) {
                serverLog.options[k] = logConfig[k];
            }
        });

        configureYUI(Y, store, CORE_MOJITO_MODULES);

        // Load logger early so that we can plug it in before the other loading
        // happens.
        Y.applyConfig({ useSync: true });
        Y.use('mojito-logger');
        // TODO: extract function
        logger = new Y.mojito.Logger(serverLog.options);

        Y.applyConfig({ useSync: true });
        Y.use.apply(Y, CORE_MOJITO_MODULES);
        Y.applyConfig({ useSync: false });

        loader = new Y.mojito.Loader(appConfig);

        Y.mojito.perf.instrumentConnectApp(app);

        if (appConfig.middleware && appConfig.middleware.length) {
            hasMojito = false;
            for (m = 0; m < appConfig.middleware.length; m += 1) {
                midName = appConfig.middleware[m];
                if (0 === midName.indexOf('mojito-')) {
                    hasMojito = true;
                    break;
                }
            }
            if (hasMojito) {
                // User has specified at least one of mojito's middleware, so
                // we assume that they have specified all that they need.
                middleware = appConfig.middleware;
            } else {
                // backwards compatibility mode:
                //  middlware = user's, then mojito's
                middleware = [];
                for (m = 0; m < appConfig.middleware.length; m += 1) {
                    middleware.push(appConfig.middleware[m]);
                }
                for (m = 0; m < MOJITO_MIDDLEWARE.length; m += 1) {
                    middleware.push(MOJITO_MIDDLEWARE[m]);
                }
            }
        } else {
            middleware = MOJITO_MIDDLEWARE;
        }

        midConfig = {
            Y: Y,
            store: store,
            logger: logger,
            context: options.context
        };

        dispatcher = function(req, res, next) {
            // create a request-scoped logger for the dispatcher and output
            // handler, as well as for all Y.log executions during this request
            // TODO: Create instances of this conditionally
            logger = new Y.mojito.Logger(serverLog.options,
                requestCounter += 1);
            logger.log('request received', 'mojito', 'server');
            logger.log('request received', 'mojito', 'qeperf');

            var command = req.command,
                dispatcher,
                outputHandler = new OutputHandler(req, res, next);

            outputHandler.setLogger(logger);

            if (!command) {
                // this supports handlers after this one
                next();
                return;
                //error = new Error("Missing route for " + req.method + ' ' +
                //    req.url);
                //error.code = 404;
                //return outputHandler.error(error);
            }

            logger.log('START', 'mojito', 'server');

            // Pass the "Resource Store" by wrapping it with the adapter
            dispatcher = Y.mojito.Dispatcher.init(
                Y.mojito.ResourceStoreAdapter.init('server', store, logger),
                CORE_YUI_MODULES,
                logger,
                loader
            );

            try {
                dispatcher.dispatch(command, outputHandler);
            } catch (err) {
                if (!err.code) {
                    err.code = 500;
                }
                outputHandler.error(err);
            }
        };

        for (m = 0; m < middleware.length; m += 1) {
            midName = middleware[m];
            if (0 === midName.indexOf('mojito-')) {
                // one special one, since it might be difficult to move to a
                // separate file
                if (midName === 'mojito-handler-dispatcher') {
                    //console.log("======== MIDDLEWARE mojito -- " +
                    //    "builtin mojito-handler-dispatcher");
                    app.use(dispatcher);
                } else {
                    midPath = libpath.join(__dirname, 'app', 'middleware', midName);
                    //console.log("======== MIDDLEWARE mojito " + midPath);
                    midFactory = require(midPath);
                    // We assume the middleware is a factory function
                    // and pass in the following config object when
                    // calling said function.
                    //
                    // midConfig = {
                    //    Y: Y,
                    //    store: store,
                    //    logger: logger,
                    //    context: options.context
                    // };
                    app.use(midFactory(midConfig));
                }
            } else {
                // backwards-compatibility: user-provided middleware is
                // specified by path
                midPath = libpath.join(options.dir, midName);
                //console.log("======== MIDDLEWARE user " + midPath);
                midBase = libpath.basename(midPath);
                if (0 === midBase.indexOf('mojito-')) {
                    // Same as above (case of Mojito's special middlewares)
                    // Gives a user-provided middleware access to the YUI
                    // instance, resource store, logger, context, etc.
                    midFactory = require(midPath);
                    app.use(midFactory(midConfig));
                } else {
                    app.use(require(midPath));
                }
            }
        }

        // TODO: [Issue 82] The last middleware in the stack should be an
        // error handler

        startupTime = new Date().getTime() - MOJITO_INIT;
        logger.log('Mojito HTTP Server initialized in ' + startupTime + 'ms.');
    },

    /**
     * Creates an Express application with the Mojito framework already added.
     *
     * @method createServer
     * @param {Object} options Options for starting the app.
     * @return {Object} Express application.
     */
    createServer: function(options) {

        var app = express.createServer();

        this.addMojitoToExpressApp(app, options);

        return app;
    },

    setLogFormatter: function(formatter) {
        this._logFormatter = formatter;
    },
    setLogWriter: function(writer) {
        this._logWriter = writer;
    },
    setLogPublisher: function(publisher) {
        this._logPublisher = publisher;
    }
};


// TODO: [Issue 83] rethink how we are exporting stuff here. It is getting
// messy. Seems like this should not export an instance of the server with a
// bunch of extra stuff attached to it.

/**
 */
module.exports = new MojitoServer();

/**
 */
module.exports.constructor = MojitoServer; // for unit testing

/**
 * Surfaces the CLI.
 * @param {string} path The path used to locate resources.
 */
module.exports.include = function(path) {
    require('./' + path);
};
