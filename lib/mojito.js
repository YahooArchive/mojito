/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true*/

'use strict';

//  ----------------------------------------------------------------------------
//  Prerequisites
//  ----------------------------------------------------------------------------


var express = require('express'), // TODO: [Issue 80] go back to connect?
    http = require('http'),
    store = require('./store'),
    OutputHandler = require('./output-handler.server'),
    libpath = require('path'),
    requestCounter = 0, // used to scope logs per request
    Mojito;

//  ----------------------------------------------------------------------------
//  Mojito Global
//  ----------------------------------------------------------------------------


/**
 * Shared global object, which isn't named 'mojito' because 'mojito' is a module
 * name defined in mojito.common.js and required via Y.use.
 */
// TODO: Merge what we put on this object with the 'mojito' module/namespace.
global._mojito = {};


//  ----------------------------------------------------------------------------
//  MojitoServer
//  ----------------------------------------------------------------------------


/**
 * The primary Mojito server type. Invoking the constructor returns an instance
 * which is not yet running. Use listen to run the server once you have made
 * any adjustments to its configuration.
 * @param {{port: number,
 *          dir: string,
 *          context: Object,
 *          appConfig: Object,
 *          verbose: boolean}} options An object containing server options. The
 *          default port is process.env.PORT or port 8666 if no port is given.
 *          Verbose is false by default. Dir is cwd() by default. Both the
 *          context and appConfig will default to empty objects.
 * @constructor
 * @return {MojitoServer}
 */
function MojitoServer(options) {
    var appConfig;

    this._options = options || {};
    this._options.port = this._options.port || process.env.PORT || 8666;
    this._options.dir = this._options.dir || process.cwd();
    this._options.context = this._options.context || {};
    this._options.mojitoRoot = __dirname;

    // TODO: Note we could pass some options to the express server instance.
    this._app = express.createServer();

    appConfig = store.getAppConfig(this._options.dir, this._options.context);
    this._options.Y = this._createYUIInstance(this._options, appConfig);
    this._configureLogger(this._options.Y);
    this._app.store = store.createStore(this._options);
    this._configureAppInstance(this._app, this._options, appConfig);
    this._app.store.optimizeForEnvironment();

    return this;
}


//  ---------
//  Constants
//  ---------

/**
 * An ordered list of the middleware module names to load for a standard Mojito
 * server instance.
 * @type {Array.<string>}
 */
MojitoServer.MOJITO_MIDDLEWARE = [
    'mojito-handler-static',
    'mojito-parser-body',
    'mojito-parser-cookies',
    'mojito-contextualizer',
    'mojito-handler-tunnel',
    'mojito-router',
    'mojito-handler-dispatcher',
    'mojito-handler-error'
];


//  ------------------
//  Private Attributes
//  ------------------


/**
 * The Express application (server) instance.
 * @type {Object}
 */
MojitoServer.prototype._app = null;


/**
 * The formatting function for the server's associated logger.
 * @type {function(string, number, string, Date, Object, number)}
 */
MojitoServer.prototype._logFormatter = null;


/**
 * The publisher function for the server's associated logger.
 * @type {function(string, number, string, Date, number)}
 */
MojitoServer.prototype._logPublisher = null;


/**
 * The write function for the server's associated logger.
 * @type {function(function(string, number, string, Date, Object, number))}
 */
MojitoServer.prototype._logWriter = null;


/**
 * The server options container. Common option keys are listed.
 * @type {{port: number,
 *          dir: string,
 *          context: Object,
 *          appConfig: Object,
 *          verbose: boolean}}
 */
MojitoServer.prototype._options = null;


/**
 * The server startup time. This value is used to both provide startup/uptime
 * information and as a signifier that the server has been configured/started.
 * @type {number}
 */
MojitoServer.prototype._startupTime = null;


//  ---------------
//  Private Methods
//  ---------------

/**
 * A utility function for compiling a list of middleware
 * @method _makeMiddewareList
 * @private
 * @param {array} app_mw Middleware list specified by the app's applicatioon.json
 * @param {array} mojito_mw Middeware list specified Mojito, in this file, by the
 * MojitoServer.MOJITO_MIDDLEWARE property
 * @return {array} Complete and ordered list of middleware to load
 */
MojitoServer.prototype._makeMiddewareList = function (app_mw, mojito_mw) {
    var m,
        hasMojito = false,
        midName,
        middleware = [];

    // computing middleware pieces
    if (app_mw && app_mw.length) {
        for (m = 0; m < app_mw.length; m += 1) {
            midName = app_mw[m];
            if (0 === midName.indexOf('mojito-')) {
                hasMojito = true;
                break;
            }
        }

        if (hasMojito) {
            // User has specified at least one of mojito's middleware, so
            // we assume that they have specified all that they need.
            middleware = app_mw;
        } else {
            // backwards compatibility mode:
            //  middlware = user's, then mojito's
            middleware = app_mw.concat(mojito_mw);
        }

    } else {
        middleware = mojito_mw;
    }

    return middleware;
};

