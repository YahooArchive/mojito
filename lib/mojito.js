/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint nomen:true, node:true*/

'use strict';


var express = require('express'),
    appProto = express.application,
    defaultConfiguration = appProto.defaultConfiguration,
    store = require('./store'),
    OutputHandler = require('./output-handler.server'),
    libpath = require('path'),
    debug = require('debug')('mojito:server'),
    Mojito;


// poor man's merge fn
function merge(a, b) {
    var key;
    if (a && b) {
        for (key in b) {
            if (b.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
    }
}

/**
@module mojito
**/

//  ----------------------------------------------------------------------------
//  Mojito Global
//  ----------------------------------------------------------------------------

/**
 * Shared global object, which isn't named 'mojito' because 'mojito' is a module
 * name defined in mojito.common.js and required via Y.use.
 */
// TODO: Merge what we put on this object with the 'mojito' module/namespace.
global._mojito = {};


/**
 * The Mojito object keeps state about the server at runtime.
 */
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
 * @type {function ()}
 */
Mojito.NOOP = function () {};


/**
 * An ordered list of the middleware module names to load for a standard Mojito
 * server instance.
 * @type {Array.<string>}
 */
Mojito.MOJITO_MIDDLEWARE = [
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
Expose Mojito.MOJITO_MIDDLEWARE list as app.mojito.*
e.g:

    app.use(app.mojito['mojito-handler-static']);

@method _exposeMiddleware
@protected
@param {express.application} app `express` app instance
@param {Function} dispatcher mojito's dispatcher middleware
@param {Object} midConfig configuration object to pass to middleware
@param {Array} middleware middleware names
**/
function _exposeMiddleware(app, dispatcher, midConfig, middleware) {

    var m,
        midName,
        midPath,
        midFactory;

    if (!app.mojito) {
        // Revisit a better suited error message
        throw new Error('`app.mojito` was not correctly initialized!');
    }

    for (m = 0; m < middleware.length; m = m + 1) {
        midName = middleware[m];
        if (0 === midName.indexOf('mojito-handler-dispatcher')) {
            app.mojito[midName] = dispatcher;
        } else {
            try {
                // Assume it is an NPM package
                // debug('require() middleware by name: ' + midName);
                midFactory = require(midName);
            } catch (e1) {
                try {
                    // Attempt to load by known mojito middleware path
                    midPath = libpath.join(__dirname, 'app', 'middleware', midName);
                    // debug('require() middleware by path: ' + midPath);
                    midFactory = require(midPath);
                } catch (e2) {
                    // give up
                    midFactory = null;
                    console.error('failed to attach middleware: ' + midName);
                }
            }
            if (midFactory) {
                app.mojito[midName] = midFactory(midConfig);
            }
        }
    }
}


/**
Configures YUI logger to honor the logLevel and logLevelOrder
TODO: This should be done at the low level in YUI.

@method _configureLogger
@protected
@param {YUI} Y shared YUI instance on the server
**/
function _configureLogger(Y) {
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
}

/**
 * Configures YUI with both the Mojito framework and all the YUI modules in the
 * application.
 *
 * @method _configureYUI
 * @protected
 * @param {Object} Y YUI object to configure
 * @param {Object} store Resource Store which knows what to load
 * @return {Array} array of YUI module names
 */
function _configureYUI(Y, store) {
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
}

/**
Mojito specific dispatcher as a middleware.

@method dispatcher
@protected
@param {Store} store resource store
@param {Object} appConfig static app config
@param {YUI} Y shared YUI instance on server
@return {Function} express middleware
**/
function _dispatcher(store, appConfig, Y) {

    return function (req, res, next) {
        var command = req.command,
            outputHandler;

        if (!command) {
            next();
            return;
        }

        outputHandler = new OutputHandler(req, res, next);
        outputHandler.setLogger({
            log: Y.log
        });

        outputHandler.page.staticAppConfig = store.getStaticAppConfig();

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
    };

}

/**
 * Adds Mojito framework components to the Express application instance.
 *
 * @method _configureAppInstance
 * @protected
 * @param {express.application} app The Express application instance to Mojito-enable.
 * @param {Object} options
 *     @param {Integer} options.port
 *     @param {Object} options.dir
 *     @param {Object} options.context static context
 *     @param {Object} options.appConfig static application config
 *     @param {Boolean} options.verbose
 */
function _configureAppInstance(app, options) {
    var store = app.mojito.store,
        Y,
        appConfig,
        yuiConfig,
        logConfig = {},
        modules = [],
        middleware,
        midConfig,
        debugConfig;

    if (!options) {
        options = {};
    }
    if (!options.dir) {
        options.dir = process.cwd();
    }
    if (!options.context) {
        options.context = {};
    }

    appConfig = store.getStaticAppConfig();
    yuiConfig = (appConfig.yui && appConfig.yui.config) || {};

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
        yuiConfig.perf.logFile = options.perf;
    }

    // getting yui module, or yui/debug if needed, and applying
    // the default configuration from application.json->yui-config
    Y = require('yui' + (yuiConfig.filter === 'debug' ? '/debug' : '')).YUI(yuiConfig, {
        useSync: true
    });

    _configureLogger(Y);
    modules = _configureYUI(Y, store);

    // attaching all modules available for this application for the server side
    Y.applyConfig({ useSync: true });
    Y.use.apply(Y, modules);
    Y.applyConfig({ useSync: false });

    middleware = [].concat(Mojito.MOJITO_MIDDLEWARE);

    midConfig = {
        Y: Y,
        store: store,
        logger: {
            log: Y.log
        },
        context: options.context
    };

    // expose the middlewares to `app.mojito` 
    _exposeMiddleware(app, _dispatcher(store, appConfig, Y), midConfig, middleware);

    // stash for later
    merge(Mojito, midConfig);

    Y.log('Mojito initialized in ' +
            ((new Date().getTime()) - Mojito.MOJITO_INIT) + 'ms.');
}


//  ----------------------------------------------------------------------------
//  EXPORT(S)
//  ----------------------------------------------------------------------------


/**
Creates a new instance of mojito and attach to `app`.

@method createMojito
@public
@param {express.application} app
**/
function createMojito(app) {

    var appConfig, // application.json 
        options,   //
        pack,      // package.json
        root,      // the app root directory
        rs;        // reference to resource store

    debug('applying mojito.defaultConfiguration()');

    if (!app.mojito) {
        // something is wrong: defaultConfiguration was not run
        throw new Error('`app.mojito` was not correctly initialized!');
    }

    // Block taken from "mojito start"
    root = process.cwd();

    rs = store.createStore({
        root: root,
        preload: 'skip', // only need appConfig and package.json
        context: { } // no context by default. read from CLI ?
    });
    appConfig = rs.getAppConfig();

    options = {};
    options.port = appConfig.appPort || process.env.PORT || 8666;
    options.context = { }; // TODO: use correct static context here
    options.perf =  'perf-log.log'; // TODO: should come from application.json
    options.mojitoRoot = __dirname;
    options.root = root;

    // create new store, configure mojito, and optimize
    rs = store.createStore(options);
    // stash for later
    // need to set  app.mojito.store()`  before calling `_configureAppInstance`
    app.mojito.store = rs;
    app.mojito.options = options;

    _configureAppInstance(app, options);
    rs.optimizeForEnvironment();

    // set port from application.json
    app.set('port', options.port);

}


/**
NOTE: naming is based on ExpressYUIExtension in modown-yui

@class ExpressMojitoExtension
@constructor
@param {express.application} app `express` application instance
@uses *express
**/
function ExpressMojitoExtension(app) {

    this._app = app;
    this._config = {};

    return this;
}

ExpressMojitoExtension.prototype = {

    /**
    Returns a list of middleware ready for use.

        var express = require('express'),
            mojito = require('mojito'),
            app;

        app = express();
        app.mojito.middleware().forEach(function (mid) {
            app.use(app.mojito[mid]);
        });
        

    @method middleware
    @public
    @return {Array} list of middlewares for a default Mojito application
    **/
    middleware: function () {
        return [].concat(Mojito.MOJITO_MIDDLEWARE);
    },

    createMojito: function (app) {
        createMojito(app);
    }
};

exports = module.exports = ExpressMojitoExtension;

appProto.defaultConfiguration = function () {
    debug('-- Begin defaultConfiguration --');
    defaultConfiguration.apply(this, arguments);

    if (!this.mojito) {
        this.mojito = new ExpressMojitoExtension(this);
        this.mojito.createMojito(this);
    } else {
        debug('skipping creation of `app.mojito` because it is already defined');
    }
    debug('-- End defaultConfiguration --');
};



