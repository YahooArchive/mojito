/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint
    anon:true, sloppy:true, regexp: true, continue: true, nomen:true, node:true
*/


var libfs = require('fs'),
    libpath = require('path'),
    libqs = require('querystring'),
    libvm = require('vm'),
    libglob = require('./glob'),
    libycb = require('./libs/ycb'),

    isPositiveInt = /^[0-9]+$/,
    isSpaceOpencurly = / \{/g,
    isSpaceClosecurly = / \}/g,
    isNotAlphaNum = /[^a-zA-Z0-9]/,

    // fallback logger
    // This is the logger that is used until setLogger() is called.
    logger = {
        log: function(msg, lvl, who) {
            var log = console.log;

            if (lvl === 'warn' || lvl === 'error') {
                // console.warn provides unbuffered output and avoids message
                // truncation when process.exit() is called after logging
                log = console.warn;
            }
            log('[' + lvl + '] ' + who + ': ' + msg);
        }
    },

    // nodejs-yui3 has global state about which modules are loaded. Use
    // multiple require()'d instances as a wall to prevent cross-contamination
    // when using loader for dependency calculations.
    utilYUI = require('yui3').YUI,
    serverYUI = require('yui3').YUI,
    clientYUI = require('yui3').YUI,

    Y = utilYUI().useSync('intl'),

    mojitoRoot = __dirname,

    NAME = 'MojitoServer';

// TODO: move string constants here.


// The Affinity object is to manage the use of the affinity string in
// filenames.  Some files have affinities that have multiple parts
// (e.g. "server-tests").
function Affinity(affinity) {
    this._init(affinity);
}


Affinity.prototype = {
    _init: function(aff) {
        var parts;

        if (aff.indexOf('-') === -1) {
            this.affinity = aff;
        } else {
            parts = aff.split('-');
            this.affinity = parts[0];
            this.type = parts[1];
        }
    },
    toString: function() {
        return this.affinity;
    }
};


/**
 * The Resource Store manages information about the "resources" in a Mojito
 * application.  These resources are things that have representation on the
 * filesystem.
 *
 * Each resource can have many different versions.  This is not talking about
 * revisions, which is how the resource changes over time.  It is instead
 * talking about how there can be a version of the resource just for iphones,
 * one just for android, a fallback, etc.
 *
 * There are various types of resources:
 * <pre>
 *   config      -- a piece of configuration, sometimes for another resource
 *   controller  -- the controller for a mojit
 *   model       -- a model for a mojit
 *   view        -- a view for a mojit
 *   binder      -- a binder for a mojit
 *   action      -- an action to augment the controller
 *   asset       -- an asset (css, js, image, etc)
 *   addon       -- an addon to the mojito system
 *   spec        -- the configuration for a mojit instance
 *   yui-lang    -- a YUI3 language bundle
 *   yui-module  -- a YUI3 module (that isn't one of the above)
 * </pre>
 *
 * The metadata kept about each resource is "normalized" to the follow keys:
 *   (not all resources will have all keys)
 *   (some types will have additional keys)
 *   (not all combinations of type:source are valid)
 *
 * <pre>
 *   - id
 *       context-insensitive ID of the resource
 *       said another way, all versions of a resource have the same ID
 *
 *   - type
 *       see above
 *
 *   - source
 *       `fw`, `app` or `mojit`
 *       where the resource is defined
 *
 *   - fsPath
 *       the path on the filesystem
 *
 *   - staticHandlerURL
 *       the URL that will cause the asset handler to serve the resource
 *       for resources that can be deployed by reference to the client
 *
 *   - name
 *       specific to type
 *
 *   - configType
 *       for type=config
 *       the type of the configuration
 *
 *   - viewEngine
 *       for type=view
 *       `mu`, `dust`, etc
 *
 *   - viewOutputFormat
 *       for type=view
 *       output format that the view will generate
 *       `xml`, `html`, etc
 *
 *   - assetType
 *       for type=asset
 *       `css`, `js`, `png`, `swf`, etc
 *
 *   - addonType
 *       for type=addon
 *       the mojito subsystem to which the addon should be added
 *
 *   - yuiModuleName
 *       for any resource delivered as a YUI3 module
 *       the YUI3 module name
 *
 *   - yuiModuleVersion
 *       for any resource delivered as a YUI3 module
 *       the YUI3 module version
 *
 *   - yuiModuleMeta
 *       for any resource delivered as a YUI3 module
 *       the YUI3 module metadata
 *       (requires, langs, etc)
 *
 *   - yuiSortedPaths
 *       for any resource delivered as a YUI3 module
 *       a list of YUI modules required by the module,
 *       with transitive dependencies resolved
 *       format:  { yui-module-name: URL-to-load-yui-module }
 * </pre>
 *
 * @module MojitoServer
 * @class ResourceStore.server
 * @constructor
 * @param root {string} directory where application is found
 * @param libs {object} dependent libraries -- this param is mainly used
 *                      during unit testing
 */
function ServerStore(root, libs) {
    //logger.log('ctor(' + root + ')');
    this._root = root;
    this._version = '0.1.0';
    this._shortRoot = libpath.basename(root);
    this._libs = libs || {};

    // the static version of the appConfig (application.json)
    // It's "static" because it's determined at server-start time, and doesn't
    // change after that.
    this._appConfigStatic = null;

    // Each of these is a complex datastructure, the first key of which is the
    // resource ID ("resid").  (For mojitMeta, the first key is the mojit type
    // and the second key is resid.)
    // Under resid the next key is the affinity ("client", "server", or
    // "common".)
    // Under affinity is a datastructure that tracks all versions of the resource.
    // There is a special key "contexts" which lists all the contexts that the
    // resource has been specialized for.  "contexts" is an object.  The key is a
    // string that identifies the context, and the value is a partial context that
    // describes the specialization.  (An example might be "device=iphone" for
    // the key and { device:'iphone' } for the value.)
    // The rest of the keys are the context strings (as found in "contexts"), and
    // the values are the metadata about the resource versions.
    //      [resid][affinity].contexts
    //      [resid][affinity][ctxKey] = { metadata }
    // (These are mostly populated by the _preloadSetDest() method.)
    this._preload = {
        fwMeta: {},
        appMeta: {},
        mojitMeta: {}
    };

    // These are similar to the _preload above, except the affinity has been resolved
    // down for each environment ("client" or "server").  Also, the ctxKey has been
    // moved above resid to optimize lookup during runtime.
    this._fwMeta = {};              // [env][ctxKey][resid] = { parts }
    this._appMeta = {};             // [env][ctxKey][resid] = { parts }
    this._mojitMeta = {};           // [env][type][ctxKey][resid] = { parts }
    this._mojitYuiRequired = {};    // [env][type][ctxKey] = [ YUI module names ]
    this._mojitYuiSorted = {};      // [env][type][ctxKey] = [ YUI module names ]
    this._mojitYuiSortedPaths = {}; // [env][type][ctxKey][module] = path

    this._jsonCache = {};           // fullpath: contents as JSON object
    this._ycbCache = {};            // fullpath: context: YCB config object

    this._staticURLs = {};      // url => fullpath
    this._dynamicURLs = {};     // url => dynamic content
    this._mojitAssetRoots = {}; // mojitType => URL prefix
    this._mojitLangs = {};      // mojitType => [en-US,en-GB,en]
    this._mojitPaths = {};      // mojitType => filesystem directory of mojit

    this._expandInstanceCache = {   // [env][cacheKey] = instance
        client: {},
        server: {}
    };

    // TODO: bake this into the refactoring work.
    // this stuff is mainly so that we can send mocks during testing
    if (!this._libs.fs) {
        this._libs.fs = libfs;
    }
    if (!this._libs.path) {
        this._libs.path = libpath;
    }
    if (libycb && (!this._libs.ycb)) {
        this._libs.ycb = libycb;
    }
}


