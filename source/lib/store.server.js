/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint
    anon:true, sloppy:true, regexp: true, continue: true, nomen:true, node:true
*/


var libfs = require('fs'),
    libglob = require('./glob'),
    libpath = require('path'),
    libqs = require('querystring'),
    libvm = require('vm'),
    libwalker = require('./package-walker.server'),
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
 *
 * <pre>
 *   - id
 *       context-insensitive ID of the resource
 *       said another way, all versions of a resource have the same ID
 *
 *   - type
 *       see above
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

    // full paths to routes files, to aid detection
    this._preload_routes = {};

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
    // (These are mostly populated by the _preloadResource() method.)
    this._preload = {
        appMeta:    {}, // application-level
        sharedMeta: {}, // shared between each mojit
        mojitMeta:  {}  // individual to each mojit
    };

    // These are similar to the _preload above, except the affinity has been resolved
    // down for each environment ("client" or "server").  Also, the ctxKey has been
    // moved above resid to optimize lookup during runtime.
    this._appMetaNC = {};           // [resid] = { parts }
    this._appMeta = {};             // [env][ctxKey][resid] = { parts }
    this._sharedMeta = {};          // [env][ctxKey][resid] = { parts }
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
     * @method preload
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
     * @method setLogger
     * @param l {object} object containing a log(message,level,source) function
     * @return {nothing}
     */
    setLogger: function(l) {
        logger = l;
    },


    /**
     * Returns, via callback, the fully expanded mojit instance specification.
     *
     * @method getSpec
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
     * @method getType
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
     * @method expandInstance
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
     * @method expandInstanceForEnv
     * @param env {string} "client" or "server"
     * @param instance {object} partial instance to expand
     * @param ctx {object} the runtime context for the instance
     * @param cb {function(err,instance)} callback used to return the results (or error)
     * @return {nothing} results returned via the callback parameter
     */
    expandInstanceForEnv: function(env, instance, ctx, cb) {
        //logger.log('expandInstanceForEnv(' + env + ',' +
        //    (instance.id||'@'+instance.type) + ')');
        var self = this,
            base,
            appConfig = this.getAppConfig(ctx, 'application'),
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
     * @method getAppConfig
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

        if ('application' === name && (!ctx || !Object.keys(ctx).length)) {
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
     * @method getRoutes
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
     * @method fileFromStaticHandlerURL
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
     * @method getYuiConfigAllMojits
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
                        if (res.sharedMojit) {
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
     * @method getYuiConfigFw
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

        if (!this._sharedMeta[env]) {
            return {modules: {}};
        }
        ress = this._getResourceListForContext(this._sharedMeta[env], ctx);
        for (resid in ress) {
            if (ress.hasOwnProperty(resid)) {
                res = ress[resid];
                if (!res.yuiModuleName) {
                    continue;
                }
                if ('mojito' !== res.pkg.name) {
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
     * @method getYiConfigApp
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

        if (!this._sharedMeta[env]) {
            return {modules: {}};
        }
        ress = this._getResourceListForContext(this._sharedMeta[env], ctx);
        for (resid in ress) {
            if (ress.hasOwnProperty(resid)) {
                res = ress[resid];
                if (!res.yuiModuleName) {
                    continue;
                }
                if ('mojito' === res.pkg.name) {
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
     * returns a serializeable object used to initialize Mojito on the client
     *
     * FUTURE: [Issue 105] Cache the output of this function
     * cache key:  all of ctx
     *
     * @method serializeClientStore
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

        out.appConfig = this.getAppConfig(ctx, 'application');

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
     * @method listAllMojits
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
     * @method getAllMojits
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


    /**
     * Given a set of known contexts, finds the best match for a runtime context.
     * Gives special consideration to the "lang" key in the contexts.
     *
     * @method _findBestContext
     * @param currentContext {object} runtime context
     * @param contexts {object} a mapping of context key to context
     * @return {string} null or the context key of the best match
     * @private
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
     * @method getMojitTypeDetails
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
                    name = res.name;
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
                    if (res.sharedMojit) {
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
     * @method getRollupsApp
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

        ress = this._getResourceListForContext(this._sharedMeta[env], ctx);
        for (resid in ress) {
            if (ress.hasOwnProperty(resid)) {
                res = ress[resid];
                if (!res.yuiModuleName) {
                    continue;
                }
                srcs.push(res.fsPath);
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
     * @method getRollupsMojits
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
                        if (res.sharedMojit) {
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
     * @method getInlineCssMojits
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

    /**
     * the "static" version of the application.json is the version that has
     * the context applied that was given at server-start time.
     *
     * @method _readAppConfigStatic
     * @return {object} static config
     * @private
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


    /**
     * Read the application's dimensions.json file for YCB processing. If not
     * available, fall back to the framework's default dimensions.json.
     *
     * @method _readYcbDimensions
     * @return {array} contents of the dimensions.json file
     * @private
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


    /**
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
     * @method _isValidYcbDimensions
     * @param {array} dimensions
     * @return {boolean}
     * @private
     */
    _isValidYcbDimensions: function(dims) {
        var isArray = Y.Lang.isArray;

        return isArray(dims) &&
            dims.length === 1 &&
            isArray(dims[0].dimensions) &&
            dims[0].dimensions.length > 0;
    },


    /**
     * preload metadata about all resources in the application (and Mojito framework)
     *
     * @method _preloadMeta
     * @return {nothing} work down via other called methods
     * @private
     */
    _preloadMeta: function() {
        var me = this,
            walker,
            walkedMojito = false,
            dir,
            info;
        walker = new libwalker.BreadthFirst(this._root);
        walker.walk(function(err, info) {
            if (err) {
                throw err;
            }
            if ('mojito' === info.pkg.name) {
                walkedMojito = true;
            }
            me._preloadPackage(info);
        });

        // user might not have installed mojito as a dependency of their
        // application.  (they -should- have but might not have.)
        if (!walkedMojito) {
            dir = libpath.join(mojitoRoot, '..');
            info = {
                depth: 999,
                parents: [],
                dir: dir
            };
            info.pkg = this._readMojitConfigFile(libpath.join(dir, 'package.json'), false);

            // special case for weird packaging situations
            if (!Object.keys(info.pkg).length) {
                info.dir = mojitoRoot;
                info.pkg = {
                    name: 'mojito',
                    version: '0.666.666',
                    yahoo: {
                        mojito: {
                            type: 'bundle',
                            location: 'app'
                        }
                    }
                };
            }

            this._preloadPackage(info);
        }
    },


    /**
     * preloads metadata about resources in the application directory
     * (but not node_modules/)
     *
     * @method _preloadApp
     * @param pkg {object} metadata (name and version) about the app's package
     * @return {nothing} work down via other called methods
     * @private
     */
    _preloadApp: function(pkg) {
        var i,
            path;

        // mark routes, to aid in detecting them later
        for (i = 0; i < this._appConfigStatic.routesFiles.length; i += 1) {
            path = this._appConfigStatic.routesFiles[i];
            if ('/' !== path.charAt(0)) {
                path = libpath.join(this._root, path);
            }
            if (!libpath.existsSync(path)) {
                logger.log('missing routes file. skipping ' + path, 'warn', NAME);
                continue;
            }
            this._preload_routes[path] = true;
        }

        this._preloadDirBundle(this._root, pkg, true);

        // load mojitsDirs
        for (i = 0; i < this._appConfigStatic.mojitsDirs.length; i += 1) {
            path = this._appConfigStatic.mojitsDirs[i];
            this._preloadDirMojits(path, pkg);
        }

        // load mojitDirs
        if (this._appConfigStatic.mojitDirs) {
            for (i = 0; i < this._appConfigStatic.mojitDirs.length; i += 1) {
                path = this._appConfigStatic.mojitDirs[i];
                this._preloadDirMojit(path, pkg, path);
            }
        }
    },


    /**
     * preloads metadata about resources in a package
     * (but not subpackages in its node_modules/)
     *
     * @method _preloadPackage
     * @param info {object} metadata about the package
     * @return {nothing} work down via other called methods
     * @private
     */
    _preloadPackage: function(info) {
        var dir,
            pkg;
        // FUTURE:  use info.inherit to scope mojit dependencies
        /*
        console.log('--PACKAGE-- ' + info.depth + ' ' + info.pkg.name + '@' + info.pkg.version
                + ' \t' + (info.pkg.yahoo && info.pkg.yahoo.mojito && info.pkg.yahoo.mojito.type)
                + ' \t[' + info.parents.join(',') + ']'
        //      + ' \t-- ' + JSON.stringify(info.inherit)
        );
        */
        pkg = {
            name: info.pkg.name,
            version: info.pkg.version
        };
        if (0 === info.depth) {
            // the actual application is handled specially
            this._preloadApp(pkg);
            return;
        }
        if (!info.pkg.yahoo || !info.pkg.yahoo.mojito) {
            return;
        }
        switch (info.pkg.yahoo.mojito.type) {
        case 'bundle':
            dir = libpath.join(info.dir, info.pkg.yahoo.mojito.location);
            this._preloadDirBundle(dir, pkg, false);
            this._preloadDirMojits(libpath.join(dir, 'mojits'), pkg);
            break;
        case 'mojit':
            dir = libpath.join(info.dir, info.pkg.yahoo.mojito.location);
            this._preloadDirMojit(dir, pkg, info.dir);
            break;
        default:
            logger.log('Unknown package type "' + info.pkg.yahoo.mojito.type + '"', 'warn', NAME);
            break;
        }
    },


    /**
     * preloads metadata about resource in a directory
     *
     * @method _preloadDirBundle
     * @param dir {string} directory path
     * @param pkg {object} metadata (name and version) about the package
     * @param loadConfig {boolean} whether to also preload metadata about the configuration files
     * @return {nothing} work down via other called methods
     * @private
     */
    _preloadDirBundle: function(dir, pkg, loadConfig) {
        var i,
            res,
            resources;
        resources = this._findResourcesByConvention(dir, pkg, 'shared');
        for (i = 0; i < resources.length; i += 1) {
            res = resources[i];
            switch (res.type) {
            case 'config':
                if (!loadConfig) {
                    if ('package' !== res.name) {
                        logger.log('config file "' + res.shortPath + '" not used here. skipping.', 'warn', NAME);
                    }
                    break;
                }
                this._preloadResource(res, null);
                break;

            // app-level
            case 'archetype':
            case 'command':
            case 'middleware':
                this._preloadResource(res, null);
                break;

            // mojit-level
            case 'action':
            case 'addon':
            case 'asset':
            case 'binder':
            case 'controller':
            case 'model':
            case 'spec':
            case 'view':
            case 'yui-lang':
            case 'yui-module':
                this._preloadResource(res, 'shared');
                break;

            default:
                logger.log('unknown resource type "' + res.type + '". skipping ' + res.fsPath, 'warn', NAME);
                break;
            } // switch
        } // for each resource
    },


    /**
     * @method _parseResourceArchetype
     * @param res {object} partial resource
     * @return {object|null} parsed resource, or null if shouldn't be used
     * @private
     */
    _parseResourceArchetype: function(res, subtype) {
        var dir,
            ext,
            file;

        // archetypes don't support our ".affinity." or ".selector." filename syntax
        dir = libpath.dirname(res.shortPath);
        ext = libpath.extname(res.shortPath);
        file = libpath.basename(res.shortPath, ext);

        res.name = libpath.join(dir, file);
        res.type = 'archetype';
        res.subtype = subtype;
        res.id = 'archetype-' + res.subtype + '-' + res.name;
        return res;
    },


    /**
     * @method _parseResourceCommand
     * @param res {object} partial resource
     * @return {object|null} parsed resource, or null if shouldn't be used
     * @private
     */
    _parseResourceCommand: function(res) {
        var dir,
            ext,
            file;

        // commands don't support our ".affinity." or ".selector." filename syntax
        dir = libpath.dirname(res.shortPath);
        ext = libpath.extname(res.shortPath);
        file = libpath.basename(res.shortPath, ext);

        res.name = libpath.join(dir, file);
        res.type = 'command';
        res.id = 'command-' + res.name;
        return res;
    },


    /**
     * @method _parseResourceMiddleware
     * @param res {object} partial resource
     * @return {object|null} parsed resource, or null if shouldn't be used
     * @private
     */
    _parseResourceMiddleware: function(res) {
        var dir,
            ext,
            file;

        // middleware doesn't support our ".affinity." or ".selector." filename syntax
        dir = libpath.dirname(res.shortPath);
        ext = libpath.extname(res.shortPath);
        file = libpath.basename(res.shortPath, ext);

        res.name = libpath.join(dir, file);
        res.type = 'middleware';
        res.id = 'middleware-' + res.name;
        return res;
    },


    /**
     * @method _parseResourceConfig
     * @param res {object} partial resource
     * @return {object|null} parsed resource, or null if shouldn't be used
     * @private
     */
    _parseResourceConfig: function(res, mojitType) {
        var dir,
            ext,
            file,
            pathParts;

        // configs don't support our ".affinity." or ".selector." filename syntax
        dir = libpath.dirname(res.shortPath);
        ext = libpath.extname(res.shortPath);
        file = libpath.basename(res.shortPath, ext);
        pathParts = {
            affinity: new Affinity('server'),
            contextKey: '*',
            contextParts: {},
            ext: ext
        };

        if ('.json' !== pathParts.ext) {
            return;
        }
        if (this._skipBadPath(pathParts)) {
            return;
        }
        if (this._preload_routes[res.fsPath]) {
            res.configType = 'routes';
        }
        res.name = libpath.join(dir, file);
        res.type = 'config';
        res.id = 'config-' + res.name;
        res.pathParts = pathParts;
        return res;
    },


    /**
     * @method _parseResourceAction
     * @param res {object} partial resource
     * @return {object|null} parsed resource, or null if shouldn't be used
     * @private
     */
    _parseResourceAction: function(res, mojitType) {
        var pathParts = this._parsePath(res, 'server');
        if ('.js' !== pathParts.ext) {
            return;
        }
        if (this._skipBadPath(pathParts)) {
            return;
        }
        res.name = libpath.join(libpath.dirname(res.shortPath), pathParts.shortFile);
        res.type = 'action';
        res.id = 'action-' + res.name;
        this._precalcYuiModule(res);
        this._precalcStaticURL(res, mojitType);
        res.pathParts = pathParts;
        return res;
    },


    /**
     * @method _parseResourceAddon
     * @param res {object} partial resource
     * @return {object|null} parsed resource, or null if shouldn't be used
     * @private
     */
    _parseResourceAddon: function(res, mojitType, subtype) {
        var pathParts = this._parsePath(res, 'server');
        if ('.js' !== pathParts.ext) {
            return;
        }
        if (this._skipBadPath(pathParts)) {
            return;
        }
        res.name = libpath.join(libpath.dirname(res.shortPath), pathParts.shortFile);
        res.type = 'addon';
        res.addonType = subtype;
        res.id = 'addon-' + res.addonType + '-' + res.name;
        this._precalcYuiModule(res);
        this._precalcStaticURL(res, mojitType);
        res.pathParts = pathParts;
        return res;
    },


    /**
     * @method _parseResourceAsset
     * @param res {object} partial resource
     * @return {object|null} parsed resource, or null if shouldn't be used
     * @private
     */
    _parseResourceAsset: function(res, mojitType) {
        var dir,
            ext,
            file,
            fileParts,
            pathParts;

        // binders don't support our ".affinity." filename syntax
        dir = libpath.dirname(res.shortPath);
        ext = libpath.extname(res.shortPath);
        file = libpath.basename(res.shortPath, ext);
        fileParts = file.split('.');

        pathParts = {
            affinity: new Affinity('common'),
            contextKey: '*',
            contextParts: {},
            ext: ext
        };
        if (fileParts.length >= 2) {
            pathParts.contextParts.device = fileParts.pop();
            pathParts.contextKey = libqs.stringify(pathParts.contextParts);
        }
        pathParts.shortFile = fileParts.join('.');
        if (this._skipBadPath(pathParts)) {
            return;
        }

        res.name = libpath.join(dir, pathParts.shortFile) + pathParts.ext;
        res.type = 'asset';
        res.assetType = pathParts.ext.substr(1);
        res.id = 'asset-' + res.name;
        this._precalcStaticURL(res, mojitType);
        res.pathParts = pathParts;
        return res;
    },


    /**
     * @method _parseResourceBinder
     * @param res {object} partial resource
     * @return {object|null} parsed resource, or null if shouldn't be used
     * @private
     */
    _parseResourceBinder: function(res, mojitType) {
        var dir,
            ext,
            file,
            fileParts,
            pathParts;

        // binders don't support our ".affinity." filename syntax
        dir = libpath.dirname(res.shortPath);
        ext = libpath.extname(res.shortPath);
        file = libpath.basename(res.shortPath, ext);
        fileParts = file.split('.');

        pathParts = {
            affinity: new Affinity('client'),
            contextKey: '*',
            contextParts: {},
            ext: ext
        };
        if (fileParts.length >= 2) {
            pathParts.contextParts.device = fileParts.pop();
            pathParts.contextKey = libqs.stringify(pathParts.contextParts);
        }
        pathParts.shortFile = fileParts.join('.');
        if ('.js' !== pathParts.ext) {
            return;
        }
        if (this._skipBadPath(pathParts)) {
            return;
        }

        res.name = libpath.join(libpath.dirname(res.shortPath), pathParts.shortFile);
        res.type = 'binder';
        res.id = 'binder-' + res.name;
        this._precalcYuiModule(res);
        this._precalcStaticURL(res, mojitType);
        res.pathParts = pathParts;
        return res;
    },


    /**
     * @method _parseResourceController
     * @param res {object} partial resource
     * @return {object|null} parsed resource, or null if shouldn't be used
     * @private
     */
    _parseResourceController: function(res, mojitType) {
        var pathParts = this._parsePath(res, 'server');
        if ('.js' !== pathParts.ext) {
            return;
        }
        if (this._skipBadPath(pathParts)) {
            return;
        }
        res.name = 'controller';
        res.type = 'controller';
        res.id = 'controller';
        this._precalcYuiModule(res);
        this._precalcStaticURL(res, mojitType);
        res.pathParts = pathParts;
        return res;
    },


    /**
     * @method _parseResourceModel
     * @param res {object} partial resource
     * @return {object|null} parsed resource, or null if shouldn't be used
     * @private
     */
    _parseResourceModel: function(res, mojitType) {
        var pathParts = this._parsePath(res, 'server');
        if ('.js' !== pathParts.ext) {
            return;
        }
        if (this._skipBadPath(pathParts)) {
            return;
        }
        res.name = libpath.join(libpath.dirname(res.shortPath), pathParts.shortFile);
        res.type = 'model';
        res.id = 'model-' + res.name;
        this._precalcYuiModule(res);
        this._precalcStaticURL(res, mojitType);
        res.pathParts = pathParts;
        return res;
    },


    /**
     * @method _parseResourceSpec
     * @param res {object} partial resource
     * @return {object|null} parsed resource, or null if shouldn't be used
     * @private
     */
    _parseResourceSpec: function(res, mojitType) {
        var dir,
            ext,
            file,
            pathParts,
            appConfig,
            prefix;

        // specs don't support our ".affinity." or ".selector." filename syntax
        dir = libpath.dirname(res.shortPath);
        ext = libpath.extname(res.shortPath);
        file = libpath.basename(res.shortPath, ext);
        pathParts = {
            affinity: new Affinity('server'),
            contextKey: '*',
            contextParts: {},
            ext: ext
        };
        pathParts.shortFile = file;
        if ('.json' !== pathParts.ext) {
            return;
        }
        if (this._skipBadPath(pathParts)) {
            return;
        }

        res.name = libpath.join(libpath.dirname(res.shortPath), pathParts.shortFile);
        res.type = 'spec';
        res.id = 'spec-' + res.name;

        appConfig = this._appConfigStatic.staticHandling || {};
        prefix = '/static';
        if (typeof appConfig.prefix !== 'undefined') {
            prefix = appConfig.prefix ? '/' + appConfig.prefix : '';
        }

        // namespaced by mojitType
        res.specName = mojitType;
        if (res.name !== 'default') {
            res.specName += ':' + res.name;
        }

        res.dynamicHandlerURL = prefix + '/' + mojitType + '/specs/' + res.shortPath;
        return res;
    },


    /**
     * @method _parseResourceView
     * @param res {object} partial resource
     * @return {object|null} parsed resource, or null if shouldn't be used
     * @private
     */
    _parseResourceView: function(res, mojitType) {
        var pathParts,
            fileParts;
        // views don't support our ".affinity." filename syntax
        pathParts = {
            affinity: new Affinity('common'),
            contextKey: '*',
            contextParts: {},
            ext: libpath.extname(res.shortPath)
        };
        fileParts = libpath.basename(res.shortPath).split('.');
        res.viewOutputFormat = fileParts.pop();
        res.viewEngine = fileParts.pop();
        if (fileParts.length >= 2) {
            pathParts.contextParts.device = fileParts.pop();
            pathParts.contextKey = libqs.stringify(pathParts.contextParts);
        }
        pathParts.shortFile = fileParts.join('.');

        if (fileParts.length !== 1) {
            logger.log('invalid view filename. skipping ' + res.fsPath, 'warn', NAME);
            return;
        }
        if (this._skipBadPath(pathParts)) {
            return;
        }

        res.name = libpath.join(libpath.dirname(res.shortPath), pathParts.shortFile);
        res.type = 'view';
        res.id = 'view-' + res.name;
        this._precalcStaticURL(res, mojitType);
        res.pathParts = pathParts;
        return res;
    },


    /**
     * @method _parseResourceYuiLang
     * @param res {object} partial resource
     * @return {object|null} parsed resource, or null if shouldn't be used
     * @private
     */
    _parseResourceYuiLang: function(res, mojitType) {
        var pathParts,
            shortName;
        // language bundles don't support our ".affinity." filename syntax
        pathParts = {
            affinity: new Affinity('common'),
            contextKey: '*',
            contextParts: {},
            ext: libpath.extname(res.shortPath)
        };
        if ('.js' !== pathParts.ext) {
            return;
        }
        if (this._skipBadPath(pathParts)) {
            return;
        }
        pathParts.shortFile = libpath.basename(res.shortPath, pathParts.ext);
        if (pathParts.shortFile === mojitType) {
            res.langCode = '';
        } else if (mojitType === pathParts.shortFile.substr(0, mojitType.length)) {
            res.langCode = pathParts.shortFile.substr(mojitType.length + 1);
        } else {
            logger.log('invalid YUI lang file format. skipping ' + res.fsPath, 'error', NAME);
            return;
        }
        if (res.langCode) {
            pathParts.contextParts.lang = res.langCode;
            pathParts.contextKey = libqs.stringify(pathParts.contextParts);
        }

        res.name = res.langCode;
        res.type = 'yui-lang';
        res.id = 'yui-lang-' + res.langCode;

        if (!this._mojitLangs[mojitType]) {
            this._mojitLangs[mojitType] = [];
        }
        if (res.langCode) {
            this._mojitLangs[mojitType].push(res.langCode);
        }

        this._precalcYuiModule(res);
        this._precalcStaticURL(res, mojitType);
        res.pathParts = pathParts;
        return res;
    },


    /**
     * @method _parseResourceYuiModule
     * @param res {object} partial resource
     * @return {object|null} parsed resource, or null if shouldn't be used
     * @private
     */
    _parseResourceYuiModule: function(res, mojitType) {
        var pathParts = this._parsePath(res);
        if ('.js' !== pathParts.ext) {
            return;
        }
        if (this._skipBadPath(pathParts)) {
            return;
        }

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

        this._precalcYuiModule(res);
        res.name = res.yuiModuleName;
        res.type = 'yui-module';
        res.id = 'yui-module-' + res.name;
        this._precalcStaticURL(res, mojitType);
        res.pathParts = pathParts;
        return res;
    },


    /**
     * preloads a directory containing many mojits
     *
     * @method _preloadDirMojits
     * @param dir {string} directory path
     * @param pkg {object} metadata (name and version) about the package
     * @return {nothing} work down via other called methods
     * @private
     */
    _preloadDirMojits: function(dir, pkg) {
        var i,
            realDirs,
            children,
            childName,
            childPath;

        if ('/' !== dir.charAt(0)) {
            dir = libpath.join(this._root, dir);
        }

        // handle globbing
        if (dir.indexOf('*') >= 0) {
            realDirs = [];
            libglob.globSync(dir, {}, realDirs);
            if (!realDirs.length) {
                logger.log('Failed to find any mojitsDirs matching ' + dir, 'error', NAME);
                return;
            }
            for (i = 0; i < realDirs.length; i += 1) {
                this._preloadDirMojits(realDirs[i], pkg);
            }
            return;
        }

        if (!this._libs.path.existsSync(dir)) {
            return;
        }

        children = this._sortedReaddirSync(dir);
        for (i = 0; i < children.length; i += 1) {
            childName = children[i];
            if ('.' === childName.substring(0, 1)) {
                continue;
            }
            childPath = libpath.join(dir, childName);
            this._preloadDirMojit(childPath, pkg, childPath);
        }
    },


    /**
     * preloads a directory that represents a single mojit
     *
     * @method _preloadDirMojit
     * @param dir {string} directory path
     * @param pkg {object} metadata (name and version) about the package
     * @param pkgDir {string} directory of the packaging for this mojit
     * @return {nothing} work down via other called methods
     * @private
     */
    _preloadDirMojit: function(dir, pkg, pkgDir) {
        var i,
            realDirs,
            resources,
            res,
            mojitType,
            packageJson,
            definitionJson,
            appConfig,
            prefix,
            url;

        if ('/' !== dir.charAt(0)) {
            dir = libpath.join(this._root, dir);
        }

        // handle globbing
        if (dir.indexOf('*') >= 0) {
            realDirs = [];
            libglob.globSync(dir, {}, realDirs);
            if (!realDirs.length) {
                logger.log('Failed to find any mojitDirs matching ' + dir, 'error', NAME);
                return;
            }
            for (i = 0; i < realDirs.length; i += 1) {
                this._preloadDirMojit(realDirs[i], pkg, pkgDir);
            }
            return;
        }

        if (!this._libs.path.existsSync(dir)) {
            return;
        }

        mojitType = libpath.basename(dir);
        packageJson = this._readMojitConfigFile(libpath.join(pkgDir, 'package.json'), false);
        if (packageJson) {
            if (packageJson.name) {
                mojitType = packageJson.name;
            }
            if (pkg.name !== 'mojito') {
                // TODO:  deprecate.  NPM "engine" is better
                if (!this._mojitoVersionMatch(packageJson, this._version)) {
                    logger.log('Mojito version mismatch: mojit skipped in "' +
                        dir + '"', 'warn', NAME);
                    return;
                }

                this._mojitPackageAsAsset(dir, mojitType, packageJson);
            }
        }
        this._mojitPaths[mojitType] = dir;

        definitionJson = this._readMojitConfigFile(libpath.join(dir, 'definition.json'), true);
        if (definitionJson.appLevel) {
            mojitType = 'shared';
        }

        if ('shared' !== mojitType) {
            // TODO: [Issue 109] re-use logic from _precalcStaticURL() for
            // prefix (so that all options are supported)
            appConfig = this._appConfigStatic.staticHandling || {};
            prefix = '/static';
            if (typeof appConfig.prefix !== 'undefined') {
                prefix = appConfig.prefix ? '/' + appConfig.prefix : '';
            }
            url = prefix + '/' + mojitType + '/definition.json';
            this._dynamicURLs[url] = libpath.join(dir, 'definition.json');
        }

        resources = this._findResourcesByConvention(dir, pkg, mojitType);
        for (i = 0; i < resources.length; i += 1) {
            res = resources[i];
            switch (res.type) {
            // app-level
            case 'archetype':
            case 'command':
            case 'middleware':
                logger.log('app-level resources not allowed here. skipping ' + res.fsPath, 'warn', NAME);
                this._preloadResource(res, mojitType);
                break;

            // mojit-level
            case 'action':
            case 'addon':
            case 'asset':
            case 'binder':
            case 'controller':
            case 'model':
            case 'spec':
            case 'view':
            case 'yui-lang':
            case 'yui-module':
                this._preloadResource(res, mojitType);
                break;
            case 'config':
                if ('shared' !== mojitType) {
                    this._preloadResource(res, mojitType);
                }
                break;

            default:
                logger.log('unknown resource type "' + res.type + '". skipping ' + res.fsPath, 'warn', NAME);
                break;
            } // switch
        }
    },


    /**
     * Finds resources based on our conventions
     * -doesn't- load mojits or their contents.  That's done elsewhere.
     *
     * actions/{name}.**.js
     * addons/{subtype}/{name}.**.js
     * archetypes/{subtype}/{name}/
     * assets/{everything}
     * binders/{name}.**.js
     * commands/{name}.js
     * controller.**.js
     * lang/{name}.**.js
     * middleware/{name}.js
     * models/{name}.**.js
     * views/{name}.**.{ext}
     * yui_modules/{name}.**.js
     *
     * @method _findResourcesByConvention
     * @param dir {string} directory from which to find resources
     * @param pkg {object} metadata (name and version) about the package
     * @param mojitType {string|null} name of mojit to which the resource belongs
     * @return {array} list of resources
     * @private
     */
    _findResourcesByConvention: function(dir, pkg, mojitType) {
        var me = this,
            resources = [];
        //console.log('-- FIND RESOURCES BY CONVENTION -- ' + pkg.name + '@' + pkg.version + ' -- ' + mojitType);

        this._walkDirRecursive(dir, function(error, subdir, file, isFile) {
            var pathParts,
                fileParts,
                ext,
                subtype,
                res;

            if ('node_modules' === file) {
                return false;
            }
            if ('libs' === file) {
                return false;
            }
            if ('tests' === file && 'test' !== me._appConfigStatic.env) {
                return false;
            }

            pathParts = libpath.join(subdir, file).split('/');
            if (!isFile) {

                // mojits are loaded another way later
                if ('.' === subdir && 'mojits' === file) {
                    return false;
                }

                if (pathParts.length === 3 && 'archetypes' === pathParts[0]) {
                    subtype = pathParts[1];
                    res = {
                        pkg: pkg,
                        fsPath: libpath.join(dir, subdir, file),
                        shortPath: pathParts.slice(2).join('/')
                    };
                    res = me._parseResourceArchetype(res, subtype);
                    if (res) {
                        resources.push(res);
                    }
                    // no need to recurse into the archetype at this time
                    return false;
                }

                // otherwise, just recurse
                return true;
            }

            fileParts = file.split('.');
            ext = fileParts[fileParts.length - 1];

            if ('.' === subdir && 'json' === ext) {
                res = {
                    pkg: pkg,
                    fsPath: libpath.join(dir, subdir, file),
                    shortPath: libpath.join(subdir, file)
                };
                res = me._parseResourceConfig(res, mojitType);
                if (res) {
                    resources.push(res);
                }
                return;
            }

            if (pathParts.length >= 2 && 'commands' === pathParts[0]) {
                res = {
                    pkg: pkg,
                    fsPath: libpath.join(dir, subdir, file),
                    shortPath: pathParts.slice(1).join('/')
                };
                res = me._parseResourceCommand(res);
                if (res) {
                    resources.push(res);
                }
                return;
            }

            if (pathParts.length >= 2 && 'middleware' === pathParts[0]) {
                res = {
                    pkg: pkg,
                    fsPath: libpath.join(dir, subdir, file),
                    shortPath: pathParts.slice(1).join('/')
                };
                res = me._parseResourceMiddleware(res);
                if (res) {
                    resources.push(res);
                }
                return;
            }

            if (pathParts.length >= 2 && 'actions' === pathParts[0]) {
                res = {
                    pkg: pkg,
                    fsPath: libpath.join(dir, subdir, file),
                    shortPath: pathParts.slice(1).join('/')
                };
                res = me._parseResourceAction(res, mojitType);
                if (res) {
                    resources.push(res);
                }
                return;
            }

            if (pathParts.length >= 3 && 'addons' === pathParts[0]) {
                subtype = pathParts[1];
                res = {
                    pkg: pkg,
                    fsPath: libpath.join(dir, subdir, file),
                    shortPath: pathParts.slice(2).join('/')
                };
                res = me._parseResourceAddon(res, mojitType, subtype);
                if (res) {
                    resources.push(res);
                }
                return;
            }

            if (pathParts.length >= 2 && 'assets' === pathParts[0]) {
                res = {
                    pkg: pkg,
                    fsPath: libpath.join(dir, subdir, file),
                    shortPath: pathParts.slice(1).join('/')
                };
                res = me._parseResourceAsset(res, mojitType);
                if (res) {
                    resources.push(res);
                }
                return;
            }

            if (pathParts.length >= 2 && 'binders' === pathParts[0]) {
                res = {
                    pkg: pkg,
                    fsPath: libpath.join(dir, subdir, file),
                    shortPath: pathParts.slice(1).join('/')
                };
                res = me._parseResourceBinder(res, mojitType);
                if (res) {
                    resources.push(res);
                }
                return;
            }

            if ('.' === subdir && 'controller' === fileParts[0]) {
                res = {
                    pkg: pkg,
                    fsPath: libpath.join(dir, subdir, file),
                    shortPath: libpath.join(subdir, file)
                };
                res = me._parseResourceController(res, mojitType);
                if (res) {
                    resources.push(res);
                }
                return;
            }

            if (pathParts.length >= 2 && 'lang' === pathParts[0]) {
                res = {
                    pkg: pkg,
                    fsPath: libpath.join(dir, subdir, file),
                    shortPath: pathParts.slice(1).join('/')
                };
                res = me._parseResourceYuiLang(res, mojitType);
                if (res) {
                    resources.push(res);
                }
                return;
            }

            if (pathParts.length >= 2 && 'models' === pathParts[0]) {
                res = {
                    pkg: pkg,
                    fsPath: libpath.join(dir, subdir, file),
                    shortPath: pathParts.slice(1).join('/')
                };
                res = me._parseResourceModel(res, mojitType);
                if (res) {
                    resources.push(res);
                }
                return;
            }

            if (pathParts.length >= 2 && 'specs' === pathParts[0]) {
                res = {
                    pkg: pkg,
                    fsPath: libpath.join(dir, subdir, file),
                    shortPath: pathParts.slice(1).join('/')
                };
                res = me._parseResourceSpec(res, mojitType);
                if (res) {
                    resources.push(res);
                }
                return;
            }

            if (pathParts.length >= 2 && 'views' === pathParts[0]) {
                res = {
                    pkg: pkg,
                    fsPath: libpath.join(dir, subdir, file),
                    shortPath: pathParts.slice(1).join('/')
                };
                res = me._parseResourceView(res, mojitType);
                if (res) {
                    resources.push(res);
                }
                return;
            }

            if (pathParts.length >= 2 && ('yui_modules' === pathParts[0]
                        || 'autoload' === pathParts[0]
                        || 'tests' === pathParts[0])) {
                res = {
                    pkg: pkg,
                    fsPath: libpath.join(dir, subdir, file),
                    shortPath: pathParts.slice(1).join('/')
                };
                res = me._parseResourceYuiModule(res, mojitType);
                if (res) {
                    resources.push(res);
                }
                return;
            }

            // unknown file, just skip.  (this includes config files which are
            // handled separately.)
            return;
        });

        return resources;
    },


    /**
     * @method _parsePath
     * @param res {object} partial resource
     * @return {object} metadata: ext, shortFile, affinity, contextKey, and contextParts
     * @private
     */
    _parsePath: function(res, defaultAffinity) {
        var out = {},
            fileParts,
            device;

        out.contextKey = '*';
        out.contextParts = {};
        out.affinity = defaultAffinity || 'server';
        out.ext = libpath.extname(res.shortPath);

        fileParts = libpath.basename(res.shortPath, out.ext).split('.');
        if (fileParts.length >= 3) {
            device = fileParts.pop();
        }
        if (fileParts.length >= 2) {
            out.affinity = fileParts.pop();
        }
        out.shortFile = fileParts.join('.');

        out.affinity = new Affinity(out.affinity);
        if (device) {
            out.contextParts.device = device;
        }
        if (!this._objectIsEmpty(out.contextParts)) {
            out.contextKey = libqs.stringify(out.contextParts);
        }
        return out;
    },


    /**
     * utility that registers the resource for later parts of the algorithm
     *
     * @method _preloadResource
     * @param res {object} metadata about the resource
     * @param mojitType {string} which mojit, if applicatable
     * @return {nothing}
     * @private
     */
    _preloadResource: function(res, mojitType) {
        var dest,
            config,
            using,
            skipping;

        if ('spec' === res.type) {
            config = this._readConfigYCB({}, res.fsPath);
            if (!this._appConfigStatic.specs) {
                this._appConfigStatic.specs = {};
            }
            this._appConfigStatic.specs[res.specName] = config;
            this._dynamicURLs[res.dynamicHandlerURL] = res.fsPath;
            return;
        }

        // non-contextualized resources
        // (... which are most app-level resources)
        if (!res.pathParts) {
            this._appMetaNC[res.id] = res;
            return;
        }

        if (!mojitType) {
            dest = this._preload.appMeta;
        } else if ('shared' === mojitType) {
            res.sharedMojit = true;
            dest = this._preload.sharedMeta;
        } else {
            if (!this._preload.mojitMeta[mojitType]) {
                this._preload.mojitMeta[mojitType] = {};
            }
            dest = this._preload.mojitMeta[mojitType];
        }

        if (!dest[res.id]) {
            dest[res.id] = {};
        }
        dest = dest[res.id];
        if (!dest[res.pathParts.affinity]) {
            dest[res.pathParts.affinity] = {};
        }
        dest = dest[res.pathParts.affinity];
        if (!dest.contexts) {
            dest.contexts = {};
        }
        if (dest[res.pathParts.contextKey]) {
            using = 'from pkg ' + dest[res.pathParts.contextKey].pkg.name + '@' +
                dest[res.pathParts.contextKey].pkg.version;
            skipping = 'from pkg ' + res.pkg.name + '@' + res.pkg.version;
            if (using === skipping) {
                using = dest[res.pathParts.contextKey].shortPath;
                skipping = res.shortPath;
            }
            if (using === skipping) {
                using = dest[res.pathParts.contextKey].fsPath;
                skipping = res.fsPath;
            }
            logger.log('ALREADY EXISTS: ' + res.type + ' ' + res.shortPath +
                    (mojitType ? ' -- in mojit ' + mojitType : '') +
                    ' -- using ' + using + ' -- skipping ' + skipping,
                    'info', NAME);
            return;
        }
        dest.contexts[res.pathParts.contextKey] = res.pathParts.contextParts;
        dest[res.pathParts.contextKey] = res;
        delete res.pathParts;

        if (res.staticHandlerURL) {
            this._staticURLs[res.staticHandlerURL] = res.staticHandlerFsPath;
            delete res.staticHandlerFsPath;
        }
    },


    /**
     * Note: this MUST be called before _parseResourceSpec()
     *
     * Generates URL's about each spec in application.json
     *
     * @method _urlsForAppSpecs
     * @return {nothing}
     * @private
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


    /**
     * prereads the configuration file, if possible
     * (configuration files in YCB format cannot be preread)
     *
     * @method _prereadConfigs
     * @param src {object} contextualized resources
     * @return {nothing}
     * @private
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


    /**
     * Reads and parses a JSON file
     *
     * @method _readConfigJSON
     * @param fullpath {string} path to JSON file
     * @return {mixed} contents of JSON file
     * @private
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


    /**
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
     * @method _precalcValidYCBDimensions
     * @param dimensions {object} Top-level YCB "dimensions" object
     * @return object
     * @private
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


    /**
     * Flatten the keys in a nested structure into a single object. The first
     * argument is modified. All values are set to null.
     *
     * @method _flattenYCBDimensions
     * @param keys {object} The accumulator for keys.
     * @param obj {object}
     * @private
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


    /**
     * Return a context that contains only valid dimensions and values.
     *
     * @method _getValidYCBContext
     * @param ctx {object} runtime context
     * @return {object} filtered runtime context
     * @private
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


    /**
     * reads a configuration file that is in YCB format
     *
     * @method _readConfigYCB
     * @param ctx {object} runtime context
     * @param fullpath {string} path to the YCB file
     * @param isAppConfig {boolean} indicates whether the file being read is the application.json
     * @return {object} the contextualized configuration
     * @private
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


    /**
     * Reads a configuration file for a mojit
     *
     * @method _readMojitConfigFile
     * @param path {string} path to the file
     * @param ycb {boolean} indicates whether the file should be read using the YCB library
     * @return {object} the configuration
     * @private
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


    /** 
     * Registers the mojit's package.json as a static resource
     *
     * @method _mojitPackageAsAsset
     * @param dir {string} directory of mojit
     * @param mojitType {string} name of mojit
     * @param packageJson {object} contents of mojit's package.json
     * @return {nothing}
     * @private
     */
    _mojitPackageAsAsset: function(dir, mojitType, packageJson) {
        var pkg,
            fakeResource;

        // FUTURE:  deprecate config.mojito in package.json
        pkg = (packageJson.yahoo && packageJson.yahoo.mojito &&
                packageJson.yahoo.mojito['package']) ||
            (packageJson.config && packageJson.config.mojito &&
                packageJson.config.mojito['package']);

        if (pkg === 'public') {
            // We have to check if the "package.json" files wants to do this
            fakeResource = {
                type: 'package',
                fsPath: libpath.join(dir, 'package.json'),
                shortPath: 'package.json'
            };
            this._precalcStaticURL(fakeResource, mojitType);
            if (fakeResource.staticHandlerURL) {
                this._staticURLs[fakeResource.staticHandlerURL] =
                    fakeResource.staticHandlerFsPath;
            }
        }
    },


    /**
     * Checks to see if the version of Mojito specified in a mojit's
     * package.json matches the current verison of Mojito.
     *
     * @method _mojitoVersionMatch
     * @param pack {object} contents of the mojit's package.json file
     * @param version {string} current version of mojito
     * @return {boolean} returns true if the mojit can be used
     * @private
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


    /**
     * Takes the preloaded info and resolves ("cooks down") affinity, etc.
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
     * specific has higher precedence than shared. Within each of those,
     * the environment-specific version ("client" or "server") has higher
     * precedence than the "common" affinity.
     *
     * We do this for each context key (partial context).  We resolve
     * context inheritance (for example no-context versus device=iphone)
     * at runtime (in getMojitTypeDetails()).
     *
     * (Half of the above algorithm is implemented here, and half in
     * _cookdownMerge() which is a utility for this method.)
     *
     * @method _cookdown
     * @return {nothing}
     * @private
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
                for (resid in this._preload.sharedMeta) {
                    if (this._preload.sharedMeta.hasOwnProperty(resid)) {
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
                                this._preload.sharedMeta[resid],
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

        for (resid in this._preload.sharedMeta) {
            if (this._preload.sharedMeta.hasOwnProperty(resid)) {
                for (i = 0; i < envs.length; i += 1) {
                    env = envs[i];
                    merged = this._cookdownMerge(env,
                        [this._preload.sharedMeta[resid]]);
                    if (merged) {
                        if (!this._sharedMeta[env]) {
                            this._sharedMeta[env] = {};
                        }
                        if (!this._sharedMeta[env].contexts) {
                            this._sharedMeta[env].contexts = {};
                        }
                        for (ctxKey in merged.contexts) {
                            if (merged.contexts.hasOwnProperty(ctxKey)) {
                                this._sharedMeta[env].contexts[ctxKey] =
                                    merged.contexts[ctxKey];
                                if (!this._sharedMeta[env][ctxKey]) {
                                    this._sharedMeta[env][ctxKey] = {};
                                }
                                this._sharedMeta[env][ctxKey][resid] =
                                    merged[ctxKey];
                            }
                        }
                    }
                }
            }
        }

        delete this._preload_routes;
        delete this._preload;
    },


    /**
     * This is a utility for _cookdown().  See docs on that for details.
     *
     * The general idea is that we start with the lowest priority items
     * and let higher priority items clobber.
     *
     * @method _cookdownMerge
     * @param env {string} "client" or "server"
     * @param srcs {array} ORDER MATTERS! list of resources to merge
     * @return {TODO} TODO
     * @private
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


    /**
     * Calculates, at server start time, the YUI module dependencies
     * for mojit controllers and binders
     *
     * @method _precalcYuiDependencies
     * @return {nothing}
     * @private
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


    // Fills dest with:
    //  .controller     resource for the controller
    //  .modules        hash yuiModuleName: {
    //                          fullpath: where to load the module from
    //                          requires: list of required modules
    //                      }
    //  .required       hash yuiModuleName:true of modules required by the
    //                      source controller
    //  .viewEngines    hash name:yuiModuleName of view engines
    //
    // @method _precalcYuiDependencies_getDepParts
    // @param env {string} "client" or "server"
    // @param source {object} list of resources
    // @param dest {object} where to add results
    // @return {nothing} results put in "dest" argument
    // @private
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
                    if (!res.sharedMojit) {
                        dest.required[res.yuiModuleName] = true;
                    }
                    dest.modules[res.yuiModuleName] = {
                        requires: res.yuiModuleMeta.requires,
                        fullpath: (('client' === env) ?
                                res.staticHandlerURL :
                                res.fsPath)
                    };
                    if (('controller' === res.type)) {
                        dest.controller = res;
                    }
                }
            }
        }
        // TODO: move other dynamic dependency adjustments
        // (compiled views inlinecss) here.
    },


    /**
     * Uses YUI Loader to sort a list of YUI modules.
     *
     * @method _sortYUIModules
     * @param ctx {object} runtime context
     * @param env {string} runtime environment ("client" or "server")
     * @param yuiConfig {object} configuration for YUI
     * @param mojitType {string} name of mojit
     * @param modules {object} YUI configuration for all modules
     * @param required {object} lookup hash of modules that are required
     * @return {object} list of load-order sorted module names, and object
     *      listing paths used to load those modules
     * @private
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


    /**
     * Calculates the static handling URL for a resource.
     *
     * @method _precalcStaticURL
     * @param res {object} metadata about the resource
     * @param mojitType {string} mojit type, can be undefined for non-mojit-specific resources
     * @return {nothing} new metadata added to the "res" argument
     * @private
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
            path = libpath.join('actions', res.shortPath);
            break;
        case 'addon':
            path = libpath.join('addons', res.addonType, res.shortPath);
            break;
        case 'asset':
            path = libpath.join('assets', res.shortPath);
            break;
        case 'binder':
            path = libpath.join('binders', res.shortPath);
            break;
        case 'controller':
            path = res.shortPath;
            break;
        case 'model':
            path = libpath.join('models', res.shortPath);
            break;
        case 'view':
            path = libpath.join('views', res.shortPath);
            break;
        case 'yui-lang':
            path = libpath.join('lang', res.shortPath);
            break;
        case 'yui-module':
            // FUTURE:  change this to 'yui_modules'
            path = libpath.join('autoload', res.shortPath);
            break;
        case 'package':
            path = res.shortPath;
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

        if ('shared' === mojitType) {
            if (res.pkg && 'mojito' === res.pkg.name) {
                parts.push(frameworkName);
                if (config.useRollups && res.yuiModuleName) {
                    // fw resources are put into app-level rollup
                    rollupParts.push(appName);
                    rollupFsPath = libpath.join(this._root, 'rollup.client.js');
                }
            } else {
                parts.push(appName);
                if (config.useRollups && res.yuiModuleName) {
                    rollupParts.push(appName);
                    rollupFsPath = libpath.join(this._root, 'rollup.client.js');
                }
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
            res.staticHandlerFsPath = rollupFsPath;
        }
        if (!url) {
            url = '/' + libpath.join(parts.join('/'), path);
            res.staticHandlerFsPath = res.fsPath;
        }
        res.staticHandlerURL = url;
    },


    /**
     * Attempt to gather YUI-module details.
     *
     * @method _precalcYuiModule
     * @param res {object} metadata about the resource
     * @return {nothing} new metadata added to the "res" argument
     * @private
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


    /**
     * Reads one the configuration files for a mojit
     *
     * @method _getMojitConfig
     * @param env {string} "client" or "server"
     * @param ctx {object} runtime context
     * @param mojitType {string} name of mojit
     * @param name {string} config resource name, either "definition" or "defaults"
     * @private
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


    /**
     * Returns whether a runtime context matches a partial context
     *
     * @method _matchContext
     * @param ctx {object} runtime context
     * @param ctxParts {object} partial context
     * @private
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


    /**
     * Returns a list of resource metadata that match the context
     *
     * @method _getResourceListForContext
     * @param src {object} list of contextualized resources, key is contextKey
     * @param ctx {object} context to match
     * @return {object} list of resources, key is resource ID
     * @private
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


    /**
     * Returns a list of the language resources
     * doesn't discriminate based on context:  returns all langs for all
     * contexts.
     *
     * @method _getLangList
     * @param src {object} list of contextualized resources, key is contextKey
     * @return {object} list of language resources, key is resource ID
     * @private
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


    /**
     * Returns the metadata for a resource specific for a particular runtime context
     *
     * @method _getContextualizedResource
     * @param src {object} list of contextualized resources, key is contextKey
     * @param ctx {object} context to match
     * @param resid {string} ID of resource to find
     * @return {object} resource metadata
     * @private
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


    /**
     * Indicates whether file should be skipped based on its path
     *
     * @method _skipBadPath
     * @param pathParts {object} return value of _parsePath() (or the equivalent)
     * @return {boolean} true indicates that the file should be skipped
     * @private
     */
    _skipBadPath: function(pathParts) {
        var ext = pathParts.ext.substring(1);
        if (ext.match(isNotAlphaNum)) {
            return true;
        }
        return false;
    },


    /**
     * Generate a report of syntax errors for JavaScript code. This is also
     * very useful to find syntax errors in JSON documents.
     *
     * @method _reportJavaScriptSyntaxErrors
     * @param {string} js the JavaScript
     * @param {string} filename OPTIONAL. the name of the file containing the
     *     JavaScript
     * @return {string} if errors were found, a multi-line error report
     * @private
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


    /**
     * Returns the selector for the runtime context
     *
     * @method _selectorFromContext
     * @param ctx {object} runtime context
     * @return {string|null} selector for context
     * @private
     */
    _selectorFromContext: function(ctx) {
        if (ctx.device) {
            return ctx.device;
        }
        return null;
    },


    /**
     * @method _objectIsEmpty
     * @param o {object}
     * @return {boolean} true if the object is empty
     * @private
     */
    _objectIsEmpty: function(o) {
        if (!o) {
            return true;
        }
        return (0 === Object.keys(o).length);
    },


    // from http://stackoverflow.com/questions/171251/
    // how-can-i-merge-properties-of-two-javascript-objects-dynamically/
    // 383245#383245
    /**
     * Recursively merge one object onto another
     *
     * @method _mergeRecursive
     * @param dest {object} object to merge into
     * @param src {object} object to merge onto "dest"
     * @param matchType {boolean} controls whether a non-object in the src is
     *          allowed to clobber a non-object in the dest (if a different type)
     * @return {object} the modified "dest" object is also returned directly
     * @private
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


    /**
     * @method _cloneObj
     * @param o {mixed}
     * @return {mixed} deep copy of argument
     * @private
     */
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


    /**
     * A wrapper for fs.readdirSync() that guarantees ordering. The order in
     * which the file system is walked is significant within the resource
     * store, e.g., when looking up a matching context.
     *
     * @method _sortedReaddirSync
     * @param path {string} directory to read
     * @return {array} files in the directory
     * @private
     */
    _sortedReaddirSync: function(path) {
        var out = this._libs.fs.readdirSync(path);
        return out.sort();
    },


    /** 
     * Recursively walks a directory
     *
     * @method _walkDirRecursive
     * @param dir {string} directory to start at
     * @param cb {function(error, subdir, name, isFile)} callback called for each file
     * @param _subdir {string} INTERNAL argument, please ignore
     * @return {nothing} value returned via callback
     * @private
     */
    _walkDirRecursive: function(dir, cb, _subdir) {
        var subdir,
            fulldir,
            children,
            i,
            childName,
            childPath,
            childFullPath,
            childStat;

        subdir = _subdir || '.';
        fulldir = libpath.join(dir, subdir);
        if (!this._libs.path.existsSync(fulldir)) {
            return;
        }

        children = this._sortedReaddirSync(fulldir);
        for (i = 0; i < children.length; i += 1) {
            childName = children[i];
            if ('.' === childName.substring(0, 1)) {
                continue;
            }
            if ('node_modules' === childName) {
                continue;
            }
            childPath = libpath.join(subdir, childName);
            childFullPath = libpath.join(dir, childPath);
            childStat = this._libs.fs.statSync(childFullPath);
            if (childStat.isFile()) {
                cb(null, subdir, childName, true);
            } else if (childStat.isDirectory()) {
                if (cb(null, subdir, childName, false)) {
                    this._walkDirRecursive(dir, cb, childPath);
                }
            }
        }
    }


};


module.exports = ServerStore;
