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
instantiate their app the `express` way.

Usage:

    var app = require('express'),
        mojito = require('mojito'),
        app;

    app = express(); // Mojito instance will be created during that call

    app.use(mojito.middleware()); // register the Mojito specific middleware

    app.post('/tunnel', mojito.tunnelMiddleware()); // setup tunnel dispatcher

    app.mojito.attachRoutes(); // load routes defined in `routes.json`

    // setup other routes here

    app.listen(app.get('port'));

@module mojito
**/

'use strict';


var debug = require('debug')('mojito'),
    express = require('express'),
    libpath = require('path'),
    appProto = express.application,
    defaultConfiguration = appProto.defaultConfiguration,
    libdispatcher = require('./dispatcher'),
    liblogger = require('./logger'),
    libmiddleware = require('./middleware'),
    librouter = require('./router'),
    libstore = require('./store'),
    libtunnel = require('./tunnel'),
    extend = require('./util').extend,
    Mojito;


//  ----------------------------------------------------------------------------
//  Mojito Global
//  ----------------------------------------------------------------------------


/**
Mojito extension for Express.

@protected
@class Mojito
@constructor
@param {express.application} app `express` application instance
@uses *express, dispatcher, logger, middleware, router, store, tunnel
**/
function Mojito(app) {

    this._app = app;
    this._config = {};
    extend(Mojito, libdispatcher, liblogger, libmiddleware, libtunnel);
    app.mojito = {};
    this._init(app);

    return this;
}


/**
Creates a new instance of mojito and attach to `app`.

@method _init
@protected
@param {express.application} app optional

**/
Mojito.prototype._init = function (app) {

    app = app || this._app;

    var context = {},
        appConfig,      // application.json
        options = {},   //
        store;          // reference to resource store

    // debug('applying mojito.defaultConfiguration()');

    if (!app.mojito) {
        throw new Error('`app.mojito` was not initialized correctly.');
    }

    // TODO: use correct static context here
    context.runtime = 'server';

    options = {};
    options.port = process.env.PORT || appConfig.appPort || 8666;
    options.context = context;
    options.mojitoRoot = __dirname;
    // TODO: `root` is required for the resource store, which will be replaced
    // by `locator` at some point. `locator` will have access to the appRoot
    // folder.
    // The application root directory
    options.root = process.cwd();

    appConfig = libstore.getAppConfig(options.root, context);
    options.Y = this._createYUIInstance(options, appConfig);
    liblogger.configureLogger(options.Y);
    store = libstore.createStore(options);
    this._configureAppInstance(app, store, options, appConfig);

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
Mojito.prototype._configureYUI = function (Y, store) {
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
Creates the YUI instance used by the server.

@method _createYUIInstance
@protected
@param {Object} options Same as the `options` parameter to `_configureAppInstance()`.
@param {Object} appConfig The static configuration for the application.
*/
Mojito.prototype._createYUIInstance = function (options, appConfig) {
    var yuiConfig,
        modules = [],
        Y;

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
Adds Mojito framework components to the Express application instance.

@method _configureAppInstance
@protected
@param {express.application} app The Express application instance to Mojito-enable.
@param {ResourceStore} store
@param {Object} options
    @param {Integer} options.port port to listen on
    @param {Object} options.context static context set at startup
    @param {String} options.mojitoRoot
    @param {String} options.root the app root dir
@param {Object} appConfig The static configuration for the application.
**/
Mojito.prototype._configureAppInstance = function (app, store, options, appConfig) {
    var Y = options.Y,
        modules = [];

    modules = this._configureYUI(Y, store);

    // attaching all modules available for this application for the server side
    Y.applyConfig({ useSync: true });
    Y.use.apply(Y, modules);
    Y.applyConfig({ useSync: false });

    // TODO: This might change when `express-yui` and `locator` are integrated
    // and how they are exposed to the `app.mojito` instance.
    // stash for runtime
    extend(app.mojito, {
        store: store,
        Y: Y,
        context: options.context,
        options: options,
        _app: app, // reference to `app` from within `app.mojito`
        attachRoutes: librouter.attachRoutes
        // `routes` property will be lazy initialized on the first request
        // @see lib/dispatcher.js
    });

    console.log('✔\tMojito ready to serve.');

}; // _configureAppInstance


/**
Hook into `express` default configuration init phase.
**/
appProto.defaultConfiguration = function () {
    defaultConfiguration.apply(this, arguments);

    if (!this.mojito) {
        var mojito = new Mojito(this);
    } else {
        debug('skipping creation of `app.mojito` because it is already defined');
    }
};

//  ----------------------------------------------------------------------------
//  EXPORT(S)
//  ----------------------------------------------------------------------------

/**

Export Mojito extension as a function.

**/

module.exports = Mojito;