/**
 * A utility function to require middleware code, configure it, and tell express
 * to use() it.
 * @method _useMiddleware
 * @private
 * @param {object} app Express app instance.
 * @param {function} dispatcher Dispatcher function wrapper, special case middleware.
 * @param {string} midDir Directory of user-specified middleware, if any.
 * @param {object} midConfig Configuration object.
 * @param {array} middleware Middleware names, or pathnames.
 */
MojitoServer.prototype._useMiddleware = function (app, dispatcher, midDir, midConfig, middleware) {
    var m,
        midName,
        midPath,
        midBase,
        midFactory;

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
                app.use(midFactory(midConfig));
            }
        } else {
            // backwards-compatibility: user-provided middleware is
            // specified by path
            midPath = libpath.join(midDir, midName);
            //console.log("======== MIDDLEWARE user " + midPath);
            midBase = libpath.basename(midPath);
            if (0 === midBase.indexOf('mojito-')) {
                // Same as above (case of Mojito's special middlewares)
                // Gives a user-provided middleware access to the YUI
                // instance, resource store, logger, context, etc.
                app.use(require(midPath)(midConfig));
            } else {
                app.use(require(midPath));
            }
        }
    }
};

/**
 * Creates the YUI instance.
 * @private
 * @method _createYUIInstance
 * @param {Object} options The options as passed to the constructor.
 * @param {Object} appConfig The static application configuration.
 * @return {Object} The YUI instances.
 */
MojitoServer.prototype._createYUIInstance = function(options, appConfig) {
    var yuiConfig = (appConfig.yui && appConfig.yui.config) || {},
        Y;

    // redefining "combine" and/or "base" in the server side have side effects
    // and might try to load yui from CDN, so we bypass them.
    // TODO: report bug.
    // is there a better alternative for this delete?
    // maybe not, but it might introduce a perf penalty
    // in v8 engine, and we can't use the undefined trick
    // because loader is doing hasOwnProperty :(
    delete yuiConfig.combine;
    delete yuiConfig.base;

    // in case we want to collect some performance metrics,
    // we can do that by defining the "perf" object in:
    // application.json (master)
    // You can also use the option --perf path/filename.log when
    // running mojito start to dump metrics to disk.
    if (appConfig.perf) {
        yuiConfig.perf = appConfig.perf;
        yuiConfig.perf.logFile = options.perf || yuiConfig.perf.logFile;
    }

    // getting yui module, or yui/debug if needed, and applying
    // the default configuration from application.json->yui-config
    Y = require('yui' + (yuiConfig.filter === 'debug' ? '/debug' : '')).YUI(yuiConfig, {
        useSync: true
    });

    return Y;
};

/**
 * Adds Mojito framework components to the Express application instance.
 * @private
 * @method _configureAppInstance
 * @param {Object} app The Express application instance to Mojito-enable.
 * @param {{port: number,
 *          dir: string,
 *          context: Object,
 *          appConfig: Object,
 *          verbose: boolean}} options An object containing server options.
 * @param {Object} appConfig The static application configuration.
 */
MojitoServer.prototype._configureAppInstance = function(app, options, appConfig) {
    var store = app.store,
        Y = options.Y,
        modules = [],
        middleware,
        midConfig;

    modules = this._configureYUI(Y, store);

    // attaching all modules available for this application for the server side
    Y.applyConfig({ useSync: true });
    Y.use.apply(Y, modules);
    Y.applyConfig({ useSync: false });

    middleware = this._makeMiddewareList(appConfig.middleware, MojitoServer.MOJITO_MIDDLEWARE);

    midConfig = {
        Y: Y,
        store: store,
        logger: {
            log: Y.log
        },
        context: options.context
    };

    function dispatcher(req, res, next) {
        var command = req.command,
            outputHandler,
            context = req.context || {};

        if (!command) {
            next();
            return;
        }

        outputHandler = new OutputHandler(req, res, next);
        outputHandler.setLogger({
            log: Y.log
        });

        // storing the static app config as well as contextualized app config per request
        outputHandler.page.staticAppConfig = store.getStaticAppConfig();
        outputHandler.page.appConfig = store.getAppConfig(context);
        // compute routes once per request
        outputHandler.page.routes = store.getRoutes(context);

        // HookSystem::StartBlock
        // enabling perf group
        if (appConfig.perf) {
            // in case another middleware has enabled hooks before
            outputHandler.hook = req.hook || {};
            Y.mojito.hooks.enableHookGroup(outputHandler.hook, 'mojito-perf');
        }
        // HookSystem::EndBlock

        // HookSystem::StartBlock
        Y.mojito.hooks.hook('AppDispatch', outputHandler.hook, req, res);
        // HookSystem::EndBlock

        Y.mojito.Dispatcher.init(store).dispatch(command, outputHandler);
    }

    // attach middleware pieces
    this._useMiddleware(app, dispatcher, options.dir, midConfig, middleware);

    Y.log('Mojito HTTP Server initialized in ' +
            ((new Date().getTime()) - Mojito.MOJITO_INIT) + 'ms.');
};

