/**
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint nomen:true, node:true*/

/**
Main module in the Mojito package that is responsible for creating the mojito
instance to the attached to the `express` app.

@module mojito
**/

'use strict';


var debug = require('debug')('mojito:server'),
    express = require('express'),
    libpath = require('path'),
    appProto = express.application,
    defaultConfiguration = appProto.defaultConfiguration,
    // OutputHandler = require('./output-handler.server'),
    libstore = require('./store'),
    libmiddleware = require('./middleware'),
    Mojito;


/**
Poor man's merge fn
**/
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
function extend(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function (source) {
        var key;

        if (!source) { return; }

        for (key in source) {
            if (source.hasOwnProperty(key)) {
                obj[key] = source[key];
            }
        }
    });

    return obj;
};


//  ----------------------------------------------------------------------------
//  Mojito Global
//  ----------------------------------------------------------------------------


/**
The Mojito object keeps state about the server at runtime.

**/
Mojito = {};


//  ---------
//  Constants
//  ---------

/**
The date/time the Mojito object was initialized.
@type Date
**/
Mojito.MOJITO_INIT = new Date().getTime();


/**
A placeholder function used to avoid overhead checking for callbacks.
@type Function
**/
Mojito.NOOP = function () {};


/**
An ordered list of the middleware module names to load for a standard Mojito
server instance.
@type Array
**/
/*
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
*/



/**
Mojito extension for Express.

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

// Mixin here
ExpressMojitoExtension = extend(ExpressMojitoExtension, libmiddleware);

/**
Creates a new instance of mojito and attach to `app`.

@method createMojito
@public
@param {express.application} app optional 

**/
ExpressMojitoExtension.prototype.createMojito = function (app) {

    app = app || this._app;

    var my = this,
        appConfig, // application.json 
        options,   //
        pack,      // package.json
        root,      // the app root directory
        store;     // reference to resource store

    debug('applying mojito.defaultConfiguration()');

    if (!app.mojito) {
        // something is wrong: defaultConfiguration was not run
        throw new Error('`app.mojito` was not correctly initialized!');
    }

    // The application root directory
    root = process.cwd();

    store = libstore.createStore({
        root: root,
        preload: 'skip', // only need appConfig and package.json
        context: { }
    });
    appConfig = store.getAppConfig();

    options = {};
    options.port = appConfig.appPort || process.env.PORT || 8666;
    options.context = { }; // TODO: use correct static context here
    options.perf =  'perf-log.log'; // TODO: should come from application.json
    options.mojitoRoot = __dirname;
    options.root = root;

    // create new store, configure mojito, and optimize
    store = libstore.createStore(options);

    my._configureAppInstance(app, store, options);
    // -----
    // NOTE: Disabling this for now, as middleware are now lazy initialized.
    //
    // store.optimizeForEnvironment();
    // ----

    // set port from application.json
    app.set('port', options.port);
};



/**
Configures YUI logger to honor the logLevel and logLevelOrder
TODO: This should be done at the low level in YUI.

@method _configureLogger
@protected
@param {YUI} Y shared YUI instance on the server
**/
ExpressMojitoExtension.prototype._configureLogger = function (Y) {
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

        logLevel = (logLevelOrder.indexOf(logLevel) >= 0 ?
                        logLevel : logLevelOrder[0]);

        // logLevel index defines the begining of the logLevelOrder structure
        // e.g: ['foo', 'bar', 'baz'], and logLevel 'bar' 
        // should produce: ['bar', 'baz']
        logLevelOrder = (logLevel ?
                         logLevelOrder.slice(logLevelOrder.indexOf(logLevel)) :
                         []);

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
            if (cat && ((c.logLevel === cat) ||
                        (c.logLevelOrder.indexOf(cat) >= 0))) {
                log(c, e.msg, cat, e.src);
            }
            return true;
        });
    }
};


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
ExpressMojitoExtension.prototype._configureYUI = function (Y, store) {
    var my = this,
        modules,
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


/**
 * Adds Mojito framework components to the Express application instance.
 *
 * @method _configureAppInstance
 * @protected
 * @param {express.application} app The Express application instance to Mojito-enable.
 * @param {ResourceStore} store
 * @param {Object} options
 *     @param {Integer} options.port
 *     @param {Object} options.dir
 *     @param {Object} options.context static context
 *     @param {Object} options.appConfig static application config
 *     @param {Boolean} options.verbose
 */
ExpressMojitoExtension.prototype._configureAppInstance = function (app, store, options) {
    var my = this,
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

    my._configureLogger(Y);
    modules = my._configureYUI(Y, store);

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
    // my._exposeMiddleware(app, _dispatcher(store, appConfig, Y), midConfig, middleware);
    // ExpressMojitoExtension._exposeMiddleware(app, _dispatcher(store, appConfig, Y), midConfig, middleware);
    // ExpressMojitoExtension._exposeMiddleware();
    ExpressMojitoExtension.exposeMiddleware();

    // stash for global access - is that still needed ??
    // merge(Mojito, midConfig);

    // stash for runtime
    app.set('mojito.store', store);
    app.set('mojito.Y', Y);
    app.set('mojito.context', options.context);
    app.set('mojito.options', options);

    Y.log('Mojito initialized in ' +
            ((new Date().getTime()) - Mojito.MOJITO_INIT) + 'ms.');

}; // _configureAppInstance


/**
Hook into `express` default configuration phase.
**/
appProto.defaultConfiguration = function () {
    // debug('-- Begin defaultConfiguration --');
    defaultConfiguration.apply(this, arguments);

    if (!this.mojito) {
        // These two probably can be merged.
        this.mojito = new ExpressMojitoExtension(this);
        this.mojito.createMojito();
    } else {
        debug('skipping creation of `app.mojito` because it is already defined');
    }
    // debug('-- End defaultConfiguration --');
};

//  ----------------------------------------------------------------------------
//  EXPORT(S)
//  ----------------------------------------------------------------------------

/**
For UT, can use the following approach:

    var Mojito = require('mojito'),
        app = { }; // mocking express

    app.mojito = new Mojito(app);
    app.mojito._exposeMiddleware = function (app, mid, midConfig, mids) {
        // assert
    };

    // create the instance
    app.mojito.createMojito(app);

    // validate here

**/

// exports = module.exports = extend(ExpressMojitoExtension, libmiddleware);
exports = module.exports = ExpressMojitoExtension;

