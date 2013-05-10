/**
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint nomen:true, node:true*/

/**
Main module in the Mojito package that is responsible for creating the mojito
instance to the attached to the `express` app.

Developers should not access this module directly, but instead should 
instantiate their app the express way.

Usage:

    var app = require('express'),
        mojito = require('mojito'),
        app;

    app = express(); // Mojito instance will be created during that call

    app.use(require('./middleware/my-middleware'));

    app.use(mojito.middleware(app));

    app.listen(app.get('port'));

@module mojito
**/

'use strict';


var debug = require('debug')('mojito:server'),
    express = require('express'),
    libpath = require('path'),
    appProto = express.application,
    defaultConfiguration = appProto.defaultConfiguration,
    liblogger = require('./logger'),
    libmiddleware = require('./middleware'),
    libstore = require('./store'),
    Mojito;


//  ----------------------------------------------------------------------------
//  Util
//  ----------------------------------------------------------------------------
// If more helpers are needed, they could potentially be moved to their own
// `util.js` module later.

/**
Copied from modown-yui.utils
**/
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
}


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
Mojito extension for Express.

@protected
@class ExpressMojitoExtension
@constructor
@param {express.application} app `express` application instance
@uses *express, *middleware, *logger
**/
function ExpressMojitoExtension(app) {

    this._app = app;
    this._config = {};

    return this;
}

// mix in submodules here
extend(ExpressMojitoExtension, libmiddleware, liblogger);

/**
Creates a new instance of mojito and attach to `app`.

@method _createMojito
@protected
@param {express.application} app optional 

**/
ExpressMojitoExtension.prototype._createMojito = function (app) {

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
Configures YUI with both the Mojito framework and all the YUI modules in the
application.

@method _configureYUI
@protected
@param {Object} Y YUI object to configure
@param {Object} store Resource Store which knows what to load
@return {Array} array of YUI module names
**/
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
Adds Mojito framework components to the Express application instance.

@method _configureAppInstance
@protected
@param {express.application} app The Express application instance to Mojito-enable.
@param {ResourceStore} store
@param {Object} options
    @param {Integer} options.port port to listen on
    @param {String} options.root the app root dir
    @param {String} options.mojitoRoot
    @param {Object} options.context static context set at startup
**/
ExpressMojitoExtension.prototype._configureAppInstance = function (app, store, options) {
    var my = this,
        mojitoFn = ExpressMojitoExtension,
        Y,
        appConfig,
        yuiConfig,
        logConfig = {},
        modules = [],
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

    mojitoFn.configureLogger(Y);
    modules = my._configureYUI(Y, store);

    // attaching all modules available for this application for the server side
    Y.applyConfig({ useSync: true });
    Y.use.apply(Y, modules);
    Y.applyConfig({ useSync: false });

    // expose the middlewares to `mojito` function
    mojitoFn.exposeMiddleware();

    // stash for runtime
    app.set('mojito.store', store);
    app.set('mojito.Y', Y);
    app.set('mojito.context', options.context);
    app.set('mojito.options', options);

    Y.log('Mojito initialized in ' +
            ((new Date().getTime()) - Mojito.MOJITO_INIT) + 'ms.');

}; // _configureAppInstance


/**
Hook into `express` default configuration init phase.
**/
appProto.defaultConfiguration = function () {
    // debug('-- Begin defaultConfiguration --');
    defaultConfiguration.apply(this, arguments);

    if (!this.mojito) {
        // These two probably can be merged.
        this.mojito = new ExpressMojitoExtension(this);
        this.mojito._createMojito();
    } else {
        debug('skipping creation of `app.mojito` because it is already defined');
    }
    // debug('-- End defaultConfiguration --');
};

//  ----------------------------------------------------------------------------
//  EXPORT(S)
//  ----------------------------------------------------------------------------

/**

Export Mojito extension as a function.

**/

exports = module.exports = ExpressMojitoExtension;