ServerStore.prototype = {

    // ===========================================
    // ================== PUBLIC =================


    /**
     * Preloads everything in the app, and as well pertinent parts of
     * the framework.
     *
     * @param {object} appContext the base context for reading configuration.
     * @param {object} appConfig overrides for the app config.
     * @return {nothing}
     */
    preload: function(appContext, appConfig) {
        //logger.log('preload()');
        var type,
            ctxKey,
            resid,
            res,
            n;

        if (!this._preload) {
            // we've already been preloaded
            // This situation mainly happens in the commandline scripts.
            return;
        }

        this._fwConfig = this._readConfigJSON(libpath.join(mojitoRoot,
            'config.json'));
        this._ycbDims = this._readYcbDimensions();
        this._validYCBDims = this._precalcValidYCBDimensions(
            this._ycbDims[0].dimensions
        );
        this._defaultYCBContext = appContext || {};

        // need to read the statically configured appConfig now so that values
        // are available during generation of the static URLs
        this._appConfigStatic = this._readAppConfigStatic();

        // generates URL's about each spec in application.json
        this._urlsForAppSpecs();

        // merge app configuration overrides
        if (appConfig) {
            for (n in appConfig) {
                if (appConfig.hasOwnProperty(n)) {
                    logger.log('overriding application config value: ' + n,
                        'warn');
                    this._appConfigStatic[n] = appConfig[n];
                }
            }
        }

        // generates metadata about each resource
        this._preloadMeta();

        // takes the preloaded info about each resource and resolves
        // version priority (.server. more specific that .common. etc)
        this._cookdown();

        // preread configs
        this._prereadConfigs(this._appMeta.server);
        for (type in this._mojitMeta.server) {
            if (this._mojitMeta.server.hasOwnProperty(type)) {
                this._prereadConfigs(this._mojitMeta.server[type]);
            }
        }

        // We need to run this function even for "ondemand", since it calculates
        // additional implied dependencies, such as a binder on MojitoClient,
        // or a controller on the view-engine needed to render its views.
        this._precalcYuiDependencies();

        // binders are client-side-only resources, yet we need to know about
        // them when talking about the 'server' environment
        for (type in this._mojitMeta.client) {
            if (this._mojitMeta.client.hasOwnProperty(type)) {

                for (ctxKey in this._mojitMeta.client[type]) {
                    if (this._mojitMeta.client[type].hasOwnProperty(ctxKey)) {

                        for (resid in this._mojitMeta.client[type][ctxKey]) {
                            if (this._mojitMeta.client[type][ctxKey].
                                    hasOwnProperty(resid)) {
                                res = this._mojitMeta.client[type
                                    ][ctxKey][resid];
                                if (res.type !== 'binder') {
                                    continue;
                                }
                                this._mojitMeta.server[type
                                    ][ctxKey][resid] = res;
                            }
                        }
                    }
                }
            }
        }
    },


    /**
     * Sets the logger object.
     *
     * @param l {object} object containing a log(message,level,source) function
     * @return {nothing}
     */
    setLogger: function(l) {
        logger = l;
    },


    /**
     * Returns, via callback, the fully expanded mojit instance specification.
     *
     * @param env {string} either "client" or "server"
     * @param id {string} the ID of the spec to return
     * @param context {object} the runtime context for the spec
     * @param callback {function(err,spec)} callback used to return the results (or error)
     * @return {nothing} results returned via the callback parameter
     */
    getSpec: function(env, id, context, callback) {

        this.expandInstanceForEnv(env, {base: id}, context, function(err, obj) {
            if (err) {
                callback(err);
                return;
            }

            if (env === 'client' && obj) {
                delete obj.assets;
            }

            callback(null, obj);
        });
    },


    /**
     * Returns, via callback, the details of the mojit type.
     *
     * @param env {string} either "client" or "server"
     * @param type {string} the mojit type
     * @param context {object} the runtime context for the spec
     * @param callback {function(err,spec)} callback used to return the results (or error)
     * @return {nothing} results returned via the callback parameter
     */
    getType: function(env, type, context, callback) {

        this.expandInstanceForEnv(env, {type: type}, context, function(err,
                                                                       obj) {
            if (err) {
                callback(err);
                return;
            }

            if (env === 'client' && obj) {
                delete obj.assets;
            }

            callback(null, obj);
        });
    },

    /**
     * This just calls expandInstanceForEnv() with `env` set to `server`.
     *
     * @param instance {map} Partial instance to expand.
     * @param ctx {object} The request context.
     * @param cb {function(err,instance)} callback used to return the results (or error)
     * @return {nothing} results returned via the callback parameter
     */
    expandInstance: function(instance, ctx, cb) {
        this.expandInstanceForEnv('server', instance, ctx, cb);
        return;
    },


    /**
     * This method takes a partial instance and expands it to all details needed
     * to run the mojit.
     *
     * Only `base` or `type` fields are required. You should only specify one.
     *
     * <pre>
     *  instance: {
     *      base: string
     *          // specifies a "base" instance which this instance will extend
     *          // the value refers to a key of `specs` in `application.json`
     *      type: string
     *          // specifies the mojit type
     *      action: "",
     *          // specifies a default action if the instance isn't dispatched
     *          // with a specific one.
     *      config: object
     *          // the config for the mojit
     *          // this will be augmented (appropriately) with the mojit type
     *          // defaults found in the type's `defaults.json`
     *      appConfig: object
     *          // the application config (appropriate for the context)
     *      assetRoot: "",
     *          // path to directory containing assets
     *          // the path will be a URL if `env` is `client` otherwise it's a
     *          // filesystem path
     *      definition: object
     *          // the body of the `defintion.json` for the mojit type
     *      defaults: object
     *          // the body of the `defaults.json` for the mojit type
     *      yui: {
     *          // details for generating a YUI sandbox for this instance
     *          config: {
     *              // configuration details for the YUI.GlobalConfig.groups (or
     *              // an equivalent).
     *              // The module paths are given as `fullpath` and contain
     *              // either a URL if `env' is `client` or a filesystem path if
     *              // `env` is `server`
     *          },
     *          requires: []
     *              // list of YUI modules that this instance requires
     *      }
     *      actions: array
     *          // list of paths to the YUI modules containing actions
     *      controller: string
     *          // path to controller
     *          // the path will be a URL if `env` is `client` otherwise it's a
     *          // filesystem path
     *      lang:
     *          // path to YUI module of the language bundle
     *          // the path will be a URL if `env` is `client` otherwise it's a
     *          // filesystem path
     *      models: object
     *          // list of models used by the mojit type
     *          // the key is the model name, and the value is the path to the
     *          // model file
     *          // the path will be a URL if `env` is `client` otherwise it's a
     *          // filesystem path
     *      views: {
     *          // list of views in the mojit type
     *          // the key is the view name, and the value is details about the
     *          // view
     *          view-name: {
     *              "content-path": "",
     *                  // the path to use to load the body of the view
     *                  // the path will be a URL if `env` is `client` otherwise
     *                  // it's a filesystem path
     *              "engine": "",
     *                  // which engine is used to render the view
     *              "binder-path": "",
     *                  // the path to the binder
     *                  // the path will be a URL if `env` is `client` otherwise
     *                  // it's a filesystem path
     *              "binder-module": ""
     *                  // the YUI module name of the binder
     *          }
     *      }
     *  }
     * </pre>
     *
     * @param env {string} "client" or "server"
     * @param instance {object} partial instance to expand
     * @param ctx {object} the runtime context for the instance
     * @param cb {function(err,instance)} callback used to return the results (or error)
     * @return {nothing} results returned via the callback parameter
     */
    expandInstanceForEnv: function(env, instance, ctx, cb) {
        //logger.log('expandInstanceForEnv(' + env + ',' +
        //    (instance.id||'@'+instance.type) + ')');
        var self = this, base,
            appConfig = this.getAppConfig(ctx, 'definition'),
            cacheKey = JSON.stringify(instance) + JSON.stringify(
                this._getValidYCBContext(ctx)
            ),
            cacheValue = this._expandInstanceCache[env][cacheKey];

        if (cacheValue) {
            cb(null, this._cloneObj(cacheValue));
            return;
        }

        function gotBase(out, fromBase) {
            var spec;

            // type details rebuilt every time
            delete out.actions;
            delete out.assetsRoot;
            delete out.assets;
            delete out.controller;
            delete out.defaults;
            delete out.definition;
            delete out.models;
            delete out.views;
            delete out.yui;

            out.config = out.config || {};
            out.action = out.action || 'index';
            if (!out.instanceId) {
                out.instanceId = Y.guid();
                //DEBUGGING:  out.instanceId += '-instance-server-' + out.type;
            }
            // DEPRECATED, kept in case a user is using it.
            out.guid = out.instanceId;

            try {
                self.getMojitTypeDetails(env, ctx, out.type, out);
            } catch (err) {
                return cb(err);
            }

            // apply type defaults to config
            if ((!fromBase) && out.defaults && out.defaults.config) {
                spec = self._cloneObj(out.defaults.config);
                self._mergeRecursive(spec, out.config);
                out.config = spec;
            }

            if (!out.appConfig) {
                out.appConfig = appConfig;
                delete out.appConfig.specs;
            }
            self._expandInstanceCache[env][cacheKey] = self._cloneObj(out);
            cb(null, out);
        }

        if (instance.base) {
            if (appConfig.specs) {
                base = appConfig.specs[instance.base];
            }
            if (!base) {
                return cb(new Error('Unknown "base" of "' + instance.base +
                    '"'));
            }
            // The base will need to carry it's ID with it.
            base.id = instance.base;
            this.expandInstanceForEnv(env, base, ctx, function(err,
                                                               baseInstance) {
                if (err) {
                    return cb(err);
                }
                var temp = baseInstance;
                self._mergeRecursive(temp, instance);
                gotBase(temp, true);
            });
        } else {
            gotBase(this._cloneObj(instance), false);
        }
    },


    /**
     * gets application configuration
     *
     * @param ctx {object} the runtime context under which to load the config
     * @param name {string} type of config to read:
     *     - definition:  reads ./application.json
     *     - package:  reads ./package.json
     *     - routes:  reads ./routes.json (or whatever was configured in
     *                  appConfig('definition').routesFiles)
     * @return {object} config object
     */
    getAppConfig: function(ctx, name) {
        //logger.log('getAppConfig('+name+')');
        var resid,
            res,
            ycb;

        if ('definition' === name && (!ctx || !Object.keys(ctx).length)) {
            return this._cloneObj(this._appConfigStatic);
        }

        resid = 'config-' + name;
        res = this._getContextualizedResource(this._appMeta.server, ctx, resid);
        if (!res) {
            return {};
        }
        ycb = this._readConfigYCB(ctx, res.fsPath, true);
        return this._cloneObj(ycb);
    },


    /**
     * Returns the routes configured in the application.
     *
     * @param ctx {object} runtime context under which to load the routes
     * @return {object} routes
     */
    getRoutes: function(ctx) {
        //logger.log('getRoutes()');
        var ress,
            resid,
            res,
            r,
            routes = {};

        // TODO: [Issue 100] trapped this error. It only appears when there is
        // no application.json
        try {
            ress = this._getResourceListForContext(this._appMeta.server, ctx);
        } catch (err) {
            //logger.log(err);
            ress = {};
        }

        for (resid in ress) {
            if (ress.hasOwnProperty(resid)) {
                res = ress[resid];
                if ('routes' !== res.configType) {
                    continue;
                }
                r = this._readConfigYCB(ctx, res.fsPath);
                this._mergeRecursive(routes, r);
            }
        }
        if (!Object.keys(routes).length) {
            routes = this._cloneObj(this._fwConfig.defaultRoutes);
        }
        return routes;
    },


    /**
     * Returns the filesystem location of the static URL.
     * Returns undefined if given URL isn't part of the app.
     *
     * @param url {string} static URL
     * @return {string} path on filesystem of specified URL, or undefined
     */
    fileFromStaticHandlerURL: function(url) {
        //logger.log('fileFromStaticHandlerURL('+url+')');
        return this._staticURLs[url];
    },


    /**
     * Returns the YUI configuration object which tells YUI about the
     * YUI modules in all the mojits.
     *
     * @param env {string} "client" or "server"
     * @param ctx {object} runtime context for YUI configuration
     * @return {object} YUI configuration for all mojits
     */
    getYuiConfigAllMojits: function(env, ctx) {
        // TODO: use getMojitTypeDetails() to generate this.
        //logger.log('getYuiConfigAllMojits('+env+')');
        var modules = {},
            type,
            ress,
            resid,
            res,
            ctxKey;

        for (type in this._mojitMeta[env]) {
            if (this._mojitMeta[env].hasOwnProperty(type)) {
                ress = this._getResourceListForContext(
                    this._mojitMeta[env][type],
                    ctx
                );
                for (resid in ress) {
                    if (ress.hasOwnProperty(resid)) {
                        res = ress[resid];
                        if (!res.yuiModuleName) {
                            continue;
                        }
                        if ('fw' === res.source) {
                            continue;
                        }
                        if ('app' === res.source) {
                            continue;
                        }
                        modules[res.yuiModuleName] = {
                            fullpath: ('client' === env) ?
                                    res.staticHandlerURL :
                                    res.fsPath,
                            requires: res.yuiModuleMeta.requires
                        };
                    }
                }

                // add all langs
                ress = this._getLangList(this._mojitMeta[env][type]);
                for (resid in ress) {
                    if (ress.hasOwnProperty(resid)) {
                        res = ress[resid];
                        modules[res.yuiModuleName] = {
                            fullpath: ('client' === env) ?
                                    res.staticHandlerURL :
                                    res.fsPath,
                            requires: res.yuiModuleMeta.requires
                        };
                    }
                }
            }
        }

        return {modules: modules};
    },


    /**
     * Returns the YUI configuration object which tells YUI about the
     * YUI modules in the Mojito framework.
     *
     * @param env {string} "client" or "server"
     * @param ctx {object} runtime context for YUI configuration
     * @return {object} YUI configuration for Mojito framework
     */
    getYuiConfigFw: function(env, ctx) {
        //logger.log('getYuiConfigFw('+env+')');
        var modules = {},
            ress,
            resid,
            res;

        if (!this._fwMeta[env]) {
            return {modules: {}};
        }
        ress = this._getResourceListForContext(this._fwMeta[env], ctx);
        for (resid in ress) {
            if (ress.hasOwnProperty(resid)) {
                res = ress[resid];
                if (!res.yuiModuleName) {
                    continue;
                }
                modules[res.yuiModuleName] = {
                    fullpath: ('client' === env) ?
                            res.staticHandlerURL :
                            res.fsPath,
                    requires: res.yuiModuleMeta.requires
                };
            }
        }
        return {modules: modules};
    },


    /**
     * Returns the YUI configuration object which tells YUI about the
     * YUI modules in the application (which aren't part of a mojit).
     *
     * @param env {string} "client" or "server"
     * @param ctx {object} runtime context for YUI configuration
     * @return {object} YUI configuration for the app-level modules
     */
    getYuiConfigApp: function(env, ctx) {
        //logger.log('getYuiConfigApp('+env+')');
        var modules = {},
            ress,
            resid,
            res;

        if (!this._appMeta[env]) {
            return {modules: {}};
        }
        ress = this._getResourceListForContext(this._appMeta[env], ctx);
        for (resid in ress) {
            if (ress.hasOwnProperty(resid)) {
                res = ress[resid];
                if (!res.yuiModuleName) {
                    continue;
                }
                modules[res.yuiModuleName] = {
                    fullpath: ('client' === env) ?
                            res.staticHandlerURL :
                            res.fsPath,
                    requires: res.yuiModuleMeta.requires
                };
            }
        }
        return {modules: modules};
    },


    /*
     * returns a serializeable object used to initialize Mojito on the client
     *
     * FUTURE: [Issue 105] Cache the output of this function
     * cache key:  all of ctx
     *
     * @param context {object} runtime context
     * @param instance {array} DEPRECATED:  list of instances to deploy to the client
     *                  (only instances with IDs will be deployable)
     * @return {object} object that should be serialized and used to initialize the MojitoClient
     */
    serializeClientStore: function(ctx, instances) {
        //logger.log('serializeClientStore()');
        var i,
            id,
            instance,
            type,
            types = {},
            out = {
                appConfig: {},
                specs: {},  // instance details
                mojits: {}, // type details
                routes: {}
            };

        out.appConfig = this.getAppConfig(ctx, 'definition');

        for (i = 0; i < instances.length; i += 1) {
            instance = instances[i];
            types[instance.type] = true;
            id = instance.id;
            if (id) {
                out.specs[id] = out.appConfig.specs[id];
            }
        }

        for (type in types) {
            if (types.hasOwnProperty(type)) {
                out.mojits[type] = {};
                this.getMojitTypeDetails('client', ctx, type, out.mojits[type]);
            }
        }

        out.routes = this.getRoutes(ctx);

        // these aren't needed on the client
        delete out.appConfig.mojitsDirs;
        delete out.appConfig.routesFiles;
        delete out.appConfig.specs;

        return out;
    },


    /**
     * Returns a list of all mojit types in the application.
     *
     * @param env {string} "client" or "server"
     * @return {array} list of mojit types
     */
    listAllMojits: function(env) {
        var mojitType,
            list = [];

        for (mojitType in this._mojitMeta[env]) {
            if (this._mojitMeta[env].hasOwnProperty(mojitType)) {
                list.push(mojitType);
            }
        }
        return list;
    },


    /**
     * Returns details about all mojits in the application.
     *
     * @param env {string} "client" or "server"
     * @param ctx {object} runtime context
     * @return {object} keys are mojit type names, values are details about each mojit
     */
    getAllMojits: function(env, ctx) {

        var mojits,
            mojit,
            list = {};

        if (!ctx) {
            ctx = {};
        }

        mojits = this.listAllMojits(env);

        for (mojit in mojits) {
            if (mojits.hasOwnProperty(mojit)) {
                list[mojits[mojit]] =
                    this.getMojitTypeDetails(env, ctx, mojits[mojit]);
            }
        }

        return list;
    },


    /*
     * Given a set of known contexts, finds the best match for a runtime context.
     * Gives special consideration to the "lang" key in the contexts.
     *
     * @param currentContext {object} runtime context
     * @param contexts {object} a mapping of context key to context
     * @return {string} null or the context key of the best match
     */
    _findBestContext: function(currentContext, contexts) {
        var availableLangs = [],
            bestCtxKey,
            bestLang,
            context,
            ctxKey,
            i,
            matchingKeys = [];

        // Collect languages from matching contexts
        // We're done if we find an exact match
        for (ctxKey in contexts) {
            if (contexts.hasOwnProperty(ctxKey)) {
                context = contexts[ctxKey];
                if (this._matchContext(currentContext, context)) {
                    if (context.lang) {
                        if (currentContext.lang === context.lang) {
                            bestCtxKey = ctxKey;
                            break;
                        }
                        availableLangs.push(context.lang);
                    }
                    matchingKeys.push(ctxKey);
                }
            }
        }

        // If no exact match, find the next best language
        if (!bestCtxKey && availableLangs && availableLangs.length &&
                currentContext && currentContext.lang) {
            bestLang = Y.Intl.lookupBestLang(currentContext.lang,
                availableLangs);
            if (bestLang) {
                for (i = 0; i < matchingKeys.length; i += 1) {
                    if (contexts[matchingKeys[i]].lang === bestLang) {
                        bestCtxKey = matchingKeys[i];
                        break;
                    }
                }
            }
        }

        return bestCtxKey ||
            (matchingKeys.length && matchingKeys[0]) ||
            null;
    },


    /**
     * Returns details about a mojit type.
     *
     * @param env {string} "client" or "server"
     * @param ctx {object} runtime context
     * @param mojitType {string} mojit type
     * @param dest {object} object in which to place the results
     * @return {object} returns the "dest" parameter, which has had details added to it
     */
    getMojitTypeDetails: function(env, ctx, mojitType, dest) {
        //logger.log('getMojitTypeDetails('+env+',ctx,'+mojitType+')');
        var ress,
            resid,
            res,
            name,
            engine,
            engines = {},
            ctxKey,
            assumeRollups = this._appConfigStatic.assumeRollups,
            usePrecomputed = -1 !== this._appConfigStatic.yui.
                dependencyCalculations.indexOf('precomputed'),
            useOnDemand = -1 !== this._appConfigStatic.yui.
                dependencyCalculations.indexOf('ondemand'),
            module,
            lddf,       // lang/datatype-date-format
            lddfPath;

        if (!usePrecomputed) {
            useOnDemand = true;
        }

        if (!dest) {
            dest = {};
        }

        if (!dest.actions) {
            dest.actions = [];
        }
        if (!dest.assets) {
            dest.assets = {};
        }
        if (!dest.models) {
            dest.models = {};
        }
        if (!dest.modelYUIModuleNames) {
            dest.modelYUIModuleNames = {};
        }
        if (!dest.views) {
            dest.views = {};
        }
        if (!dest.yui) {
            dest.yui = {config: {}, requires: []};
        }
        if (!dest.yui.config) {
            dest.yui.config = {modules: {}};
        }
        if (!dest.yui.config.modules) {
            dest.yui.config.modules = {};
        }
        if (!dest.yui.requires) {
            dest.yui.requires = [];
        }
        if (!dest.yui.langs) {
            dest.yui.langs = {};
        }

        if (usePrecomputed) {
            ctxKey = this._findBestContext(ctx,
                this._mojitYuiSorted[env][mojitType].contexts);
            dest.yui.requires =
                this._mojitYuiRequired[env][mojitType][ctxKey] || [];
            dest.yui.sorted =
                this._cloneObj(
                    this._mojitYuiSorted[env][mojitType][ctxKey] || []
                );
            dest.yui.sortedPaths =
                this._cloneObj(
                    this._mojitYuiSortedPaths[env][mojitType][ctxKey] || {}
                );
        }

        dest.assetsRoot = this._mojitAssetRoots[mojitType];
        dest.definition = this._getMojitConfig('server', ctx, mojitType,
            'definition');
        dest.defaults = this._getMojitConfig('server', ctx, mojitType,
            'defaults');

        ress = this._getResourceListForContext(this._mojitMeta[env][mojitType],
            ctx);
        for (resid in ress) {
            if (ress.hasOwnProperty(resid)) {

                res = ress[resid];

                if (res.type === 'action') {
                    if (env === 'client') {
                        if (assumeRollups) {
                            dest.actions.push(res.rollupURL);
                        } else {
                            dest.actions.push(res.staticHandlerURL);
                        }
                    } else {
                        dest.actions.push(res.fsPath);
                    }
                }

                if (res.type === 'asset') {
                    name = res.name + '.' + res.assetType;
                    if (env === 'client') {
                        if (assumeRollups) {
                            dest.assets[name] = res.rollupURL;
                        } else {
                            dest.assets[name] = res.staticHandlerURL;
                        }
                    } else {
                        dest.assets[name] = res.fsPath;
                    }
                }

                if (res.type === 'binder') {
                    if (!dest.views[res.name]) {
                        dest.views[res.name] = {};
                    }
                    dest.views[res.name]['binder-url'] = res.staticHandlerURL;
                    if (env === 'client') {
                        if (assumeRollups) {
                            dest.views[res.name]['binder-path'] = res.rollupURL;
                        } else {
                            dest.views[res.name]['binder-path'] =
                                res.staticHandlerURL;
                        }
                    } else {
                        dest.views[res.name]['binder-path'] = res.fsPath;
                    }
                    dest.views[res.name]['binder-module'] = res.yuiModuleName;
                    dest.views[res.name]['binder-yui-sorted'] =
                        res.yuiSortedPaths;
                    if ('server' === env) {
                        // don't do any other type of server-side processing for
                        // the binder ESPECIALLY don't add it to dest.yui.*
                        continue;
                    }
                }

                if (res.type === 'controller') {
                    // We need the YUI Module name of the contoller so we can
                    // select a language for it
                    dest.controllerModuleName = res.yuiModuleName;
                    if (env === 'client') {
                        if (assumeRollups) {
                            dest.controller = res.rollupURL;
                        } else {
                            dest.controller = res.staticHandlerURL;
                        }
                    } else {
                        dest.controller = res.fsPath;
                    }
                }

                if (res.type === 'model') {
                    if (env === 'client') {
                        if (assumeRollups) {
                            dest.models[res.name] = res.rollupURL;
                        } else {
                            dest.models[res.name] = res.staticHandlerURL;
                        }
                    } else {
                        dest.models[res.name] = res.fsPath;
                    }
                    if (res.yuiModuleName) {
                        dest.modelYUIModuleNames[res.yuiModuleName] = true;
                        //logger.log("Processing Models:" + res.name  + ":" +
                        //    res.yuiModuleName, 'mojito', NAME);
                    }
                }

                if (res.type === 'view') {
                    if (!dest.views[res.name]) {
                        dest.views[res.name] = {};
                    }
                    if (env === 'client') {
                        if (assumeRollups) {
                            dest.views[res.name]['content-path'] =
                                res.rollupURL;
                        } else {
                            dest.views[res.name]['content-path'] =
                                res.staticHandlerURL;
                        }
                    } else {
                        dest.views[res.name]['content-path'] = res.fsPath;
                    }
                    dest.views[res.name].engine = res.viewEngine;
                    engines[res.viewEngine] = true;
                }

                if (res.type === 'yui-lang') {
                    dest.yui.langs[res.langCode] = res.yuiModuleName;
                }

                if (res.yuiModuleName) {
                    if (res.addonType === 'view-engines') {
                        // we'll only load the viewEngines that we need
                        continue;
                    }
                    if (useOnDemand) {
                        dest.yui.requires.push(res.yuiModuleName);
                    }
                    if (('fw' === res.source) || ('app' === res.source)) {
                        continue;
                    }
                    dest.yui.config.modules[res.yuiModuleName] = {
                        fullpath: undefined,
                        requires: res.yuiModuleMeta.requires || []
                    };
                    if (env === 'client') {
                        if (assumeRollups) {
                            dest.yui.config.modules[res.yuiModuleName
                                ].fullpath = res.rollupURL;
                        } else {
                            dest.yui.config.modules[res.yuiModuleName
                                ].fullpath = res.staticHandlerURL;
                        }
                    } else {
                        dest.yui.config.modules[res.yuiModuleName].fullpath =
                            res.fsPath;
                    }

                    // If we have "lang" use it
                    if (this._mojitLangs[res.yuiModuleName]) {
                        this._mojitLangs[res.yuiModuleName].sort();
                        dest.yui.config.modules[res.yuiModuleName].lang =
                            this._mojitLangs[res.yuiModuleName];
                    }
                }
            }
        }
        for (engine in engines) {
            if (engines.hasOwnProperty(engine)) {
                resid = 'addon-view-engines-' + engine;
                res = this._getContextualizedResource(
                    this._mojitMeta[env][mojitType],
                    ctx,
                    resid
                );
                dest.yui.config.modules[res.yuiModuleName] = {
                    fullpath: ('client' === env) ?
                            res.staticHandlerURL :
                            res.fsPath,
                    requires: res.yuiModuleMeta.requires || []
                };
                if (useOnDemand) {
                    dest.yui.requires.push(res.yuiModuleName);
                }
            }
        }

        // We need to include -all- the langs since we don't know which will
        // actually be used.  dispatch() will cull that down to the right one.
        if (usePrecomputed) {
            for (name in dest.yui.langs) {
                if (dest.yui.langs.hasOwnProperty(name)) {
                    module = dest.yui.langs[name];
                    lddf = 'lang/datatype-date-format_' + (name || 'en');
                    if (dest.yui.sortedPaths[lddf]) {
                        lddfPath = dest.yui.sortedPaths[lddf].replace('_' +
                            name, '_MOJITOPLACEHOLDER');
                    }
                    if (!dest.yui.sortedPaths[module]) {
                        dest.yui.sorted.push(module);
                        dest.yui.sortedPaths[module] =
                            dest.yui.config.modules[module].fullpath;
                    }
                }
            }
            if (lddfPath) {
                for (name in dest.yui.langs) {
                    if (dest.yui.langs.hasOwnProperty(name)) {
                        lddf = 'lang/datatype-date-format_' + (name || 'en');
                        if (!dest.yui.sortedPaths[lddf]) {
                            dest.yui.sorted.push(lddf);
                            dest.yui.sortedPaths[lddf] =
                                lddfPath.replace('MOJITOPLACEHOLDER',
                                        (name || 'en'));
                        }
                    }
                }
            }
        }

        return dest;
    },


    /**
     * Returns details on how to make rollups for app-level resources.
     *
     * @param env {string} "client" or "server"
     * @param ctx {object} runtime context
     * @return {object} object describing where to put the rollup and what it should contain
     */
    getRollupsApp: function(env, ctx) {
        var dest = libpath.join(this._root, 'rollup.' + env + '.js'),
            srcs = [],
            ress,
            resid,
            res;

        ress = this._getResourceListForContext(this._fwMeta[env], ctx);
        for (resid in ress) {
            if (ress.hasOwnProperty(resid)) {
                res = ress[resid];
                if (!res.yuiModuleName) {
                    continue;
                }
                srcs.push(res.fsPath);
            }
        }
        if (this._appMeta[env]) {
            ress = this._getResourceListForContext(this._appMeta[env], ctx);
            for (resid in ress) {
                if (ress.hasOwnProperty(resid)) {
                    res = ress[resid];
                    if (!res.yuiModuleName) {
                        continue;
                    }
                    srcs.push(res.fsPath);
                }
            }
        }
        return {
            dest: dest,
            srcs: srcs
        };
    },


    /**
     * Returns details on how to make rollups for mojit-level resources.
     *
     * This example comes from GSG5.
     * { FlickrDetail:
     *      dest: '/blah/blah/mojits/FlickrDetail/rollup.client.js'
     *      srcs: [
     *          '/blah/blah/mojits/FlickrDetail/controller.common.js',
     *          '/blah/blah/mojits/FlickrDetail/binders/index.js',
     *          '/blah/blah/mojits/FlickrDetail/lang/FlickrDetail_de.js',
     *          '/blah/blah/mojits/FlickrDetail/lang/FlickrDetail_en-US.js'
     *      ]
     * }
     *
     * @param env {string} "client" or "server"
     * @param ctx {object} runtime context
     * @return {object} object describing where to put the rollup and what it should contain
     */
    getRollupsMojits: function(env, ctx) {
        var mojitName,
            ress,
            resid,
            res,
            dest,
            srcs,
            rollups = {},
            mojitoMojits = libpath.join(mojitoRoot, 'mojits');

        for (mojitName in this._mojitMeta[env]) {
            if (this._mojitMeta[env].hasOwnProperty(mojitName)) {
                srcs = [];
                ress = this._getResourceListForContext(
                    this._mojitMeta[env][mojitName],
                    ctx
                );
                for (resid in ress) {
                    if (ress.hasOwnProperty(resid)) {
                        res = ress[resid];
                        if (res.source !== 'mojit') {
                            continue;
                        }
                        if (!res.yuiModuleName) {
                            continue;
                        }
                        srcs.push(res.fsPath);
                    }
                }
                dest = libpath.join(this._mojitPaths[mojitName], 'rollup.' +
                    env + '.js');
                if (dest.indexOf(mojitoMojits) === 0) {
                    // we shouldn't write to the mojits that ship with Mojito
                    dest = false;
                }
                if (dest && srcs.length) {
                    rollups[mojitName] = {
                        dest: dest,
                        srcs: srcs
                    };
                }
            }
        }
        return rollups;
    },


    /**
     * Returns details on how to make inline CSS for mojits.
     *
     * This example comes from (a modified) GSG5.
     * [ {
     *      context: { device: 'iphone' },
     *      mojitName: 'FlickrDetail',
     *      yuiModuleName: 'inlinecss/FlickrDetail',
     *      dest: '/blah/mojits/FlickrDetail/autoload/compiled' +
     *          '/css.iphone.client.js',
     *      srcs: {
     *          '/static/FlickrDetail/assets/index.css':
     *          '    /blah/mojits/FlickrDetail/assets/index.iphone.css',
     *          '/static/FlickrDetail/assets/message.css':
     *          '    /blah/mojits/FlickrDetail/assets/message.css'
     *   }
     * ]
     *
     * @param env {string} "client" or "server"
     * @param ctxFilter {object} (optional) runtime context to restrict results to
     * @return {array} object describing where to put the inline CSS file and what it should contain
     */
    getInlineCssMojits: function(env, ctxFilter) {
        var mojitName,
            ctxKey,
            ctx,
            ress,
            resid,
            res,
            selector,
            dest,
            srcs,
            inlines = [],
            mojitoMojits = libpath.join(mojitoRoot, 'mojits');

        // This will make our test later a little easier.
        if (typeof ctxFilter === 'object' && !Object.keys(ctxFilter).length) {
            ctxFilter = null;
        }

        for (mojitName in this._mojitMeta[env]) {
            if (this._mojitMeta[env].hasOwnProperty(mojitName)) {
                for (ctxKey in this._mojitMeta[env][mojitName].contexts) {
                    if (this._mojitMeta[env][mojitName
                            ].contexts.hasOwnProperty(ctxKey)) {
                        ctx = this._mojitMeta[env][mojitName].contexts[ctxKey];
                        if (ctxFilter && !this._matchContext(ctx, ctxFilter)) {
                            continue;
                        }

                        ress = this._cloneObj(this._mojitMeta[env
                            ][mojitName]['*']);
                        if ('*' !== ctxKey) {
                            ress = this._mergeRecursive(ress,
                                this._mojitMeta[env][mojitName][ctxKey]);
                        }
                        srcs = [];
                        for (resid in ress) {
                            if (ress.hasOwnProperty(resid)) {
                                res = ress[resid];
                                if (res.source !== 'mojit') {
                                    continue;
                                }
                                if ((res.type !== 'asset') ||
                                        (res.assetType !== 'css')) {
                                    continue;
                                }
                                srcs[res.staticHandlerURL] = res.fsPath;
                            }
                        }
                        selector = this._selectorFromContext(ctx);
                        dest = 'autoload/compiled/inlinecss' + (selector ? '.' +
                            selector : '') + '.common.js';
                        dest = libpath.join(this._mojitPaths[mojitName], dest);
                        if (dest.indexOf(mojitoMojits) === 0) {
                            // we shouldn't write to the mojits that ship with
                            // Mojito
                            continue;
                        }
                        if (Object.keys(srcs).length) {
                            inlines.push({
                                context: ctx,
                                mojitName: mojitName,
                                yuiModuleName: 'inlinecss/' + mojitName,
                                dest: dest,
                                srcs: srcs
                            });
                        }

                    } // has
                } // foreach ctxKey
            } // has
        } // foreach mojit
        return inlines;
    },


    // ===========================================
    // ================= PRIVATE =================

    /*
     * the "static" version of the application.json is the version that has
     * the context applied that was given at server-start time.
     */
    _readAppConfigStatic: function() {
        var path = libpath.join(this._root, 'application.json'),
            config = this._cloneObj(this._fwConfig.appConfigBase),
            appConfig;

        if (this._libs.path.existsSync(path)) {
            appConfig = this._readConfigYCB({}, path);
            this._mergeRecursive(config, appConfig);
        }

        return config;
    },


    /*
     * Read the application's dimensions.json file for YCB processing. If not
     * available, fall back to the framework's default dimensions.json.
     *
     * @return {array}
     */
    _readYcbDimensions: function() {
        var libpath = this._libs.path,
            path = libpath.join(this._root, 'dimensions.json'),
            dims;

        if (!libpath.existsSync(path)) {
            path = libpath.join(mojitoRoot, 'dimensions.json');
        }

        dims = this._readConfigJSON(path);
        if (!this._isValidYcbDimensions(dims)) {
            throw new Error('Invalid dimensions.json: ' + path);
        }
        return dims;
    },


    /*
     * Perform some light validation for YCB dimensions JSON objects. It should
     * look something like this:
     * [{
     *     "dimensions": [
     *         "dim1": {},
     *         "dim2": {},
     *         ...
     *     ]
     * }]
     *
     * @param {array} dimensions
     * @return {boolean}
     */
    _isValidYcbDimensions: function(dims) {
        var isArray = Y.Lang.isArray;

        return isArray(dims) &&
            dims.length === 1 &&
            isArray(dims[0].dimensions) &&
            dims[0].dimensions.length > 0;
    },


    // TODO: [Issue 109] work out story for this stage.
    /*
     * preload metadata about all resources in the application (and Mojito framework)
     */
    _preloadMeta: function() {
        var i,
            path,
            realDirs = [];

        // All the contents of the app/ directory are "app-level" resource 
        // (resources for mojits which are applied to -all- mojits)
        // (A better name might have been "global" instead of "app-level".)
        this._preloadDirMojit('fw', false, libpath.join(mojitoRoot, 'app'));

        this._preloadDirMojits(false, libpath.join(mojitoRoot, 'app', 'mojits'));

        this._preloadFileConfig(this._preload.appMeta, 'app', null,
            libpath.join(this._root, 'application.json'), 'definition');

        // read app-level resources
        this._preloadDirMojit('app', false, this._root);

        // TODO: [Issue 109] split loops into separate functions (for readability).

        // load routes file(s)
        for (i = 0; i < this._appConfigStatic.routesFiles.length; i += 1) {
            path = this._appConfigStatic.routesFiles[i];
            if ('/' !== path.charAt(0)) {
                path = libpath.join(this._root, path);
            }
            this._preloadFileConfig(this._preload.appMeta, 'app', null, path,
                'routes');
        }

        // load mojitsDirs
        for (i = 0; i < this._appConfigStatic.mojitsDirs.length; i += 1) {
            path = this._appConfigStatic.mojitsDirs[i];
            if ('/' !== path.charAt(0)) {
                path = libpath.join(this._root, path);
            }
            libglob.globSync(path, {}, realDirs);
        }
        if (!realDirs.length) {
            throw new Error('Failed to find any mojitsDirs matching ' +
                this._appConfigStatic.mojitsDirs.join(', '));
        }
        for (i = 0; i < realDirs.length; i += 1) {
            path = realDirs[i];
            this._preloadDirMojits(true, path);
        }

        // load mojitDirs
        if (this._appConfigStatic.mojitDirs &&
                this._appConfigStatic.mojitDirs.length) {
            realDirs = [];
            for (i = 0; i < this._appConfigStatic.mojitDirs.length; i += 1) {
                path = this._appConfigStatic.mojitDirs[i];
                if ('/' !== path.charAt(0)) {
                    path = libpath.join(this._root, path);
                }
                libglob.globSync(path, {}, realDirs);
            }
            if (!realDirs.length) {
                throw new Error('Failed to find any mojitDirs matching ' +
                    this._appConfigStatic.mojitDirs.join(', '));
            }
            for (i = 0; i < realDirs.length; i += 1) {
                path = realDirs[i];
                this._preloadDirMojit('mojit', true, path);
            }
        }
    },


    /*
     * preloads metadata for mojits in a directory
     */
    _preloadDirMojits: function(readConfig, fullpath) {
        if (!this._libs.path.existsSync(fullpath)) {
            return;
        }
        //logger.log('----------------------- preloadDirMojits(' + readConfig +
        //    ') -- ' + fullpath);
        var children = this._sortedReaddirSync(fullpath),
            i,
            childName,
            childPath;

        for (i = 0; i < children.length; i += 1) {
            childName = children[i];
            if ('.' === childName.substring(0, 1)) {
                continue;
            }
            childPath = libpath.join(fullpath, childName);
            this._preloadDirMojit('mojit', readConfig, childPath);
        }
    },


    /*
     * preloads metadata for resources in a directory which contains a single mojit
     *
     * @param source {string} "fw", "app" or "mojit"
     * @param readConfig {boolean} whether to read the config files in the mojit
     * @param fullpath {string}
     * @return {nothing} results stored in this object
     */
    _preloadDirMojit: function(source, readConfig, fullpath) {
        if (!this._libs.path.existsSync(fullpath)) {
            return;
        }
        //logger.log('----------------------- preloadDirMojit(' +
        //    source + ',' + readConfig + ') -- ' + fullpath);
        var packageJson,
            definitionJson,
            mojitType,
            dest,
            appConfig,
            urlPrefix,
            url;

        if (readConfig && 'mojit' === source) {
            packageJson = this._readMojitConfigFile(libpath.join(fullpath,
                'package.json'), false);
            mojitType = packageJson.name;

            definitionJson = this._readMojitConfigFile(libpath.join(fullpath,
                'definition.json'), true);
            if (definitionJson.appLevel) {
                source = 'app';
            }
        }
        if (!mojitType) {
            mojitType = libpath.basename(fullpath);
        }
        this._mojitPaths[mojitType] = fullpath;

        switch (source) {
        case 'fw':
            dest = this._preload.fwMeta;
            break;
        case 'app':
            dest = this._preload.appMeta;
            break;
        case 'mojit':
            if (!this._preload.mojitMeta[mojitType]) {
                this._preload.mojitMeta[mojitType] = {};
            }
            dest = this._preload.mojitMeta[mojitType];
            break;
        }

        // TODO: [Issue 109] refactor to return semantics.

        if (readConfig && 'fw' !== source) {
            if (!this._mojitoVersionMatch(packageJson, this._version)) {
                logger.log('Mojito version mismatch: mojit skipped in "' +
                    fullpath + '"', 'warn', NAME);
                return;
            }
            // TODO:  this might benefit from passing mojitType to it
            this._mojitPackageAsAsset(packageJson, fullpath);
        }

        if ('mojit' === source) {
            // TODO: [Issue 109] make this more future-proof.
            this._preloadFileController(dest, source, mojitType,
                libpath.join(fullpath, 'controller.common.js'), fullpath);
            this._preloadFileController(dest, source, mojitType,
                libpath.join(fullpath, 'controller.client.js'), fullpath);
            this._preloadFileController(dest, source, mojitType,
                libpath.join(fullpath, 'controller.server.js'), fullpath);
        }
        if (readConfig) {
            this._preloadFileConfig(dest, source, mojitType,
                libpath.join(fullpath, 'definition.json'), 'definition');
            this._preloadFileConfig(dest, source, mojitType,
                libpath.join(fullpath, 'defaults.json'), 'defaults');
        }

        // TODO: [Issue 109] pass actual functions (instead of function names)
        // TODO: [Issue 109] refactor:  first, use a method that returns all
        // files in dir (with ext), then call _preloadFileX on them
        this._preloadDir(dest, source, mojitType, libpath.join(fullpath,
            'actions'), false, '_preloadFileAction');
        this._preloadDir(dest, source, mojitType, libpath.join(fullpath,
            'addons'), true, '_preloadFileAddon');
        this._preloadDir(dest, source, mojitType, libpath.join(fullpath,
            'assets'), true, '_preloadFileAsset');
        this._preloadDir(dest, source, mojitType, libpath.join(fullpath,
            'autoload'), true, '_preloadFileAutoload');
        this._preloadDir(dest, source, mojitType, libpath.join(fullpath,
            'binders'), true, '_preloadFileBinder');
        this._preloadDir(dest, source, mojitType, libpath.join(fullpath,
            'lang'), false, '_preloadFileLang');
        this._preloadDir(dest, source, mojitType, libpath.join(fullpath,
            'models'), false, '_preloadFileModel');
        this._preloadDir(dest, source, mojitType, libpath.join(fullpath,
            'views'), true, '_preloadFileView');
        this._preloadDir(dest, source, mojitType, libpath.join(fullpath,
            'specs'), false, '_preloadFileSpec');
        this._preloadDir(dest, source, mojitType, libpath.join(fullpath,
            'tests'), false, '_preloadFileAutoload');
        this._preloadDir(dest, source, mojitType, libpath.join(fullpath,
            'tests/models'), false, '_preloadFileAutoload');
        this._preloadDir(dest, source, mojitType, libpath.join(fullpath,
            'tests/binders'), false, '_preloadFileAutoload');

        /*
         * Here we are making a URL for the expanded "definition.json"
         * The URL we make does not map to a real file, it is used by the tunnel
         * to ID the and expand the actual "definition.json".
         */
        if ('mojit' === source) {

            // TODO: [Issue 109] re-use logic from
            // _calcStaticHandlerURL() for prefix (so that all options are
            // supported)

            appConfig = this._appConfigStatic.staticHandling || {};
            urlPrefix = '/static';
            if (typeof appConfig.prefix !== 'undefined') {
                urlPrefix = appConfig.prefix ? '/' + appConfig.prefix : '';
            }

            // Add our definition to the Dynamic URLs list
            url = urlPrefix + '/' + mojitType + '/definition.json';
            this._dynamicURLs[url] = libpath.join(fullpath, 'definition.json');
        }
    },


    /*
     * preloads metadata for resources in a directory
     *
     * @param dest {object} where results shoulg go (passed to fileHandler)
     * @param source {string} where the resource is coming from (passed to fileHandler)
     * @param mojitType {string} name of mojit type (passed to fileHandler)
     * @param fullpath {string} path of directory
     * @param recurse {boolean} whether to recurse into subdirectories
     * @param fileHandler {string} name of method on this object to call on each file
     * @param root {string} when recursing, fullpath of first call (passed to fileHandler)
     * @return {nothing} calls fileHandler to do the actual insteresting work
     */
    _preloadDir: function(dest, source, mojitType, fullpath, recurse,
            fileHandler, root) {
        if (!this._libs.path.existsSync(fullpath)) {
            return;
        }
        //logger.log('----------------------- preloadDir(' + recurse + ',' +
        //    fileHandler + ') -- ' + fullpath);
        var children = this._sortedReaddirSync(fullpath),
            i,
            childName,
            childPath,
            childStat;

        if (!root) {
            root = fullpath;
        }
        for (i = 0; i < children.length; i += 1) {
            childName = children[i];
            if ('.' === childName.substring(0, 1)) {
                continue;
            }
            childPath = libpath.join(fullpath, childName);
            childStat = this._libs.fs.statSync(childPath);
            if (childStat.isFile()) {
                this[fileHandler](dest, source, mojitType, childPath, root);
            } else if (recurse && childStat.isDirectory()) {
                this._preloadDir(dest, source, mojitType, childPath, recurse,
                    fileHandler, root);
            }
        }
    },


    /*
     * preloads metadata for a resource which is an action
     *
     * @param dest {object} where to store the metadata of the resource
     * @param source {string} "fw", "app", or "mojit"
     * @param mojitType {string} name of mojit type, might be null
     * @param fullpath {string} path to resource
     * @param dir {string} base directory of resource type
     * @return {nothing} results stored in this object
     */
    _preloadFileAction: function(dest, source, mojitType, fullpath, dir) {
        if (!this._libs.path.existsSync(fullpath)) {
            return;
        }
        if ('.js' !== libpath.extname(fullpath)) {
            return;
        }
        //logger.log('----------------------- preloadFileActions -- ' +
        //    fullpath);
        var resid, res = {},
            pathParts = this._parsePath(fullpath, 'server', dir);
        if (this._skipBadPath(pathParts)) {
            return;
        }

        res.type = 'action';
        res.fsPath = fullpath;
        res.source = source;
        res.name = pathParts.name;
        this._precalcYuiModule(res);
        this._precalcStaticURL(res, mojitType);
        resid = 'action-' + res.name;

        this._preloadSetDest(dest, resid, res, pathParts);
    },


    /*
     * preloads metadata for a resource which is an addon
     *
     * @param dest {object} where to store the metadata of the resource
     * @param source {string} "fw", "app", or "mojit"
     * @param mojitType {string} name of mojit type, might be null
     * @param fullpath {string} path to resource
     * @param dir {string} base directory of resource type
     * @return {nothing} results stored in this object
     */
    _preloadFileAddon: function(dest, source, mojitType, fullpath, dir) {
        if (!this._libs.path.existsSync(fullpath)) {
            return;
        }
        if ('.js' !== libpath.extname(fullpath)) {
            return;
        }
        //logger.log('----------------------- preloadFileAddon -- ' + fullpath);
        var resid,
            res = {},
            pathParts = this._parsePath(fullpath, 'server', dir);
        if (this._skipBadPath(pathParts)) {
            return;
        }

        res.type = 'addon';
        res.addonType = libpath.dirname(pathParts.name);
        res.fsPath = fullpath;
        res.source = source;
        res.name = libpath.basename(pathParts.name);
        this._precalcYuiModule(res);
        this._precalcStaticURL(res, mojitType);
        resid = 'addon-' + res.addonType + '-' + res.name;

        this._preloadSetDest(dest, resid, res, pathParts);
    },


    /*
     * preloads metadata for a resource which is an asset
     *
     * @param dest {object} where to store the metadata of the resource
     * @param source {string} "fw", "app", or "mojit"
     * @param mojitType {string} name of mojit type, might be null
     * @param fullpath {string} path to resource
     * @param dir {string} base directory of resource type
     * @return {nothing} results stored in this object
     */
    _preloadFileAsset: function(dest, source, mojitType, fullpath, dir) {
        if (!this._libs.path.existsSync(fullpath)) {
            return;
        }
        //logger.log('----------------------- preloadFileAsset -- ' + fullpath);
        var resid,
            res = {},
            pathParts = this._parsePath(fullpath, 'common', dir);

        // All assets are "common", and we want to support the
        // shortcut of "assets/foo.iphone.css".
        pathParts.affinity = 'common';
        if (this._skipBadPath(pathParts)) {
            return;
        }

        res.type = 'asset';
        res.fsPath = fullpath;
        res.source = source;
        res.assetType = pathParts.ext.substr(1);
        res.name = pathParts.name;
        res.relpath = pathParts.relpath;
        this._precalcStaticURL(res, mojitType);
        resid = 'asset-' + res.assetType + '-' + res.name;

        this._preloadSetDest(dest, resid, res, pathParts);
    },


    /*
     * preloads metadata for a resource which is an "autoload"
     *
     * @param dest {object} where to store the metadata of the resource
     * @param source {string} "fw", "app", or "mojit"
     * @param mojitType {string} name of mojit type, might be null
     * @param fullpath {string} path to resource
     * @param dir {string} base directory of resource type
     * @return {nothing} results stored in this object
     */
    _preloadFileAutoload: function(dest, source, mojitType, fullpath, dir) {
        if (!this._libs.path.existsSync(fullpath)) {
            return;
        }
        if ('.js' !== libpath.extname(fullpath)) {
            return;
        }
        //logger.log('----------------------- preloadFileAutoload -- ' +
        //    fullpath);
        var resid,
            res = {},
            pathParts = this._parsePath(fullpath, 'server', dir);

        if (pathParts.affinity.type) {
            // This allows the app config to specify that some "client" affinity
            // code should not be deployed if it has an "optional" subtype
            if (this._appConfigStatic.deferAllOptionalAutoloads &&
                    pathParts.affinity.type === 'optional') {
                pathParts.affinity = 'none';
            } else if (pathParts.affinity.type === 'tests' &&
                    this._appConfigStatic.env !== 'test') {
                // this filters tests from being included with deployed
                // applications
                pathParts.affinity = 'none';
            }
        }
        if ('none' === pathParts.affinity) {
            return;
        }
        if (this._skipBadPath(pathParts)) {
            return;
        }

        res.type = 'yui-module';
        res.fsPath = fullpath;
        res.source = source;
        this._precalcYuiModule(res);
        if (!res.yuiModuleName) {
            if ('.js' === pathParts.ext) {
                throw new Error('Expected YUI3 module in ' + fullpath);
            }
            return;
        }
        this._precalcStaticURL(res, mojitType);
        resid = 'yui-module-' + res.yuiModuleName;

        this._preloadSetDest(dest, resid, res, pathParts);
    },


    /*
     * preloads metadata for a resource which is a binder
     *
     * @param dest {object} where to store the metadata of the resource
     * @param source {string} "fw", "app", or "mojit"
     * @param mojitType {string} name of mojit type, might be null
     * @param fullpath {string} path to resource
     * @param dir {string} base directory of resource type
     * @return {nothing} results stored in this object
     */
    _preloadFileBinder: function(dest, source, mojitType, fullpath, dir) {
        if (!this._libs.path.existsSync(fullpath)) {
            return;
        }
        if ('.js' !== libpath.extname(fullpath)) {
            return;
        }
        //logger.log('----------------------- preloadFileBinder -- ' +
        //    fullpath);
        var resid,
            res = {},
            pathParts = this._parsePath(fullpath, 'client', dir);
        if (this._skipBadPath(pathParts)) {
            return;
        }

        res.type = 'binder';
        res.fsPath = fullpath;
        res.source = source;
        res.name = pathParts.name;
        this._precalcYuiModule(res);
        this._precalcStaticURL(res, mojitType);
        resid = 'binder-' + res.name;

        this._preloadSetDest(dest, resid, res, pathParts);
    },


    /*
     * preloads metadata for a resource which is a configuration file
     *
     * @param dest {object} where to store the metadata of the resource
     * @param source {string} "fw", "app", or "mojit"
     * @param mojitType {string} name of mojit type, might be null
     * @param fullpath {string} path to resource
     * @param dir {string} base directory of resource type
     * @return {nothing} results stored in this object
     */
    _preloadFileConfig: function(dest, source, mojitType, fullpath, type) {
        if (!this._libs.path.existsSync(fullpath)) {
            return;
        }
        //logger.log('----------------------- preloadFileConfig(' + type +
        //    ') -- ' + fullpath);
        var resid,
            res = {},
            pathParts = this._parsePath(fullpath, 'server', null);
        if (this._skipBadPath(pathParts)) {
            return;
        }

        res.type = 'config';
        res.configType = type;
        res.fsPath = fullpath;
        res.source = source;
        resid = 'config-' + type;
        if ('routes' === type) {
            resid += '-' + pathParts.name;
        }

        this._preloadSetDest(dest, resid, res, pathParts);
    },


    /*
     * preloads metadata for a resource which is a controller
     *
     * @param dest {object} where to store the metadata of the resource
     * @param source {string} "fw", "app", or "mojit"
     * @param mojitType {string} name of mojit type, might be null
     * @param fullpath {string} path to resource
     * @param dir {string} base directory of resource type
     * @return {nothing} results stored in this object
     */
    _preloadFileController: function(dest, source, mojitType, fullpath, dir) {
        if (!this._libs.path.existsSync(fullpath)) {
            return;
        }
        if ('.js' !== libpath.extname(fullpath)) {
            return;
        }
        //logger.log('----------------------- preloadFileController -- ' +
        //    fullpath);
        var resid,
            res = {},
            pathParts = this._parsePath(fullpath, 'server', dir);
        if (this._skipBadPath(pathParts)) {
            return;
        }

        res.type = 'controller';
        res.fsPath = fullpath;
        res.source = source;
        this._precalcYuiModule(res);
        this._precalcStaticURL(res, mojitType);
        resid = 'controller';

        this._preloadSetDest(dest, resid, res, pathParts);
    },


    /*
     * preloads metadata for a resource which is a language bundle
     *
     * @param dest {object} where to store the metadata of the resource
     * @param source {string} "fw", "app", or "mojit"
     * @param mojitType {string} name of mojit type, might be null
     * @param fullpath {string} path to resource
     * @param dir {string} base directory of resource type
     * @return {nothing} results stored in this object
     */
    _preloadFileLang: function(dest, source, mojitType, fullpath, dir) {
        if (!this._libs.path.existsSync(fullpath)) {
            return;
        }
        if ('.js' !== libpath.extname(fullpath)) {
            return;
        }
        //logger.log('----------------------- preloadFileLang -- ' + fullpath);
        var resid,
            res = {},
            pathParts = {},
            matches,
            code;

        // YUI-intl doesn't support our ".affinity." filename syntax.
        pathParts.ext = libpath.extname(fullpath);
        pathParts.shortpath = libpath.basename(fullpath, pathParts.ext);
        if (this._skipBadPath(pathParts)) {
            return;
        }

        // There is not a "lang" for the default language file
        matches = pathParts.shortpath.match(/^([^_]+)(?:_([^_.]+))?$/) || [];

        // TODO: [Issue 10] Check this as we could have names with
        // underscores YUI-intl expects default language to have no code on the
        // filename. (In practice it's 'en', but don't assume that here.)
        code = matches[2] || '';

        res.type = 'yui-lang';
        res.fsPath = fullpath;
        res.source = source;
        res.langCode = code;
        this._precalcYuiModule(res);
        this._precalcStaticURL(res, mojitType);
        resid = 'yui-lang-' + pathParts.shortpath;

        // Check the mojitType has a "lang" entry
        if (!this._mojitLangs[mojitType]) {
            this._mojitLangs[mojitType] = [];
        }

        // If we have a "lang" code add it to the list
        if (code) {
            this._mojitLangs[mojitType].push(code);
        }

        pathParts.affinity = 'common';
        pathParts.contextKey = 'lang=' + code;
        pathParts.contextParts = {lang: code};
        this._preloadSetDest(dest, resid, res, pathParts);
    },


    /*
     * preloads metadata for a resource which is a model
     *
     * @param dest {object} where to store the metadata of the resource
     * @param source {string} "fw", "app", or "mojit"
     * @param mojitType {string} name of mojit type, might be null
     * @param fullpath {string} path to resource
     * @param dir {string} base directory of resource type
     * @return {nothing} results stored in this object
     */
    _preloadFileModel: function(dest, source, mojitType, fullpath, dir) {
        if (!this._libs.path.existsSync(fullpath)) {
            return;
        }
        if ('.js' !== libpath.extname(fullpath)) {
            return;
        }
        //logger.log('----------------------- preloadFileModel -- ' + fullpath);
        var resid,
            res = {},
            pathParts = this._parsePath(fullpath, 'server', dir);
        if (this._skipBadPath(pathParts)) {
            return;
        }

        res.type = 'model';
        res.fsPath = fullpath;
        res.source = source;
        res.name = pathParts.name;
        this._precalcYuiModule(res);
        this._precalcStaticURL(res, mojitType);
        resid = 'model-' + res.yuiModuleName;

        this._preloadSetDest(dest, resid, res, pathParts);
    },


    /*
     * preloads metadata for a resource which is a mojit instance specification
     *
     * @param dest {object} where to store the metadata of the resource
     * @param source {string} "fw", "app", or "mojit"
     * @param mojitType {string} name of mojit type, might be null
     * @param fullpath {string} path to resource
     * @param dir {string} base directory of resource type
     * @return {nothing} results stored in this object
     */
    _preloadFileSpec: function(dest, source, mojitType, fullpath, dir) {
        var name,
            url,
            config,
            appConfig,
            prefix;

        if (!this._libs.path.existsSync(fullpath)) {
            return;
        }

        appConfig = this._appConfigStatic.staticHandling || {};
        prefix = '/static';
        if (typeof appConfig.prefix !== 'undefined') {
            prefix = appConfig.prefix ? '/' + appConfig.prefix : '';
        }

        // TODO:  this might benefit from using _parsePath()

        // Set the URL of the spec
        url = prefix + '/' + mojitType + '/specs/' + libpath.basename(fullpath);

        // Set the name to the mojit type (this is for namespacing)
        name = mojitType;

        // If the filename is not "default" add it to the spec name
        if (libpath.basename(fullpath) !== 'default.json') {
            name += ':' +
                libpath.basename(fullpath).split('.').slice(0, -1).join('.');
        }

        config = this._readConfigYCB({}, fullpath);

        // Just incase this has not been made
        if (!this._appConfigStatic.specs) {
            this._appConfigStatic.specs = {};
        }

        // Add our spec to the specs map
        this._appConfigStatic.specs[name] = config;

        // Add our spec to the Dynamic URLs list
        this._dynamicURLs[url] = fullpath;
    },


    /*
     * preloads metadata for a resource which is a view
     *
     * @param dest {object} where to store the metadata of the resource
     * @param source {string} "fw", "app", or "mojit"
     * @param mojitType {string} name of mojit type, might be null
     * @param fullpath {string} path to resource
     * @param dir {string} base directory of resource type
     * @return {nothing} results stored in this object
     */
    _preloadFileView: function(dest, source, mojitType, fullpath, dir) {
        if (!this._libs.path.existsSync(fullpath)) {
            return;
        }
        //logger.log('----------------------- preloadFileView -- ' + fullpath);
        var resid,
            res = {},
            parts,
            pathParts = {affinity: 'common', contextKey: '*', contextParts: {}};

        // views don't support our ".affinity." filename syntax.
        pathParts.ext = libpath.extname(fullpath);
        dir = libpath.join(dir, '/');
        pathParts.relpath = fullpath.substr(dir.length);
        pathParts.shortpath = libpath.basename(fullpath, pathParts.ext);
        parts = pathParts.shortpath.split('.');
        pathParts.viewEngine = parts.pop();
        pathParts.name = libpath.join(libpath.dirname(pathParts.relpath),
            parts.shift());
        if (parts.length) {
            pathParts.contextParts.device = parts.join('.');
            pathParts.contextKey = libqs.stringify(pathParts.contextParts);
        }
        if (this._skipBadPath(pathParts)) {
            return;
        }

        // Catch if the view has no engine i.e. "index.html" not "index.mu.html"
        if (!pathParts.name || pathParts.shortpath === pathParts.viewEngine) {
            logger.log('Mojit view not loaded at "' + fullpath + '"', 'warn',
                NAME);
            return;
        }

        res.type = 'view';
        res.fsPath = fullpath;
        res.source = source;
        res.viewEngine = pathParts.viewEngine;
        res.viewOutputFormat = pathParts.ext.substr(1);
        res.name = pathParts.name;
        this._precalcStaticURL(res, mojitType);
        resid = 'view-' + pathParts.name;

        this._preloadSetDest(dest, resid, res, pathParts);
    },


    /*
     * Note: this MUST be called before _preloadFileSpec()
     *
     * generates URL's about each spec in application.json
     */
    _urlsForAppSpecs: function() {
        var specs = this._appConfigStatic.specs || {},
            appConfig,
            prefix,
            id,
            url;

        appConfig = this._appConfigStatic.staticHandling || {};
        prefix = '/static';

        if (typeof appConfig.prefix !== 'undefined') {
            prefix = appConfig.prefix ? '/' + appConfig.prefix : '';
        }

        for (id in specs) {
            if (specs.hasOwnProperty(id)) {
                // Set the URL of the spec
                // TODO:  use appconfig.staticHandling.appName
                url = prefix + '/' + id + '/specs/default.json';
                this._dynamicURLs[url] = 'application.json';
            }
        }
    },


    /*
     * prereads the configuration file, if possible
     * (configuration files in YCB format cannot be preread)
     */
    _prereadConfigs: function(src) {
        var ctxKey,
            res,
            resid;

        if ((!src) || (!Object.keys(src))) {
            return;
        }
        for (ctxKey in src.contexts) {
            if (src.contexts.hasOwnProperty(ctxKey)) {
                for (resid in src[ctxKey]) {
                    if (src[ctxKey].hasOwnProperty(resid)) {
                        res = src[ctxKey][resid];
                        if ('config' === res.type &&
                                !this._jsonCache[res.fsPath]) {
                            //logger.log('prereading ' + res.fsPath, 'info',
                            //    NAME);
                            this._jsonCache[res.fsPath] =
                                this._readConfigJSON(res.fsPath);
                        }
                    }
                }
            }
        }
    },


    /*
     * reads and parses a JSON file
     */
    _readConfigJSON: function(fullpath) {
        //logger.log('_readConfigJSON(' + fullpath + ')');
        var json,
            contents = this._libs.fs.readFileSync(fullpath, 'utf-8');

        try {
            json = JSON.parse(contents);
        } catch (e) {
            logger.log(this._reportJavaScriptSyntaxErrors(contents, fullpath),
                'warn', NAME);
            throw new Error('Error parsing JSON file: ' + fullpath);
        }
        return json;
    },


    /*
     * Create a lookup table for validating YCB dimensions and values. The
     * table looks like this:
     *
     * <pre>
     * {
     *   "dim1": {
     *     "val1": null,
     *     "val2": null,
     *     ...
     *   },
     *   ...
     * }
     * </pre>
     *
     * @param dimensions {object} Top-level YCB "dimensions" object
     * @return object
     */
    _precalcValidYCBDimensions: function(dimensions) {
        var validDims = {},
            name,
            i;

        for (i = 0; i < dimensions.length; i += 1) {
            for (name in dimensions[i]) {
                if (dimensions[i].hasOwnProperty(name)) {
                    validDims[name] = {};
                    this._flattenYCBDimension(validDims[name],
                        dimensions[i][name]);
                }
            }
        }

        return validDims;
    },


    /*
     * Flatten the keys in a nested structure into a single object. The first
     * argument is modified. All values are set to null.
     *
     * @param keys {object} The accumulator for keys.
     * @param obj {object}
     */
    _flattenYCBDimension: function(keys, obj) {
        var name;

        for (name in obj) {
            if (obj.hasOwnProperty(name)) {
                keys[name] = null;
                if (typeof obj[name] === 'object') {
                    this._flattenYCBDimension(keys, obj[name]);
                }
            }
        }
    },


    /*
     * Return a context that contains only valid dimensions and values.
     *
     * @param ctx {object} runtime context
     * @return {object} filtered runtime context
     */
    _getValidYCBContext: function(ctx) {
        var validDims = this._validYCBDims,
            validCtx = {},
            name,
            value;

        for (name in ctx) {
            if (ctx.hasOwnProperty(name)) {
                value = ctx[name];
                if (validDims[name] && validDims[name].hasOwnProperty(value)) {
                    validCtx[name] = value;
                }
            }
        }
        return validCtx;
    },


    /*
     * reads a configuration file that is in YCB format
     * @param ctx {object} runtime context
     * @param fullpath {string} path to the YCB file
     * @param isAppConfig {boolean} indicates whether the file being read is the application.json
     * @return {object} the contextualized configuration
     */
    _readConfigYCB: function(ctx, fullpath, isAppConfig) {
        var cacheKey,
            appConfigStatic,
            jsonCache = this._jsonCache,
            json,
            ycbCache = this._ycbCache,
            ycb;

        ctx = this._getValidYCBContext(ctx);

        //cache key only needs to account for dynamic context
        cacheKey = JSON.stringify(ctx);

        //logger.log('_readConfigYCB('+fullpath+')', 'mojito', NAME);

        if (!fullpath) {
            //logger.log('unknown fullpath', 'mojito', NAME);
            return {};
        }

        if (!ycbCache[fullpath]) {
            ycbCache[fullpath] = {};
        }

        ycb = ycbCache[fullpath][cacheKey];
        if (!ycb) {
            json = jsonCache[fullpath];
            if (!json) {
                json = this._readConfigJSON(fullpath);
                jsonCache[fullpath] = json;
            }
            json = this._ycbDims.concat(json);

            ctx = this._mergeRecursive(this._cloneObj(this._defaultYCBContext),
                ctx);

            // libycb.read() will distructively modify its first argument
            ycb = libycb.read(this._cloneObj(json), ctx);
            if (isAppConfig) {
                appConfigStatic = this._cloneObj(this._appConfigStatic);
                ycb = this._mergeRecursive(appConfigStatic, ycb);
            }
            ycbCache[fullpath][cacheKey] = ycb;
        }
        return ycb;
    },


    /*
     * reads a configuration file for a mojit
     * @param path {string} path to the file
     * @param ycb {boolean} indicates whether the file should be read using the YCB library
     * @return {object} the configuration
     */
    _readMojitConfigFile: function(path, ycb) {
        //logger.log('_readMojitConfigFile(' + path + ',' + ycb + ')');
        var json,
            contents;

        if (!this._libs.path.existsSync(path)) {
            return {};
        }
        if (ycb) {
            return this._readConfigYCB({}, path);
        }
        try {
            contents = this._libs.fs.readFileSync(path, 'utf-8');
            json = JSON.parse(contents);
        } catch (e) {
            logger.log(this._reportJavaScriptSyntaxErrors(contents, path),
                'warn', NAME);
            throw new Error('Error reading or parsing JSON file: ' + path);
        }
        return json;
    },


    /*
     * Sets up the static handling so that the package.json file for the
     * mojit can be served.  This is only done if the package.json file
     * has defined yahoo.mojito.package or config.mojito.package to
     * "public".
     *
     * @param pack {object} contents of the mojit's package.json file
     * @param path {string} the mojit's directory
     * @return {nothing} results are added to this object
     */
    _mojitPackageAsAsset: function(pack, path) {
        var pkg,
            packagePath,
            fakeResource;

        pkg = (pack.yahoo && pack.yahoo.mojito &&
                pack.yahoo.mojito['package']) ||
            (pack.config && pack.config.mojito &&
                pack.config.mojito['package']);

        if (pkg === 'public') {
            // We have to check if the "package.json" files wants to do this
            packagePath = libpath.join(path, 'package.json');
            fakeResource = {
                type: 'package',
                fsPath: packagePath
            };
            this._precalcStaticURL(fakeResource, (pack.name ||
                libpath.basename(path)));
        }
    },


    /*
     * checks to see if the version of Mojito specified in a mojit's
     * package.json matches the current verison of Mojito.
     *
     * @param pack {object} contents of the mojit's package.json file
     * @param version {string} current version of mojito
     * @return {boolean} returns true if the mojit can be used
     */
    _mojitoVersionMatch: function(pack, version) {
        var packageVersion;

        // There was no package.json file so assume version is OK
        if (Object.keys(pack).length === 0) {
            return true;
        }

        // If we have a version make sure it is less than the given one
        packageVersion = (pack.yahoo && pack.yahoo.mojito &&
                pack.yahoo.mojito.version) ||
            (pack.config && pack.config.mojito && pack.config.mojito.version);

        if (packageVersion) {
            if (packageVersion === '*') {
                return true;
            }
            // TODO: [Issue 95] Put real version checking code here.
            return packageVersion <= version;
        }

        // No version is set so return false as we don't know what this is
        return false;
    },


    /*
     * takes the preloaded info and resolves ("cooks down") affinity, etc
     *
     * This function is a doozy.  This is where all the magic happens as far
     * as which version of each resource is used.  The results are stored in
     * this._fwMeta, _appMeta, _mojitMeta, etc.  The primary key of these is
     * the environment ("client" or "server").  The secondary key is the
     * context key -- a string representation of the partial context.
     *
     * We do that to have fast lookup during runtime.
     *
     * The algorithm chooses first from the most specific source:  mojit-
     * specific has higher precedence than app-level, which has higher
     * precedence than framework-provided.  Within each of those, the
     * environment-specific version ("client" or "server") has higher
     * precedence than the "common" affinity.
     *
     * We do this for each context key (partial context).  We resolve
     * context inheritance (for example no-context versus device=iphone)
     * at runtime (in getMojitTypeDetails()).
     *
     * (Half of the above algorithm is implemented here, and half in
     * _cookdownMerge() which is a utility for this method.)
     */
    _cookdown: function() {
        //logger.log('_cookdown()');
        var env,
            envs = ['client', 'server'],
            type,   // mojit type
            i,
            merged, // results of _cookdownMerge()
            resid,
            resids, // array (really object keys) of all resource IDs
            ctxKey;

        // example of _preload.mojitMeta:
        // [type][resid][affinity] = {
        //      "contexts": { "device=iphone": { "device":"iphone"} },
        //      "device=iphone": {
        //          "type": ...
        //          "fsPath": ...
        //      }
        // }
        // resid was generated during _preloadFile*(), for example:
        //      controller is 'controller'
        //      model is 'model-foo'
        //      view is 'view-index'
        //
        // TODO 2011-06-16: [Issue 109] break down into smaller pieces
        // (at least for more fine-grained unit testing).
        for (type in this._preload.mojitMeta) {
            if (this._preload.mojitMeta.hasOwnProperty(type)) {
                // TODO: LINT [Issue 110] detect dupe resids.
                resids = {};

                // need resids from all sources
                for (resid in this._preload.fwMeta) {
                    if (this._preload.fwMeta.hasOwnProperty(resid)) {
                        resids[resid] = true;
                    }
                }
                for (resid in this._preload.appMeta) {
                    if (this._preload.appMeta.hasOwnProperty(resid)) {
                        resids[resid] = true;
                    }
                }
                for (resid in this._preload.mojitMeta[type]) {
                    if (this._preload.mojitMeta[type].hasOwnProperty(resid)) {
                        resids[resid] = true;
                    }
                }

                for (resid in resids) {
                    if (resids.hasOwnProperty(resid)) {
                        for (i = 0; i < envs.length; i += 1) {
                            env = envs[i];
                            merged = this._cookdownMerge(env, [
                                // ORDER IS IMPORTANT
                                // source=fw -- lowest priority
                                this._preload.fwMeta[resid],
                                // source=app -- middle priority
                                this._preload.appMeta[resid],
                                // source=mojit -- highest priority
                                this._preload.mojitMeta[type][resid]
                            ]);
                            if (merged) {
                                if (!this._mojitMeta[env]) {
                                    this._mojitMeta[env] = {};
                                }
                                if (!this._mojitMeta[env][type]) {
                                    this._mojitMeta[env][type] = {};
                                }
                                if (!this._mojitMeta[env][type].contexts) {
                                    this._mojitMeta[env][type].contexts = {};
                                }
                                for (ctxKey in merged.contexts) {
                                    if (merged.contexts.
                                            hasOwnProperty(ctxKey)) {
                                        this._mojitMeta[env][type
                                            ].contexts[ctxKey] =
                                            merged.contexts[ctxKey];
                                        if (!this._mojitMeta[env
                                                ][type][ctxKey]) {
                                            this._mojitMeta[env
                                                ][type][ctxKey] = {};
                                        }
                                        // TODO: give example of
                                        // data structure.
                                        this._mojitMeta[env
                                            ][type][ctxKey][resid] =
                                            merged[ctxKey];
                                    }
                                }
                            } // have merged
                        } // foreach env
                    }
                } // foreach resid
            }
        } // foreach type

        for (resid in this._preload.fwMeta) {
            if (this._preload.fwMeta.hasOwnProperty(resid)) {
                for (i = 0; i < envs.length; i += 1) {
                    env = envs[i];
                    merged = this._cookdownMerge(env,
                        [this._preload.fwMeta[resid]]);
                    if (merged) {
                        if (!this._fwMeta[env]) {
                            this._fwMeta[env] = {};
                        }
                        if (!this._fwMeta[env].contexts) {
                            this._fwMeta[env].contexts = {};
                        }
                        for (ctxKey in merged.contexts) {
                            if (merged.contexts.hasOwnProperty(ctxKey)) {
                                this._fwMeta[env].contexts[ctxKey] =
                                    merged.contexts[ctxKey];
                                if (!this._fwMeta[env][ctxKey]) {
                                    this._fwMeta[env][ctxKey] = {};
                                }
                                this._fwMeta[env][ctxKey][resid] =
                                    merged[ctxKey];
                            }
                        }
                    }
                }
            }
        }

        for (resid in this._preload.appMeta) {
            if (this._preload.appMeta.hasOwnProperty(resid)) {
                for (i = 0; i < envs.length; i += 1) {
                    env = envs[i];
                    merged = this._cookdownMerge(env,
                        [this._preload.appMeta[resid]]);
                    if (merged) {
                        if (!this._appMeta[env]) {
                            this._appMeta[env] = {};
                        }
                        if (!this._appMeta[env].contexts) {
                            this._appMeta[env].contexts = {};
                        }
                        for (ctxKey in merged.contexts) {
                            if (merged.contexts.hasOwnProperty(ctxKey)) {
                                this._appMeta[env].contexts[ctxKey] =
                                    merged.contexts[ctxKey];
                                if (!this._appMeta[env][ctxKey]) {
                                    this._appMeta[env][ctxKey] = {};
                                }
                                this._appMeta[env][ctxKey][resid] =
                                    merged[ctxKey];
                            }
                        }
                    }
                }
            }
        }
        delete this._preload;
    },


    /*
     * This is a utility for _cookdown().  See docs on that for details.
     *
     * The general idea is that we start with the lowest priority items
     * and let higher priority items clobber.
     *
     * @param env {string} "client" or "server"
     * @param srcs {array} ORDER MATTERS! list of resources to merge
     * @return {DOING} DOING
     */
    _cookdownMerge: function(env, srcs) {
        var merged = { contexts: {} },
            affinities = ['common', env],   // priority order
            s,
            src,
            lastS = srcs.length - 1,
            found = false,  // TODO: when is found==false?
            a,
            affinity,
            ctx,
            res,
            ctxKey;

        for (s = 0; s < srcs.length; s += 1) {
            src = srcs[s];
            if (!src) {
                continue;
            }
            for (a = 0; a < affinities.length; a += 1) {
                affinity = affinities[a];
                if (!src[affinity]) {
                    continue;
                }
                for (ctxKey in src[affinity].contexts) {
                    if (src[affinity].contexts.hasOwnProperty(ctxKey)) {
                        merged.contexts[ctxKey] =
                            src[affinity].contexts[ctxKey];
                        res = this._cloneObj(src[affinity][ctxKey]);
                        if (('config' === res.type) && (s !== lastS)) {
                            // only pull in configs from the last source
                            continue;
                        }
                        merged.type = res.type;
                        merged[ctxKey] = res;
                        found = true;
                    }
                }
            }
        }
        if (!found) {
            return null;
        }
        return merged;
    },


    /*
     * calculates, at server start time, the YUI module dependencies
     * for mojit controllers and binders
     */
    _precalcYuiDependencies: function() {
        var e,
            i,
            env,
            envs = ['client', 'server'],
            mojitType,
            ctxKey,
            module,
            parts,
            required,
            resid,
            res,
            sorted,
            ctxs;

        for (e = 0; e < envs.length; e += 1) {
            env = envs[e];

            // mojit-specific
            // --------------
            if (!this._mojitYuiSorted[env]) {
                this._mojitYuiRequired[env] = {};
                this._mojitYuiSorted[env] = {};
                this._mojitYuiSortedPaths[env] = {};
            }
            for (mojitType in this._mojitMeta[env]) {
                if (this._mojitMeta[env].hasOwnProperty(mojitType)) {

                    if (!this._mojitYuiSorted[env][mojitType]) {
                        this._mojitYuiRequired[env][mojitType] = {};
                        this._mojitYuiSorted[env][mojitType] = {};
                        this._mojitYuiSortedPaths[env][mojitType] = {};
                    }
                    for (ctxKey in this._mojitMeta[env][mojitType].contexts) {
                        if (this._mojitMeta[env
                                ][mojitType].contexts.hasOwnProperty(ctxKey)) {

                            // we handle non-context version below
                            if ('*' === ctxKey) {
                                continue;
                            }
                            if (!this._mojitYuiSorted[env
                                    ][mojitType].contexts) {
                                this._mojitYuiRequired[env
                                    ][mojitType].contexts = {};
                                this._mojitYuiSorted[env
                                    ][mojitType].contexts = {};
                                this._mojitYuiSortedPaths[env
                                    ][mojitType].contexts = {};
                            }

                            parts = {};
                            this._precalcYuiDependencies_getDepParts(env,
                                this._mojitMeta[env][mojitType]['*'], parts);
                            this._precalcYuiDependencies_getDepParts(env,
                                this._mojitMeta[env][mojitType][ctxKey], parts);
                            if (parts.controller &&
                                    parts.modules['inlinecss/' + mojitType]) {
                                parts.modules[parts.controller.yuiModuleName].
                                    requires.push('inlinecss/' + mojitType);
                            }
                            this._mojitYuiSorted[env
                                ][mojitType].contexts[ctxKey] =
                                this._mojitMeta[env
                                    ][mojitType].contexts[ctxKey];
                            this._mojitYuiRequired[env
                                ][mojitType].contexts[ctxKey] =
                                this._mojitMeta[env
                                    ][mojitType].contexts[ctxKey];
                            if (parts.controller) {
                                parts.required[parts.controller.yuiModuleName] =
                                    true;
                                // dependencies necessary to dispatch the mojit
                                parts.required['mojito-dispatcher'] = true;
                                sorted = this._sortYUIModules(
                                    this._mojitMeta[env][mojitType
                                        ].contexts[ctxKey],
                                    env,
                                    this._appConfigStatic.yui,
                                    mojitType,
                                    parts.modules,
                                    parts.required
                                );
                                this._mojitYuiRequired[env
                                    ][mojitType][ctxKey] =
                                    Object.keys(parts.required);
                                this._mojitYuiSorted[env
                                    ][mojitType][ctxKey] = sorted.sorted;
                                this._mojitYuiSortedPaths[env
                                    ][mojitType][ctxKey] = sorted.paths;
                            }

                            // also calculate sortedPaths for each individual binder
                            if ('client' === env) {
                                for (resid in this._mojitMeta[env
                                        ][mojitType][ctxKey]) {
                                    if (this._mojitMeta[env
                                            ][mojitType][ctxKey
                                            ].hasOwnProperty(resid)) {
                                        res = this._mojitMeta[env
                                            ][mojitType][ctxKey][resid];
                                        if (res.type !== 'binder') {
                                            continue;
                                        }
                                        required = {};
                                        required[res.yuiModuleName] = true;
                                        // all binders have this dependency,
                                        // even if not explicitly given
                                        required['mojito-client'] = true;
                                        // view engines are needed to support
                                        // mojitProxy.render()
                                        for (i in parts.viewEngines) {
                                            if (parts.viewEngines.
                                                    hasOwnProperty(i)) {
                                                required[parts.viewEngines[i]] =
                                                    true;
                                            }
                                        }
                                        sorted = this._sortYUIModules(
                                            this._mojitMeta[env][mojitType
                                                ].contexts[ctxKey],
                                            env,
                                            this._appConfigStatic.yui,
                                            mojitType,
                                            parts.modules,
                                            required
                                        );
                                        res.yuiSortedPaths = sorted.paths;
                                    }
                                }
                            } // env==client
                        }
                    } // foreach context (except '*')

                    // here's where we handle the non-context version
                    if (this._mojitMeta[env][mojitType]['*']) {
                        if (!this._mojitYuiSorted[env][mojitType].contexts) {
                            this._mojitYuiRequired[env
                                ][mojitType].contexts = {};
                            this._mojitYuiSorted[env][mojitType].contexts = {};
                            this._mojitYuiSortedPaths[env
                                ][mojitType].contexts = {};
                        }
                        parts = {};
                        this._precalcYuiDependencies_getDepParts(env,
                            this._mojitMeta[env][mojitType]['*'],
                            parts);
                        if (parts.controller && parts.modules['inlinecss/' +
                                mojitType]) {
                            parts.modules[parts.controller.yuiModuleName].
                                requires.push('inlinecss/' + mojitType);
                        }
                        this._mojitYuiSorted[env][mojitType].contexts['*'] =
                            this._mojitMeta[env][mojitType].contexts['*'];
                        this._mojitYuiRequired[env][mojitType].contexts['*'] =
                            this._mojitMeta[env][mojitType].contexts['*'];
                        if (parts.controller) {
                            parts.required[parts.controller.yuiModuleName] =
                                true;
                            // dependencies necessary to dispatch the mojit
                            parts.required['mojito-dispatcher'] = true;
                            sorted = this._sortYUIModules(
                                this._mojitMeta[env][mojitType].contexts['*'],
                                env,
                                this._appConfigStatic.yui,
                                mojitType,
                                parts.modules,
                                parts.required
                            );
                            this._mojitYuiRequired[env][mojitType]['*'] =
                                Object.keys(parts.required);
                            this._mojitYuiSorted[env][mojitType]['*'] =
                                sorted.sorted;
                            this._mojitYuiSortedPaths[env][mojitType]['*'] =
                                sorted.paths;
                        }

                        // also calculate sortedPaths for each individual binder
                        if ('client' === env) {
                            for (resid in this._mojitMeta[env
                                    ][mojitType]['*']) {
                                if (this._mojitMeta[env][mojitType
                                        ]['*'].hasOwnProperty(resid)) {
                                    res = this._mojitMeta[env][mojitType
                                        ]['*'][resid];
                                    if (res.type !== 'binder') {
                                        continue;
                                    }
                                    required = {};
                                    required[res.yuiModuleName] = true;
                                    // all binders have this dependency, even if
                                    // not explicitly given
                                    required['mojito-client'] = true;
                                    // view engines are needed to support
                                    // mojitProxy.render()
                                    for (i in parts.viewEngines) {
                                        if (parts.viewEngines.
                                                hasOwnProperty(i)
                                                ) {
                                            required[parts.viewEngines[i]] =
                                                true;
                                        }
                                    }
                                    sorted = this._sortYUIModules(
                                        this._mojitMeta[env][mojitType
                                            ].contexts['*'],
                                        env,
                                        this._appConfigStatic.yui,
                                        mojitType,
                                        parts.modules,
                                        required
                                    );
                                    res.yuiSortedPaths = sorted.paths;
                                }
                            }
                        } // env==client
                    } // context=='*'
                }
            } // foreach mojitType
        } // foreach env
    },


    // fills dest with:
    //  .controller     resource for the controller
    //  .modules        hash yuiModuleName: {
    //                          fullpath: where to load the module from
    //                          requires: list of required modules
    //                      }
    //  .moduleSources  hash yuiModuleName:source
    //  .required       hash yuiModuleName:true of modules required by the
    //                      source controller
    //  .viewEngines    hash name:yuiModuleName of view engines
    //
    // @param env {string} "client" or "server"
    // @param source {object} list of resources
    // @param dest {object} where to add results
    // @return {nothing} results put in "dest" argument
    _precalcYuiDependencies_getDepParts: function(env, source, dest) {
        var resid,
            res,
            viewEngine;

        if (!source) {
            return;
        }
        dest.required = dest.required || {};
        dest.viewEngines = dest.viewEngines || {};
        dest.modules = dest.modules || {};
        dest.moduleSources = dest.moduleSources || {};

        // all mojits essentially have this dependency implicitly (even it not
        // given explicitly)
        dest.required.mojito = true;

        for (resid in source) {
            if (source.hasOwnProperty(resid)) {
                res = source[resid];
                if ('view' === res.type) {
                    viewEngine = source['addon-view-engines-' + res.viewEngine];
                    if (viewEngine) {
                        dest.required[viewEngine.yuiModuleName] = true;
                        dest.viewEngines[res.viewEngine] =
                            viewEngine.yuiModuleName;
                    }
                }
                if (res.yuiModuleName) {
                    // The binder is part of the resources for the server,
                    // but shouldn't be added as a runtime dependency.
                    if ('server' === env && 'binder' === res.type) {
                        continue;
                    }
                    if ('mojit' === res.source) {
                        dest.required[res.yuiModuleName] = true;
                    }
                    dest.modules[res.yuiModuleName] = {
                        requires: res.yuiModuleMeta.requires,
                        fullpath: (('client' === env) ?
                                res.staticHandlerURL :
                                res.fsPath)
                    };
                    dest.moduleSources[res.yuiModuleName] = res.source;
                    if (('controller' === res.type)) {
                        dest.controller = res;
                    }
                }
            }
        }
        // TODO: move other dynamic dependency adjustments
        // (compiled views inlinecss) here.
    },


    /*
     * uses YUI Loader to sort a list of YUI modules
     */
    _sortYUIModules: function(ctx, env, yuiConfig, mojitType, modules,
            required) {
        var YUI = serverYUI,
            Y,
            loader,
            sortedPaths = {},
            usePrecomputed = -1 !== this._appConfigStatic.yui.
                dependencyCalculations.indexOf('precomputed'),
            useOnDemand = -1 !== this._appConfigStatic.yui.
                dependencyCalculations.indexOf('ondemand'),
            j,
            module,
            info;

        if (!usePrecomputed) {
            useOnDemand = true;
        }

        if ('client' === env) {
            // Use clientYUI to avoid cross-contamination with serverYUI
            YUI = clientYUI;
            // GlobalConfig is needed on nodejs but is invalid on the client
            delete YUI.GlobalConfig;
        }

        // We don't actually need the full list, just the base required modules.
        // YUI.Loader() will do the rest at runtime.
        if (useOnDemand) {
            for (module in required) {
                if (required.hasOwnProperty(module)) {
                    sortedPaths[module] = modules[module].fullpath;
                }
            }
            return { sorted: Object.keys(required), paths: sortedPaths };
        }

        Y = YUI().useSync('loader-base');
        loader = new Y.Loader({ lang: ctx.lang });

        // We need to clear YUI's cached dependencies, since there's no
        // guarantee that the previously calculated dependencies have been done
        // using the same context as this calculation.
        delete YUI.Env._renderedMods;

        // This approach seems odd, but it's what the YUI Configurator is also
        // doing.
        if (yuiConfig && yuiConfig.base) {
            loader.base = yuiConfig.base;
        } else {
            loader.base = Y.Env.meta.base + Y.Env.meta.root;
        }
        loader.addGroup({modules: modules}, mojitType);
        loader.calculate({required: required});
        for (j = 0; j < loader.sorted.length; j += 1) {
            module = loader.sorted[j];
            info = loader.moduleInfo[module];
            if (info) {
                sortedPaths[module] = info.fullpath || loader._url(info.path);
            }
        }
        return { sorted: loader.sorted, paths: sortedPaths };
    },


    /*
     * calculates the static handling URL for a resource
     *
     * @param res {object} metadata about the resource
     * @param mojitType {string} mojit type, can be undefined for non-mojit-specific resources
     * @return {nothing} new metadata added to the "res" argument
     */
    _precalcStaticURL: function(res, mojitType) {
        /* alternate approach which shows power of precalculating the URL and
         * then passing it around everywhere
        res.staticHandlerURL = '/static/' + Math.floor(Math.random() *
            1000000000);
        return;
        */
        var url,
            parts = [],
            path,
            i,
            relpath,
            config = this._appConfigStatic.staticHandling || {},
            prefix = config.prefix,
            appName = config.appName || this._shortRoot,
            frameworkName = config.frameworkName || 'mojito',
            rollupParts = [],
            rollupFsPath;

        // TODO: [Issue 111] magic constants should should come from fw.json.

        /*
        Server only framework mojits like DaliProxy and HTMLFrameMojit should
        never have static URLs associated with them, so we skip them. This never
        used to be an issue until we added the "assumeRollups" functionality to
        preload JSON specs for specified mojits during the compile step (mojito
        compile json) for Livestand. I think we need to reevaluate this entire
        process so we don't have such a fragile condition below.
         */
        // TODO: reevaluate this entire process so we don't have such a fragile
        // condition below.
        if (mojitType === 'DaliProxy' || mojitType === 'HTMLFrameMojit') {
            return;
        }

        switch (res.type) {
        case 'action':
            path = libpath.join('actions', libpath.basename(res.fsPath));
            break;
        case 'addon':
            i = res.fsPath.indexOf('/addons/');
            relpath = res.fsPath.substr(i + 8);
            path = libpath.join('addons', relpath);
            break;
        case 'asset':
            i = res.fsPath.indexOf('/assets/');
            relpath = res.fsPath.substr(i + 8);
            path = libpath.join('assets', relpath);
            break;
        case 'binder':
            i = res.fsPath.indexOf('/binders/');
            relpath = res.fsPath.substr(i + 9);
            path = libpath.join('binders', relpath);
            break;
        case 'controller':
            path = libpath.basename(res.fsPath);
            break;
        case 'model':
            path = libpath.join('models', libpath.basename(res.fsPath));
            break;
        case 'view':
            i = res.fsPath.indexOf('/views/');
            relpath = res.fsPath.substr(i + 7);
            path = libpath.join('views', relpath);
            break;
        case 'yui-lang':
            path = libpath.join('lang', libpath.basename(res.fsPath));
            break;
        case 'yui-module':
            i = res.fsPath.indexOf('/autoload/');
            relpath = res.fsPath.substr(i + 10);
            path = libpath.join('autoload', relpath);
            break;
        case 'package':
            path = libpath.basename(res.fsPath);
            break;
        default:
            return;
        }

        if (!config.hasOwnProperty('prefix')) {
            prefix = 'static';
        }
        if (prefix) {
            parts.push(prefix);
            rollupParts.push(prefix);
        }

        if ('fw' === res.source) {
            parts.push(frameworkName);
            if (config.useRollups && res.yuiModuleName) {
                // fw resources are put into app-level rollup
                rollupParts.push(appName);
                rollupFsPath = libpath.join(this._root, 'rollup.client.js');
            }
        } else if ('app' === res.source) {
            parts.push(appName);
            if (config.useRollups && res.yuiModuleName) {
                rollupParts.push(appName);
                rollupFsPath = libpath.join(this._root, 'rollup.client.js');
            }
        } else {
            parts.push(mojitType);
            if (config.useRollups && res.yuiModuleName) {
                rollupParts.push(mojitType);
                rollupFsPath = libpath.join(this._mojitPaths[mojitType],
                    'rollup.client.js');
            }
        }
        if (mojitType) {
            if (!this._mojitAssetRoots[mojitType]) {
                this._mojitAssetRoots[mojitType] = '/' +
                    libpath.join(parts.join('/'), 'assets');
            }
        }

        // only use rollup URL if rollup file exists or we are assuming rollups
        if ((rollupFsPath && this._libs.path.existsSync(rollupFsPath) &&
                config.useRollups) || this._appConfigStatic.assumeRollups) {
            // useful for debugging:  path += '?orig=' + path;
            res.rollupURL = '/' + libpath.join(rollupParts.join('/'),
                'rollup.client.js');
            url = res.rollupURL;
            this._staticURLs[url] = rollupFsPath;
        }
        if (!url) {
            url = '/' + libpath.join(parts.join('/'), path);
            this._staticURLs[url] = res.fsPath;
        }
        res.staticHandlerURL = url;
    },


    /*
     * attempt to gather YUI-module details
     *
     * @param res {object} metadata about the resource
     * @return {nothing} new metadata added to the "res" argument
     */
    _precalcYuiModule: function(res) {
        var file = this._libs.fs.readFileSync(res.fsPath, 'utf8'),
            ctx = {
                console: {
                    log: function() {}
                },
                window: {},
                document: {},
                YUI: {
                    add: function(name, fn, version, meta) {
                        res.yuiModuleName = name;
                        res.yuiModuleVersion = version;
                        res.yuiModuleMeta = meta || {};
                    }
                }
            };

        try {
            libvm.runInNewContext(file, ctx, res.fsPath);
        } catch (e) {
            if (e.stack.indexOf('SyntaxError:') === 0) {
                // the stack of a SyntaxError thrown by runInNewContext() lacks
                // filename, line and column numbers for the error. Also, it
                // does not write to stderr as the docs claim.

                // see "Lack of error message in vm.* stuff" from 2011-04-29 at
                // http://groups.google.com/group/nodejs/browse_thread/
                // thread/2075b964a3f7dd79/bd0df1ae36829813

                logger.log(this._reportJavaScriptSyntaxErrors(file));
                logger.log(e.message + ' in file: ' + res.fsPath, 'error',
                    NAME);

            } else {
                logger.log(e.message + '\n' + e.stack, 'error', NAME);
            }
            process.exit(-1);
        }
    },


    /*
     * reads one the configuration files for a mojit
     *
     * @param env {string} "client" or "server"
     * @param ctx {object} runtime context
     * @param mojitType {string} name of mojit
     * @param name {string} config resource name, either "definition" or "defaults"
     */
    _getMojitConfig: function(env, ctx, mojitType, name) {
        //logger.log('_getMojitConfig('+env+','+mojitType+','+name+')');
        var resid,
            res;

        if (!this._mojitMeta[env][mojitType]) {
            throw new Error('Cannot find meta data for mojit type \"' + mojitType +
                '\"');
        }

        resid = 'config-' + name;
        res = this._getContextualizedResource(this._mojitMeta[env][mojitType], ctx,
            resid);
        if (!res) {
            return {};
        }
        return this._readConfigYCB(ctx, res.fsPath);
    },


    /*
     * returns whether a runtime context matches a partial context
     *
     * @param ctx {object} runtime context
     * @param ctxParts {object} partial context
     */
    _matchContext: function(ctx, ctxParts) {
        var k;

        for (k in ctxParts) {
            if (ctxParts.hasOwnProperty(k)) {
                // FUTURE -- handle "lang" slightly specially ("en" should match
                // "en-US")
                // For now we will skip the "lang" check as it could change on
                // the fly in the client and we need all the "lang" files
                // available in our YUI instance.
                if (k !== 'lang' && ctx[k] !== ctxParts[k]) {
                    return false;
                }
            }
        }
        return true;
    },


    /*
     * returns a list of resource metadata that match the context
     *
     * @param src {object} list of contextualized resources, key is contextKey
     * @param ctx {object} context to match
     * @return {object} list of resources, key is resource ID
     */
    _getResourceListForContext: function(src, ctx) {
        var list = {},  // resid: resource
            resid,
            ctxKey;

        if (src['*']) {
            for (resid in src['*']) {
                if (src['*'].hasOwnProperty(resid)) {
                    list[resid] = src['*'][resid];
                }
            }
        }
        for (ctxKey in src.contexts) {
            if (src.contexts.hasOwnProperty(ctxKey)) {
                if ('*' === ctxKey) {
                    continue;
                }
                if (!this._matchContext(ctx, src.contexts[ctxKey])) {
                    continue;
                }
                for (resid in src[ctxKey]) {
                    if (src[ctxKey].hasOwnProperty(resid)) {
                        list[resid] = src[ctxKey][resid];
                    }
                }
            }
        }
        return list;
    },


    /*
     * returns a list of the language resources
     * doesn't discriminate based on context:  returns all langs for all
     * contexts.
     *
     * @param src {object} list of contextualized resources, key is contextKey
     * @return {object} list of language resources, key is resource ID
     */
    _getLangList: function(src) {
        var list = {},  // resid: res
            ctxKey,
            resid,
            res;

        for (ctxKey in src.contexts) {
            if (src.contexts.hasOwnProperty(ctxKey)) {
                for (resid in src[ctxKey]) {
                    if (src[ctxKey].hasOwnProperty(resid)) {
                        res = src[ctxKey][resid];
                        if ('yui-lang' === res.type) {
                            list[resid] = res;
                        }
                    }
                }
            }
        }
        return list;
    },


    /*
     * returns the metadata for a resource specific for a particular runtime context
     *
     * @param src {object} list of contextualized resources, key is contextKey
     * @param ctx {object} context to match
     * @param resid {string} ID of resource to find
     * @return {object} resource metadata
     */
    _getContextualizedResource: function(src, ctx, resid) {
        var ctxKey,
            res;

        // TODO: [Issue 100] Review, for when there is no app.json file.
        if (!src || !src.contexts) {
            return {};
        }

        for (ctxKey in src.contexts) {
            if (src.contexts.hasOwnProperty(ctxKey)) {
                // look for specific first
                if ('*' === ctxKey) {
                    continue;
                }
                if (!this._matchContext(ctx, src.contexts[ctxKey])) {
                    continue;
                }
                res = src[ctxKey][resid];
                if (res) {
                    return res;
                }
            }
        }
        // fallback
        return src['*'][resid];
    },


    /*
     * utility for the _preloadFile*() methods that sets the new resource metadata
     * into a location consistent with the other parts of the algorithm
     *
     * @param dest {object} where to store the results
     * @param resid {string} resource ID
     * @param res {object} metadata about the resource
     * @param pathParts {object} results of _parsePath(), or the equivalent
     */
    _preloadSetDest: function(dest, resid, res, pathParts) {
        if (!dest[resid]) {
            dest[resid] = {};
        }
        dest = dest[resid];
        if (!dest[pathParts.affinity]) {
            dest[pathParts.affinity] = {};
        }
        dest = dest[pathParts.affinity];
        if (!dest.contexts) {
            dest.contexts = {};
        }
        dest.contexts[pathParts.contextKey] = pathParts.contextParts;
        dest[pathParts.contextKey] = res;
    },


    /*
     * utility for the _preloadFile*() methods that takes a file path
     * and returns metadata about it
     *
     * @param fullpath {string} full path to resource
     * @param defaultAffinity {string} affinity to use if the resource filename doesn't specify one
     * @param dir {string} base directory of resource type
     */
    _parsePath: function(fullpath, defaultAffinity, dir) {
        var shortpath,
            reldir,
            parts,
            outParts = [],
            i,
            part,
            device,
            affinity,
            out = {
                contextKey: '*',
                contextParts: {},
                affinity: defaultAffinity || 'server'
            };

        if (!dir) {
            dir = libpath.dirname(fullpath);
        }
        dir = libpath.join(dir, '/');
        out.relpath = fullpath.substr(dir.length);

        // TODO: support strict {name}.{selector}?.{affinity}?.{ext} syntax.
        out.ext = libpath.extname(fullpath);
        shortpath = libpath.basename(out.relpath, out.ext);
        reldir = libpath.dirname(out.relpath);

        affinity = this._detectAffinityFromShortFilename(shortpath);
        if (affinity) {
            out.affinity = affinity;
        }
        device = this._detectDeviceFromShortFilename(shortpath,
            out.contextParts.device);
        if (device) {
            out.contextParts.device = device;
        }

        outParts.push(this._extractRootNameFromShortFilename(shortpath));

        if (!this._objectIsEmpty(out.contextParts)) {
            out.contextKey = libqs.stringify(out.contextParts);
        }

        out.name = libpath.join(reldir, outParts.join('.'));
        out.shortpath = libpath.join(reldir, shortpath);

        return out;
    },


    /*
     * indicates whether file should be skipped based on its path
     * 
     * @param pathParts {object} return value of _parsePath() (or the equivalent)
     * @return {boolean} true indicates that the file should be skipped
     */
    _skipBadPath: function(pathParts) {
        var ext = pathParts.ext.substring(1);
        if (ext.match(isNotAlphaNum)) {
            return true;
        }
        return false;
    },


    /*
     * Generate a report of syntax errors for JavaScript code. This is also
     * very useful to find syntax errors in JSON documents.
     *
     * @param {string} js the JavaScript
     * @param {string} filename OPTIONAL. the name of the file containing the
     *     JavaScript
     * @return {string} if errors were found, a multi-line error report
     */
    _reportJavaScriptSyntaxErrors: function(js, filename) {

        // use a really lenient JSLINT to find syntax errors

        var jslint = require('./management/fulljslint').jslint,
            opts = {
                // turn off all the usual checks
                devel: true,
                browser: true,
                node: true,
                rhino: true,
                widget: true,
                windows: true,
                bitwise: true,
                regexp: true,
                confusion: true,
                undef: true,
                'continue': true,
                unparam: true,
                debug: true,
                sloppy: true,
                eqeq: true,
                sub: true,
                es5: true,
                vars: true,
                evil: true,
                white: true,
                forin: true,
                css: true,
                newcap: true,
                cap: true,
                nomen: true,
                on: true,
                plusplus: true,
                fragment: true,

                // prevent well-known globals from showing up as errors
                predef: [
                    // CommonJS
                    'exports',
                    // YUI
                    'YUI', 'YUI_config', 'YAHOO', 'YAHOO_config', 'Y',
                    // Node
                    'global', 'process', 'require', '__filename', 'module',
                    // Browser
                    'document', 'navigator', 'console', 'self', 'window'
                ]
            },
            // identify errors about undefined globals
            nameIsNotDefined = / is not defined\.$/,
            success,
            report = [],
            len,
            e,
            i;

        success = jslint(js, opts);
        if (!success) {
            len = jslint.errors.length;
            for (i = 0; i < len; i += 1) {
                e = jslint.errors[i];
                if (e && e.reason && !nameIsNotDefined.test(e.reason)) {
                    report.push(e.line + ',' + e.character + ': ' + e.reason);
                    report.push('    ' +
                        (e.evidence || '').replace(/^\s+|\s+$/, ''));
                }
            }
        }

        if (filename && report.length) {
            report.unshift('Syntax errors detected in ' + filename);
        }

        return report.join('\n');
    },


    /*
     * finds the affinity in the filename
     *
     * @param name {string} filename
     * @return {string|undefined} affinity found in the filename
     */
    _detectAffinityFromShortFilename: function(name) {
        var affinity;

        if (name.indexOf('.') >= 0) {
            affinity = new Affinity(name.split('.').pop());
        }
        return affinity;
    },


    /*
     * finds the device in the filename
     *
     * @param name {string} filename
     * @return {string|undefined} device found in the filename
     */
    _detectDeviceFromShortFilename: function(name) {
        // FUTURE: [Issue 86]real device detection
        var device;

        if (name.indexOf('iphone') > -1) {
            device = 'iphone';
        }
        return device;
    },


    /*
     * returns the selector for the runtime context
     *
     * @param ctx {object} runtime context
     * @return {string|null} selector for context
     */
    _selectorFromContext: function(ctx) {
        if (ctx.device) {
            return ctx.device;
        }
        return null;
    },


    /*
     * returns the short filename without the selector
     *
     * @param name {string} short filename
     * @return {string} short filename without the selector
     */
    _extractRootNameFromShortFilename: function(name) {
        var parts;

        if (name.indexOf('.') === -1) {
            return name;
        }
        parts = name.split('.');
        parts.pop();
        return parts.join('.');
    },


    // returns true if the object is empty
    _objectIsEmpty: function(o) {
        if (!o) {
            return true;
        }
        return (0 === Object.keys(o).length);
    },


    // from http://stackoverflow.com/questions/171251/
    // how-can-i-merge-properties-of-two-javascript-objects-dynamically/
    // 383245#383245
    /*
     * Recursively merge one object onto another
     *
     * @param dest {object} object to merge into
     * @param src {object} object to merge onto "dest"
     * @param matchType {boolean} controls whether a non-object in the src is
     *          allowed to clobber a non-object in the dest (if a different type)
     * @return {object} the modified "dest" object is also returned directly
     */
    _mergeRecursive: function(dest, src, typeMatch) {
        var p;

        for (p in src) {
            if (src.hasOwnProperty(p)) {
                // Property in destination object set; update its value.
                if (src[p] && src[p].constructor === Object) {
                    if (!dest[p]) {
                        dest[p] = {};
                    }
                    dest[p] = this._mergeRecursive(dest[p], src[p]);
                } else {
                    if (dest[p] && typeMatch) {
                        if (typeof dest[p] === typeof src[p]) {
                            dest[p] = src[p];
                        }
                    } else {
                        dest[p] = src[p];
                    }
                }
            }
        }
        return dest;
    },


    // deep copies an object
    _cloneObj: function(o) {
        var newO,
            i;

        if (typeof o !== 'object') {
            return o;
        }
        if (!o) {
            return o;
        }

        if ('[object Array]' === Object.prototype.toString.apply(o)) {
            newO = [];
            for (i = 0; i < o.length; i += 1) {
                newO[i] = this._cloneObj(o[i]);
            }
            return newO;
        }

        newO = {};
        for (i in o) {
            if (o.hasOwnProperty(i)) {
                newO[i] = this._cloneObj(o[i]);
            }
        }
        return newO;
    },


    /*
     * A wrapper for fs.readdirSync() that guarantees ordering. The order in
     * which the file system is walked is significant within the resource
     * store, e.g., when looking up a matching context.
     *
     * @param path {string} directory to read
     * @return {array} files in the directory
     */
    _sortedReaddirSync: function(path) {
        var out = this._libs.fs.readdirSync(path);
        return out.sort();
    }

};


module.exports = ServerStore;