/*
 * Configures YUI logger to honor the logLevel and logLevelOrder
 * TODO: this should be done at the low level in YUI.
 */
MojitoServer.prototype._configureLogger = function(Y) {
    var logLevel = (Y.config.logLevel || 'debug').toLowerCase(),
        logLevelOrder = Y.config.logLevelOrder || [],
        defaultLogLevel = logLevelOrder[0] || 'info',
        isatty = process.stdout.isTTY;

    function log(c, msg, cat, src) {
        var f,
            m = (src) ? src + ': ' + msg : msg;

        // if stdout is bound to the tty, we should try to
        // use the fancy logs implemented by 'yui-log-nodejs'.
        // TODO: eventually YUI should take care of this piece.
        if (isatty && Y.Lang.isFunction(c.logFn)) {
            c.logFn.call(Y, msg, cat, src);
        } else if ((typeof console !== 'undefined') && console.log) {
            f = (cat && console[cat]) ? cat : 'log';
            console[f](msg);
        }
    }

    // one more hack: we need to make sure that base is attached
    // to be able to listen for Y.on.
    Y.use('base');

    if (Y.config.debug) {

        logLevel = (logLevelOrder.indexOf(logLevel) >= 0 ? logLevel : logLevelOrder[0]);

        // logLevel index defines the begining of the logLevelOrder structure
        // e.g: ['foo', 'bar', 'baz'], and logLevel 'bar' should produce: ['bar', 'baz']
        logLevelOrder = (logLevel ? logLevelOrder.slice(logLevelOrder.indexOf(logLevel)) : []);

        Y.applyConfig({
            useBrowserConsole: false,
            logLevel: logLevel,
            logLevelOrder: logLevelOrder
        });

        // listening for low level log events to filter some of them.
        Y.on('yui:log', function (e) {
            var c = Y.config,
                cat = e && e.cat && e.cat.toLowerCase();

            // this covers the case Y.log(msg) without category
            // by using the low priority category from logLevelOrder.
            cat = cat || defaultLogLevel;

            // applying logLevel filters
            if (cat && ((c.logLevel === cat) || (c.logLevelOrder.indexOf(cat) >= 0))) {
                log(c, e.msg, cat, e.src);
            }
            return true;
        });
    }

};

/**
 * Configures YUI with both the Mojito framework and all the YUI modules in the
 * application.
 * @private
 * @method _configureYUI
 * @param {object} Y YUI object to configure
 * @param {object} store Resource Store which knows what to load
 * @return {array} array of YUI module names
 */
MojitoServer.prototype._configureYUI = function(Y, store) {
    var modules,
        load,
        lang;

    modules = store.yui.getModulesConfig('server', false);
    Y.applyConfig(modules);

    load = Object.keys(modules.modules);

    // NOTE:  Not all of these module names are guaranteed to be valid,
    // but the loader tolerates them anyways.
    for (lang in store.yui.langs) {
        if (store.yui.langs.hasOwnProperty(lang) && lang) {
            load.push('lang/datatype-date-format_' + lang);
        }
    }

    return load;
};


//  --------------
//  Public Methods
//  --------------


/**
 * Closes (shuts down) the server port and stops the server.
 */
MojitoServer.prototype.close = function() {
    if (this._options.verbose) {
        console.warn('Closing Mojito Application');
    }

    this._app.close();
};


/**
 * Returns the instance of http.Server (or a subtype) which is the true server.
 * @return {http.Server} The node.js http.Server (or subtype) instance.
 */
MojitoServer.prototype.getHttpServer = function() {
    return this._app;
};


/**
 * Begin listening for inbound connections.
 * @param {Number} port The port number. Defaults to the server's value for
 *     options.port (which defaults to process.env.PORT followed by 8666).
 * @param {String} host Optional hostname or IP address in string form.
 * @param {Function} callback Optional callback to get notified when the
 * server is ready to server traffic.
 */
MojitoServer.prototype.listen = function(port, host, callback) {

    var app = this._app,
        p = port || this._options.port,
        h = host || this._options.host,
        listenArgs = [p];

    // Track startup time and use it to ensure we don't try to listen() twice.
    if (this._startupTime) {
        if (this._options.verbose) {
            console.warn('Mojito Application Already Running');
        }
        return;
    }
    this._startupTime = new Date().getTime();

    if (this._options.verbose) {
        console.warn('Starting Mojito Application');
    }

    if (h) {
        listenArgs.push(h);
    }

    // close on app for callback
    function handler(err) {
        callback(err, app);
    }

    if (callback) {
        app.on('error', handler);
        listenArgs.push(handler);
    }

    app.listen.apply(app, listenArgs);
};


