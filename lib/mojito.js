/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/


//  ----------------------------------------------------------------------------
//  Prerequisites
//  ----------------------------------------------------------------------------


var YUI = require('yui').YUI,
    express = require('express'), // TODO: [Issue 80] go back to connect?
    http = require('http'),
    OutputHandler = require('./output-handler.server'),
    libpath = require('path'),
    libutils = require('./management/utils'),
    serverLog = require('./server-log'),
    requestCounter = 0, // used to scope logs per request
    logger,
    Mojito;


//  ----------------------------------------------------------------------------
//  Mojito Global
//  ----------------------------------------------------------------------------


/**
 * Shared global object, which isn't named 'mojito' because 'mojito' is a module
 * name defined in mojito.common.js and required via Mojito.CORE_MOJITO_MODULES.
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

    this._options = options || {};
    this._options.port = this._options.port || process.env.PORT || 8666;

    // TODO: Note we could pass some options to the express server instance.
    this._app = express.createServer();
    this._configureAppInstance(this._app, this._options);

    return this;
}


//  ---------
//  Constants
//  ---------


/**
 * The Mojito modules which must be accessible for Mojito to bootstrap itself.
 * @type {Array.<string>}
 */
MojitoServer.CORE_MOJITO_MODULES = ['mojito', 'mojito-route-maker'];


/**
 * The YUI modules which must be accessible for Mojito to bootstrap itself.
 * @type {Array.<string>}
 */
MojitoServer.CORE_YUI_MODULES = ['get', 'features', 'intl-base', 'mojito'];


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
    'mojito-handler-dispatcher'
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
 * Adds Mojito framework components to the Express application instance.
 * @method _configureAppInstance
 * @param {Object} app The Express application instance to Mojito-enable.
 * @param {{port: number,
 *          dir: string,
 *          context: Object,
 *          appConfig: Object,
 *          verbose: boolean}} options An object containing server options.
 */
MojitoServer.prototype._configureAppInstance = function(app, options) {

    var store,
        loader,
        Y,
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

    Y = YUI({ core: Mojito.CORE_YUI_MODULES, useSync: true });

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

    this._configureYUI(Y, store, MojitoServer.CORE_MOJITO_MODULES);

    // Load logger early so that we can plug it in before the other loading
    // happens.
    Y.applyConfig({ useSync: true });
    Y.use('mojito-logger');
    // TODO: extract function
    logger = new Y.mojito.Logger(serverLog.options);

    Y.applyConfig({ useSync: true });
    Y.use.apply(Y, MojitoServer.CORE_MOJITO_MODULES);
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
            for (m = 0; m < MojitoServer.MOJITO_MIDDLEWARE.length; m += 1) {
                middleware.push(MojitoServer.MOJITO_MIDDLEWARE[m]);
            }
        }
    } else {
        middleware = MojitoServer.MOJITO_MIDDLEWARE;
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
            Mojito.CORE_YUI_MODULES,
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

    logger.log('Mojito HTTP Server initialized in ' +
            ((new Date().getTime()) - Mojito.MOJITO_INIT) + 'ms.');
};


/*
 * Configures YUI with both the Mojito framework and all the YUI modules in the
 * application.
 */
MojitoServer.prototype._configureYUI = function(Y, store, load) {
    var shared,
        modules,
        module;

    shared = store.yui.getConfigShared('server', {}, false);
    Y.applyConfig(shared);

    // Also pre-load shared modules.
    modules = shared.modules;
    for (module in modules) {
        if (modules.hasOwnProperty(module)) {
            load.push(module);
        }
    }
};


//  --------------
//  Public Methods
//  --------------


/**
 * Closes (shuts down) the server port and stops the server.
 */
MojitoServer.prototype.close = function() {
    if (this._options.verbose) {
        libutils.warn('Closing Mojito Application');
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
 * @param {String} host The hostname or IP address in string form.
 */
MojitoServer.prototype.listen = function(port, host, cb) {

    var logger,
        app = this._app,
        p = port || this._options.port,
        h = host || this._options.host,
        callback = cb || Mojito.NOOP,
        handler = function(err) {
            callback(err, app);
        };

    // Track startup time and use it to ensure we don't try to listen() twice.
    if (this._startupTime) {
        if (this._options.verbose) {
            libutils.warn('Mojito Application Already Running');
        }
        return;
    }
    this._startupTime = new Date().getTime();

    if (this._options.verbose) {
        libutils.warn('Starting Mojito Application');
    }


    try {
        if (h) {
            app.listen(p, h, handler);
        } else {
            app.listen(p, handler);
        }
    } catch (err) {
        callback(err);
    }
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


/**
 * Sets the formatting function for the server's associated logger.
 * @param {function(string, number, string, Date, Object, number)} formatter A
 *     function accepting a message, level, source, timestamp, options, and
 *     request ID which will format those parameters for output.
 */
MojitoServer.prototype.setLogFormatter = function(formatter) {
    this._logFormatter = formatter;
};


/**
 * Sets the publisher function for the server's associated logger. The publisher
 * is invoked when buffering is not active, or when flush() is invoked on the
 * log.
 * @param {function(string, number, string, Date, number)} publisher A
 *     function accepting a message, level, source, timestamp, and request ID
 *     which will publish (i.e. output) that data (rather than buffering it).
 */
MojitoServer.prototype.setLogPublisher = function(publisher) {
    this._logPublisher = publisher;
};


/**
 * Sets the write function for the server's associated logger. The writer is
 * invoked with the formatter associated with the server's logger. Set
 * setLogFormatter for more information.
 * @param {function(function(string, number, string, Date, Object, number))}
 *     writer A function accepting a formatting function as a parameter.
 */
MojitoServer.prototype.setLogWriter = function(writer) {
    this._logWriter = writer;
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