/**
 * Invokes a callback function with the content of the requested url.
 * @param {string} url A url to fetch.
 * @param {{host: string, port: number, method: string}|function} opts A list of
 *     options, or a callback function (See @param for cb). When providing
 *     options note that the list here is not exhaustive. Any valid http.request
 *     object option may be provided. See documentation for http.request.
 * @param {function(Error, string, string)} cb A function called on request
 *     completion. Parameters are any optional Error, the original URL, and the
 *     content of that URL.
 */
MojitoServer.prototype.getWebPage = function(url, opts, cb) {
    var buffer = '',
        callback,
        options = {
            host: '127.0.0.1',
            port: this._options.port,
            path: url,
            method: 'get'
        };

    // Options block is optional, no pun intended. When it's a function we'll
    // use that as our callback function.
    if (typeof opts === 'function') {
        callback = opts;
    } else {
        // Don't assume we got a real callback function.
        callback = cb || Mojito.NOOP;

        // Map provided options into our request options object.
        Object.keys(opts).forEach(function(k) {
            if (opts.hasOwnProperty(k)) {
                options[k] = opts[k];
            }
        });
    }

    http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            buffer += chunk;
        });
        res.on('end', function() {
            // TODO: 200 isn't the only success code. Support 304 etc.
            if (res.statusCode !== 200) {
                callback('Could not get web page: status code: ' +
                    res.statusCode + '\n' + buffer, url);
            } else {
                callback(null, url, buffer);
            }
        });
    }).on('error', function(err) {
        callback(err, url);
    }).end();
};


/**
 * Invokes a callback function with the content of each url requested.
 * @param {Array.<string>} urls A list of urls to fetch.
 * @param {function(Error, string, string)} cb A function called once for each
 *     url in the urls list. Parameters are any optional Error, the original URL
 *     and the URL's content.
 */
MojitoServer.prototype.getWebPages = function(urls, cb) {
    var server = this,
        callback,
        count,
        len,
        initOne;

    // If no array, or an empty array, just exit.
    if (!urls || urls.length === 0) {
        return;
    }

    // NOTE we could just say this is an error condition. No callback, what's
    // the point of doing the work?
    callback = cb || Mojito.NOOP;

    len = urls.length;
    count = 0;

    // Create a function to call getWebPage with an individual URL shifted from
    // the list. When the list is empty we can stop.
    initOne = function() {
        if (count < len) {
            server.getWebPage(urls[count], function(err, url, data) {
                count += 1;
                try {
                    callback(err, url, data);
                } finally {
                    initOne();
                }
            });
        }
    };

    // Start the ball rolling :).
    initOne();
};

//  ----------------------------------------------------------------------------
//  Mojito
//  ----------------------------------------------------------------------------

/**
 * The Mojito object is the primary server construction interface for Mojito.
 * This object is used to create new server instances but given that the raw
 * Express application object is expected/returned there's no need for a true
 * constructor since there are no true instances of a Mojito server object.
 */
// TODO: Merge what we put on this object with the 'mojito' module/namespace.
Mojito = {};


//  ---------
//  Constants
//  ---------

/**
 * The date/time the Mojito object was initialized.
 * @type {Date}
 */
Mojito.MOJITO_INIT = new Date().getTime();


/**
 * A placeholder function used to avoid overhead checking for callbacks.
 * @type {function()}
 */
Mojito.NOOP = function() {};


//  --------------
//  Public Methods
//  --------------


/**
 * Creates a properly configured MojitoServer instance and returns it.
 * @method createServer
 * @param {Object} options Options for starting the app.
 * @return {Object} Express application.
 */
Mojito.createServer = function(options) {
    // NOTE that we use the exported name here. This allows us to mock that
    // object during testing.
    return new Mojito.Server(options);
};


/**
 * Allows the bin/mojito command to leverage the current module's relative path
 * for initial startup loading.
 * @method include
 * @param {string} path The path used to locate resources.
 * @return {Object} The return value of require() for the adjusted path.
 */
Mojito.include = function(path) {
    return require('./' + path);
};


//  ----------------------------------------------------------------------------
//  EXPORT(S)
//  ----------------------------------------------------------------------------

/**
 * Export Mojito as the return value for any require() calls.
 * @type {Mojito}
 */
module.exports = Mojito;

/**
 * Export Mojito.Server to support unit testing of the server type. With this
 * approach the slot for the server can be replaced with a mock, but the actual
 * MojitoServer type remains private to the module.
 * @type {MojitoServer}
 */
module.exports.Server = MojitoServer;

