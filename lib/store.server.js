/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint
    anon:true, sloppy:true, regexp: true, continue: true, nomen:true, node:true, stupid:true
*/

/**
 * The ResourceStore manages information about the "resources" in a Mojito
 * application.  These resources are things that have representation on the
 * filesystem.
 *
 * You generally don't need to worry about this class (and its addons) unless
 * you are extending Mojito.
 *
 * Each resource can have many different versions.  This is not talking about
 * revisions, which is how the resource changes over time.  It is instead
 * talking about how there can be a version of the resource just for iphones,
 * one just for android, a fallback, etc.
 *
 * The metadata kept about each resource is normalized to the follow keys:
 * <dl>
 *      <dt><code>source</code> (object)</dt>
 *      <dd>where the source came from.  (not shipped to the client.)
 *          <dl>
 *              <dt><code>fs</code> (object)</dt>
 *              <dd>filesystem details</dd>
 *              <dt><code>pkg</code> (object)</dt>
 *              <dd>packaging details</dd>
 *          </dl>
 *      </dd>
 *      <dt><code>mojit</code> (string)</dt>
 *      <dd>which mojit this applies to, if any. ("shared" means the resource is available to all mojits.)</dd>
 *      <dt><code>type</code> (string)</dt>
 *      <dd>resource type</dd>
 *      <dt><code>subtype</code> (string)</dt>
 *      <dd>not all types of subtypes</dd>
 *      <dt><code>name</code> (string)</dt>
 *      <dd>common to all versions of the resource</dd>
 *      <dt><code>id</code> (string)</dt>
 *      <dd>unique ID.  common to all versions of the resource. (typically <code>{type}-{subtype}-{name}</code>.)</dd>
 *      <dt><code>yui</code> (object)</dt>
 *      <dd>for resources that are YUI modules</dd>
 *  </dl>
 *
 *  The following are only used in the metadata for each resource <em>version</em>
 *  (The metadata for resolved resources won't have these, since they're intrinsically
 *  part of the resolved resource.)
 *  <dd>
 *      <dt><code>affinity</code> (string)</dt>
 *      <dd>runtime affinity.  either <code>server</code>, <code>client</code>, or <code>common</code></dd>
 *      <dt><code>selector</code> (string)</dt>
 *      <dd>version selector</dd>
 * </dl>
 *
 * @module ResourceStore
 */
YUI.add('mojito-resource-store', function(Y, NAME) {

    var libs = {},

        isNotAlphaNum = /[^a-zA-Z0-9]/,

        mojitoRoot = __dirname,
        mojitoVersion = '0.666.666',    // special case for weird packaging situations

        CONVENTION_SUBDIR_TYPES = {
            // subdir: resource type
            'actions':  'action',
            'binders':  'binder',
            'commands': 'command',
            'middleware': 'middleware',
            'models':   'model',
            'specs':    'spec',
            'views':    'view'
        },
        CONVENTION_SUBDIR_TYPE_IS_JS = {
            'action': true,
            'binder': true,
            'model': true
        },
        // which addon subtypes are app-level
        ADDON_SUBTYPES_APPLEVEL = {
            'rs': true
        },
        DEFAULT_AFFINITIES = {
            'action': 'server',
            'addon': 'server',
            'archetype': 'server',
            'asset': 'common',
            'binder': 'common',     // need to be common so that binders meta-bubble
            'command': 'server',
            'controller': 'server',
            'middleware': 'server',
            'model': 'server',
            'spec': 'common',
            'view': 'common'
        };

    libs.fs = require('fs');
    libs.glob = require('glob');
    libs.path = require('path');
    libs.semver = require('semver');
    libs.walker = require('./package-walker.server');


    // The Affinity object is to manage the use of the affinity string in
    // filenames.  Some files have affinities that have multiple parts
    // (e.g. "server-tests").
    function Affinity(affinity) {
        var parts;
        if (affinity.indexOf('-') === -1) {
            this.affinity = affinity;
        } else {
            parts = affinity.split('-');
            this.affinity = parts[0];
            this.type = parts[1];
        }
    }
    Affinity.prototype = {
        toString: function() {
            return this.affinity;
        }
    };



    /**
     * @class ResourceStore.server
     * @constructor
     * @requires addon-rs-config, addon-rs-selector
     * @param {object} config configuration for the store
     *      @param {string} config.root directory to manage (usually the application directory)
     *      @param {object} config.context static context
     *      @param {object} config.appConfig overrides for `application.json`
     */
    function ResourceStore(config) {
        ResourceStore.superclass.constructor.apply(this, arguments);
    }
    ResourceStore.NAME = 'ResourceStore';
    ResourceStore.ATTRS = {};


    Y.extend(ResourceStore, Y.Base, {

        /**
         * This methods is part of Y.Base.  See documentation for that for details.
         * @method initializer
         * @param {object} cfg Configuration object as per Y.Base
         * @return {nothing}
         */
        initializer: function(cfg) {
            var i;

            this._config = cfg;
            this._config.context = this._config.context || {};
            this._config.appConfig = this._config.appConfig || {};
            this._config.mojitoRoot = this._config.mojitoRoot || mojitoRoot;
            this._jsonCache = {};   // fullPath: contents as JSON object
            this._ycbCache = {};    // fullPath: context: YCB config object

            this._libs = {};
            for (i in libs) {
                if (libs.hasOwnProperty(i)) {
                    this._libs[i] = libs[i];
                }
            }

            this._appRVs    = [];   // array of resource versions
            this._mojitRVs  = {};   // mojitType: array of resource versions
            this._appResources = {};    // env: posl: array of resources
            this._mojitResources = {};  // env: posl: mojitType: array of resources
            this._expandInstanceCache = {   // env: cacheKey: instance
                client: {},
                server: {}
            };

            /**
             * All selectors that are actually in the app.
             * Key is selector, value is just boolean `true`.
             * This won't be populated until `preloadResourceVersions()` is done.
             * @property selectors
             * @type Object
             */
            this.selectors = {};

            // Y.Plugin AOP doesn't allow afterHostMethod() callbacks to
            // modify the results, so we fire an event instead.
            this.publish('getMojitTypeDetails', {emitFacade: true, preventable: false});
            this.publish('mojitResourcesResolved', {emitFacade: true, preventable: false});

            // We'll start with just our "config" addon.
            this._yuiUseSync({
                'addon-rs-config': {
                    fullpath: this._libs.path.join(__dirname, 'app/addons/rs/config.server.js')
                }
            });
            this.plug(Y.mojito.addons.rs.config, { appRoot: this._config.root, mojitoRoot: this._config.mojitoRoot });

            this._validDims = this._parseValidDims(this.config.getDimensions());
            this.validateContext(this._config.context);
            this._fwConfig = this.config.readConfigJSON(this._libs.path.join(this._config.mojitoRoot, 'config.json'));
            this._appConfigStatic = this.getAppConfig({});
        },
        destructor: function() {},


        //====================================================================
        // PUBLIC METHODS


        /**
         * Validates the context, and throws an exception if it isn't.
         * @method validateContext
         * @param {object} ctx the context
         * @return {nothing} if this method returns at all then the context is valid
         */
        validateContext: function(ctx) {
            var k,
                parts,
                p,
                test,
                found;
            for (k in ctx) {
                if (ctx.hasOwnProperty(k)) {
                    if (!ctx[k]) {
                        continue;
                    }
                    if ('langs' === k) {
                        // pseudo-context variable created by our middleware
                        continue;
                    }
                    if (!this._validDims[k]) {
                        throw new Error('INVALID dimension key "' + k + '"');
                    }
                    // we need to support language fallbacks
                    if ('lang' === k) {
                        found = false;
                        parts = ctx[k].split('-');
                        for (p = parts.length; p > 0; p -= 1) {
                            test = parts.slice(0, p).join('-');
                            if (this._validDims[k][test]) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            throw new Error('INVALID dimension value "' + ctx[k] + '" for key "' + k + '"');
                        }
                        continue;
                    }
                    if (!this._validDims[k][ctx[k]]) {
                        throw new Error('INVALID dimension value "' + ctx[k] + '" for key "' + k + '"');
                    }
                }
            }
            return true;
        },


        /**
         * Returns the static (non-runtime-sensitive) context
         * @method getStaticContext
         * @return {object} the context
         */
        getStaticContext: function() {
            return Y.clone(this._config.context, true);
        },


        /**
         * Returns the static (non-runtime-sensitive) version of the application.json.
         * @method getStaticAppConfig
         * @return {object} the configuration from applications.json
         */
        getStaticAppConfig: function() {
            return Y.clone(this._appConfigStatic, true);
        },


        /**
         * Returns Mojito's built-in configuration.
         * @method getFrameworkConfig
         * @return {object} the configuration for mojito
         */
        getFrameworkConfig: function() {
            return Y.clone(this._fwConfig, true);
        },


        /**
         * Returns a contextualized application configuration.
         * @method getAppConfig
         * @param {object} ctx the context
         * @return {object} the application configuration contextualized by the "ctx" argument.
         */
        getAppConfig: function(ctx) {
            var appConfig,
                ycb;

            this.validateContext(ctx);

            if (this._appConfigStatic && (!ctx || !Object.keys(ctx).length)) {
                return Y.clone(this._appConfigStatic, true);
            }

            // start with the base
            appConfig = Y.clone(this._fwConfig.appConfigBase, true);

            // apply the read values from the file
            ycb = this.config.readConfigYCB(this._libs.path.join(this._config.root, 'application.json'), ctx);
            this.mergeRecursive(appConfig, ycb);

            // apply the passed-in overrides
            this.mergeRecursive(appConfig, Y.clone(this._config.appConfig, true));

            return appConfig;
        },


        /**
         * Preloads everything in the app, and as well pertinent parts of
         * the framework.
         *
         * @method preload
         * @return {nothing}
         */
        preload: function() {
            // We need to do an initial sweep to find the resource store addons.
            this.preloadResourceVersions();
            // And then use them.
            this.loadAddons();
            // Then, do another sweep so that the loaded addons can be used.
            this.preloadResourceVersions();
            this.resolveResourceVersions();
        },


        /**
         * Returns a list of resource versions that match the filter.
         * (To get the list of resource versions from all mojits, you'll need
         * to call `listAllMojits()` and iterate over that list, calling this
         * method with `mojit:` in the filter.)
         *
         * @method getResourceVersions
         * @param {object} filter limit returned resource versions to only those whose keys/values match the filter
         * @return {array of objects} list of matching resource versions
         */
        getResourceVersions: function(filter) {
            var source,
                out = [],
                r,
                res,
                k,
                use;

            source = filter.mojit ? this._mojitRVs[filter.mojit] : this._appRVs;
            if (!source) {
                return [];
            }
            for (r = 0; r < source.length; r += 1) {
                res = source[r];
                use = true;
                for (k in filter) {
                    if (filter.hasOwnProperty(k)) {
                        if (res[k] !== filter[k]) {
                            use = false;
                            break;
                        }
                    }
                }
                if (use) {
                    out.push(res);
                }
            }
            return out;
        },


        /**
         * Returns a list of resources that match the filter.
         * (To get the list of resources from all mojits, you'll need to call
         * `listAllMojits()` and iterate over that list, calling this method
         * with `mojit:` in the filter.)
         *
         * @method getResources
         * @param {string} env the runtime environment (either `client` or `server`)
         * @param {object} ctx the context
         * @param {object} filter limit returned resources to only those whose keys/values match the filter
         * @return {array of objects} list of matching resources
         */
        getResources: function(env, ctx, filter) {
            var posl,
                source,
                out = [],
                r,
                res,
                k,
                use;

            this.validateContext(ctx);

            posl = Y.JSON.stringify(this.selector.getPOSLFromContext(ctx));
            if (filter.mojit) {
                if (!this._mojitResources[env] ||
                        !this._mojitResources[env][posl] ||
                        !this._mojitResources[env][posl][filter.mojit]) {
                    return [];
                }
                source = this._mojitResources[env][posl][filter.mojit];
            } else {
                if (!this._appResources[env] ||
                        !this._appResources[env][posl]) {
                    return [];
                }
                source = this._appResources[env][posl];
            }
            // this is taken care of already, and will trip up mojit-level
            // resources that are actually shared
            delete filter.mojit;
            for (r = 0; r < source.length; r += 1) {
                res = source[r];
                use = true;
                for (k in filter) {
                    if (filter.hasOwnProperty(k)) {
                        if (res[k] !== filter[k]) {
                            use = false;
                            break;
                        }
                    }
                }
                if (use) {
                    out.push(res);
                }
            }
            return out;
        },


        /**
         * Returns a list of all mojits in the app, except for the "shared" mojit.
         * @method listAllMojits
         * @return {array} list of mojits
         */
        listAllMojits: function() {
            var mojitType,
                list = [];
            for (mojitType in this._mojitRVs) {
                if (this._mojitRVs.hasOwnProperty(mojitType)) {
                    if ('shared' !== mojitType) {
                        list.push(mojitType);
                    }
                }
            }
            return list;
        },


        /**
         * Returns, via callback, the fully expanded mojit instance specification.
         *
         * @async
         * @method getSpec
         * @param {string} env the runtime environment (either `client` or `server`)
         * @param {string} id the ID of the spec to return
         * @param {object} ctx the runtime context for the spec
         * @param {function(err,spec)} callback callback used to return the results (or error)
         */
        getSpec: function(env, id, ctx, callback) {
            this.expandInstanceForEnv(env, {base: id}, ctx, function(err, obj) {
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
         * @async
         * @method getType
         * @param {string} env the runtime environment (either `client` or `server`)
         * @param {string} type the mojit type
         * @param {object} ctx the runtime context for the type
         * @param {function(err,spec)} callback callback used to return the results (or error)
         */
        getType: function(env, type, ctx, callback) {
            this.expandInstanceForEnv(env, {type: type}, ctx, function(err, obj) {
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
         * This just calls `expandInstanceForEnv()` with `env` set to `server`.
         *
         * @async
         * @method expandInstance
         * @param {map} instance partial instance to expand
         * @param {object} ctx the context
         * @param {function(err,instance)} cb callback used to return the results (or error)
         */
        expandInstance: function(instance, ctx, cb) {
            this.expandInstanceForEnv('server', instance, ctx, cb);
            return;
        },


        /**
         * Expands the instance into all details necessary to dispatch the mojit.
         * @method expandInstanceForEnv
         * @param {string} env the runtime environment (either `client` or `server`)
         * @param {object} instance
         * @param {object} ctx the context
         * @param {function(err,instance)} cb callback used to return the results (or error)
         */
        expandInstanceForEnv: function(env, instance, ctx, cb) {
            var cacheKey = Y.JSON.stringify(instance) + Y.JSON.stringify(ctx),
                cacheValue = this._expandInstanceCache[env][cacheKey],
                spec,
                typeDetails,
                config;

            this.validateContext(ctx);

            if (cacheValue) {
                cb(null, Y.clone(cacheValue, true));
                return;
            }

            // TODO:  should this be done here, or somewhere else?
            ctx.runtime = env;

            try {
                spec = this._expandSpec(env, ctx, instance);
            } catch (err) {
                return cb(err);
            }
            spec.config = spec.config || {};
            spec.action = spec.action || 'index';
            if (!spec.instanceId) {
                spec.instanceId = Y.guid();
            }

            spec.appConfig = this.getAppConfig(ctx);
            delete spec.appConfig.specs;

            try {
                this.getMojitTypeDetails(env, ctx, spec.type, spec);
            } catch (err2) {
                return cb(err2);
            }
            if (spec.defaults && spec.defaults.config) {
                config = Y.clone(spec.defaults.config, true);
                this.mergeRecursive(config, spec.config);
                spec.config = config;
            }

            this._expandInstanceCache[env][cacheKey] = Y.clone(spec, true);
            cb(null, spec);
        },


        /**
         * Returns details about a mojit type.
         *
         * As the last step of execution, this fires the `getMojitTypeDetails`
         * event so that Resource Store addons can augment the returned structure.
         *
         * @method getMojitTypeDetails
         * @param {string} env the runtime environment (either `client` or `server`)
         * @param {object} ctx the context
         * @param {string} mojitType mojit type
         * @param {object} dest object in which to place the results
         * @return {object} returns the "dest" parameter, which has had details added to it
         */
        /**
         * Fired at the end of the `getMojitTypeDetails()` method to allow
         * modification of the results.
         * @event getMojitTypeDetails
         * @param {object} args input arguments
         *      @param {string} args.env the runtime environment (either `client` or `server`)
         *      @param {object} args.ctx runtime context
         *      @param {array} args.posl priority-ordered seletor list
         *      @param {string} args.mojitType name of mojit
         * @param {object} mojit the mojit type details
         */
        getMojitTypeDetails: function(env, ctx, mojitType, dest) {
            //Y.log('getMojitTypeDetails('+env+', '+JSON.stringify(ctx)+', '+mojitType+')', 'debug', NAME);
            var ress,
                r,
                res,
                engine,
                engines = {},   // view engines
                posl = this.selector.getPOSLFromContext(ctx),
                ctxKey,
                module;

            this.validateContext(ctx);

            if ('shared' === mojitType) {
                throw new Error('Mojit name "shared" is special and isn\'t a real mojit.');
            }

            if (!dest) {
                dest = {};
            }

            if (!dest.assets) {
                dest.assets = {};
            }
            if (!dest.models) {
                dest.models = {};
            }
            if (!dest.views) {
                dest.views = {};
            }

            dest.definition = {};
            dest.defaults = {};

            ress = this.getResources(env, ctx, { mojit: mojitType });
            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];

                if (res.type === 'config') {
                    if ('definition' === res.source.fs.basename) {
                        dest.definition = this.config.readConfigYCB(res.source.fs.fullPath, ctx);
                    }
                    if ('defaults' === res.source.fs.basename) {
                        dest.defaults = this.config.readConfigYCB(res.source.fs.fullPath, ctx);
                    }
                }

                if (res.type === 'asset') {
                    if (env === 'client') {
                        dest.assets[res.name + res.source.fs.ext] = res.url;
                    } else {
                        dest.assets[res.name + res.source.fs.ext] = res.source.fs.fullPath;
                    }
                }

                if (res.type === 'binder') {
                    if (!dest.views[res.name]) {
                        dest.views[res.name] = {};
                    }
                    dest.views[res.name]['binder-url'] = res.url;
                    if (env === 'client') {
                        dest.views[res.name]['binder-path'] = res.url;
                    } else {
                        dest.views[res.name]['binder-path'] = res.source.fs.fullPath;
                    }
                }

                if (res.type === 'controller') {
                    // We need the YUI Module name of the contoller so we can
                    // select a language for it
                    if (env === 'client') {
                        dest['controller-path'] = res.url;
                    } else {
                        dest['controller-path'] = res.source.fs.fullPath;
                    }
                }

                if (res.type === 'model') {
                    dest.models[res.name] = true;
                }

                if (res.type === 'view') {
                    if (!dest.views[res.name]) {
                        dest.views[res.name] = {};
                    }
                    if (env === 'client') {
                        dest.views[res.name]['content-path'] = res.url;
                    } else {
                        dest.views[res.name]['content-path'] = res.source.fs.fullPath;
                    }
                    dest.views[res.name].engine = res.view.engine;
                    engines[res.view.engine] = true;
                }
            }

            // YUI AOP doesn't give plugins enough control, so use
            // onHostMethod() and afterHostMethod().
            this.fire('getMojitTypeDetails', {
                args: {
                    env: env,
                    ctx: ctx,
                    posl: posl,
                    mojitType: mojitType
                },
                mojit: dest
            });
            return dest;
        },


        /**
         * Returns the routes configured in the application.
         * @method getRoutes
         * @param {object} ctx the context
         * @return {object} routes
         */
        getRoutes: function(ctx) {
            var appConfig = this.getAppConfig(ctx),
                routesFiles = appConfig.routesFiles,
                p,
                path,
                fixedPaths = {},
                out = {},
                ress,
                r,
                res,
                routes;

            for (p = 0; p < routesFiles.length; p += 1) {
                path = routesFiles[p];
                // relative paths are relative to the application
                if ('/' !== path.charAt(1)) {
                    path = this._libs.path.join(this._config.root, path);
                }
                fixedPaths[path] = true;
            }

            ress = this.getResources('server', ctx, {type: 'config'});
            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                if (fixedPaths[res.source.fs.fullPath]) {
                    routes = Y.clone(this.config.readConfigYCB(res.source.fs.fullPath, ctx), true);
                    out = Y.merge(out, routes);
                }
            }

            if (!Object.keys(out).length) {
                return this._fwConfig.defaultRoutes;
            }
            return out;
        },


        /**
         * Sugar method that returns all "url" metadata of all resources.
         * @method getAllURLs
         * @return {object} for all resources with a "url" metadatum, the key is
         *      that URL and the value the filesystem path
         */
        getAllURLs: function() {
            var r,
                res,
                ress,
                m,
                mojit,
                mojits,
                urls = {};
            mojits = this.listAllMojits();
            mojits.push('shared');
            for (m = 0; m < mojits.length; m += 1) {
                mojit = mojits[m];
                ress = this.getResourceVersions({mojit: mojit});
                for (r = 0; r < ress.length; r += 1) {
                    res = ress[r];
                    if (res.url) {
                        urls[res.url] = res.source.fs.rollupPath || res.source.fs.fullPath;
                    }
                }
            }
            return urls;
        },


        /**
         * Recursively merge one object onto another.
         * [original implementation](http://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically/383245#383245)
         *
         * @method mergeRecursive
         * @param {object} dest object to merge into
         * @param {object} src object to merge onto "dest"
         * @param {boolean} typeMatch controls whether a non-object in the src is
         *          allowed to clobber a non-object in the dest (if a different type)
         * @return {object} the modified "dest" object is also returned directly
         */
        mergeRecursive: function(dest, src, typeMatch) {
            var p;
            for (p in src) {
                if (src.hasOwnProperty(p)) {
                    // Property in destination object set; update its value.
                    if (src[p] && src[p].constructor === Object) {
                        if (!dest[p]) {
                            dest[p] = {};
                        }
                        dest[p] = this.mergeRecursive(dest[p], src[p]);
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


        //====================================================================
        // CALLBACK METHODS
        // These are called at various points in the algorithm of public
        // methods.  They are public so that they can be hooked into via AOP.


        /**
         * Augments this resource store with addons that we know about.
         * To find the addons, call `preloadResourceVersions()` first.
         *
         * You most often don't want to call this directly, but instead to hook
         * into it using the AOP mechanism of `Y.Plugin.Base`:
         *
         *     this.afterHostMethod('loadAddons', this._myLoadAddons, this);
         *
         * @method loadAddons
         * @return {nothing}
         */
        loadAddons: function() {
            var modules = {},
                ress,
                r,
                res;

            Y.Object.each(Y.mojito.addons.rs, function(fn, name) {
                this.unplug(name);
            }, this);

            ress = this.getResourceVersions({type: 'addon', subtype: 'rs'});
            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                if ('rs' === res.subtype) {
                    // FUTURE:  ideally we shouldn't proscribe the YUI module name of RS addons
                    // (We can/should introspect the file for the YUI module name.)
                    modules['addon-rs-' + res.name] = {
                        fullpath: res.source.fs.fullPath
                    };
                }
            }
            this._yuiUseSync(modules);

            Y.Object.each(Y.mojito.addons.rs, function(fn, name) {
                this.plug(fn, { appRoot: this._config.root, mojitoRoot: this._config.mojitoRoot });
            }, this);
        },


        /**
         * Preload metadata about all resource versions in the application
         * (and Mojito framework).
         *
         * You most often don't want to call this directly, but instead to hook
         * into it using the AOP mechanism of `Y.Plugin.Base`:
         *
         *     this.afterHostMethod('preloadResourceVersions', this._myPreloadResourceVersions, this);
         *
         * @method preloadResourceVersions
         * @return {nothing}
         */
        preloadResourceVersions: function() {
            var me = this,
                walker,
                walkedMojito = false,
                dir,
                info;

            this.selectors = {};
            this._appRVs = [];
            this._mojitRVs = {};

            walker = new this._libs.walker.BreadthFirst(this._config.root);
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
            // FUTURE:  instead walk -all- global packages?
            if (!walkedMojito) {
                dir = this._libs.path.join(this._config.mojitoRoot, '..');
                info = {
                    depth: 999,
                    parents: [],
                    dir: dir
                };
                info.pkg = this.config.readConfigJSON(this._libs.path.join(dir, 'package.json'));

                if (Object.keys(info.pkg).length) {
                    mojitoVersion = info.pkg.version;
                } else {
                    // special case for weird packaging situations
                    info.dir = this._config.mojitoRoot;
                    info.pkg = {
                        name: 'mojito',
                        version: mojitoVersion,
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
         * Called by the ResourceStore to decide if a file should be considered
         * a resource.  You most often don't want to call this directly, but
         * instead to hook into it using the AOP mechanism of `Y.Plugin.Base`:
         *
         *     this.afterHostMethod('findResourceVersionByConvention', this._myFindResourceByConvention, this);
         *
         * Generally `findResourceVersionByConvention()` and `parseResourceVersion()` are meant to work together.
         * This method figures out the type (and subtype) of a file, and `parseResourceVersion()` turns
         * the file into an actual resource.
         *
         * @method findResourceVersionByConvention
         * @param {object} source the same as the `source` part of a resource
         * @param {string} mojitType the name of the mojit
         * @return {boolean|object} If the source is a directory, a boolean can be returned.
         *      True indicates that the directory contents should be scanned, while false
         *      indicates that the directory should be skipped.
         *      If the source does represent a resource, then an object with the following
         *      fields should be returned:
         *      type {string} type of the resource,
         *      subtype {string} optional subtype of the resource,
         *      skipSubdirParts {integer} number of path parts of `source.fs.subDir` to skip
         */
        findResourceVersionByConvention: function(source, mojitType) {
            var fs = source.fs,
                baseParts = fs.basename.split('.'),
                type;

            if (!fs.isFile && '.' === fs.subDir && CONVENTION_SUBDIR_TYPES[fs.basename]) {
                return true;
            }
            type = CONVENTION_SUBDIR_TYPES[fs.subDirArray[0]];
            if (!fs.isFile && type) {
                return true;
            }
            if (fs.isFile && type && fs.subDirArray.length >= 1) {
                if (CONVENTION_SUBDIR_TYPE_IS_JS[type] && '.js' !== fs.ext) {
                    return false;
                }
                if ('spec' === type && '.json' !== fs.ext) {
                    return false;
                }
                return {
                    type: type,
                    skipSubdirParts: 1
                };
            }

            // special case:  addons
            if (!fs.isFile && '.' === fs.subDir && 'addons' === fs.basename) {
                return true;
            }
            if (!fs.isFile && fs.subDirArray.length < 2 && 'addons' === fs.subDirArray[0]) {
                return true;
            }
            if (fs.isFile && fs.subDirArray.length >= 1 && 'addons' === fs.subDirArray[0]) {
                if ('.js' !== fs.ext) {
                    return false;
                }
                return {
                    type: 'addon',
                    subtype: fs.subDirArray[1],
                    skipSubdirParts: 2
                };
            }

            // special case:  archetypes
            if (!fs.isFile && '.' === fs.subDir && 'archetypes' === fs.basename) {
                return true;
            }
            if (!fs.isFile && fs.subDirArray.length < 2 && 'archetypes' === fs.subDirArray[0]) {
                return true;
            }
            if (!fs.isFile && fs.subDirArray.length === 2 && 'archetypes' === fs.subDirArray[0]) {
                return {
                    type: 'archetype',
                    subtype: fs.subDirArray[1],
                    skipSubdirParts: 2
                };
            }

            // special case:  assets
            if (!fs.isFile && '.' === fs.subDir && 'assets' === fs.basename) {
                return true;
            }
            if (!fs.isFile && 'assets' === fs.subDirArray[0]) {
                return true;
            }
            if (fs.isFile && 'assets' === fs.subDirArray[0] && fs.subDirArray.length >= 1) {
                return {
                    type: 'asset',
                    subtype: fs.ext.substr(1),
                    skipSubdirParts: 1
                };
            }

            // special case:  controller
            if (fs.isFile && '.' === fs.subDir && 'controller' === baseParts[0]) {
                if ('.js' !== fs.ext) {
                    return false;
                }
                return {
                    type: 'controller'
                };
            }

            // special case:  mojit
            if (!fs.isFile && '.' === fs.subDir && 'mojits' === fs.basename) {
                // don't bother finding mojits here, since they're loaded explicitly in
                // the app and bundle in different ways
                return false;
            }

            // unknown path
            return true;
        },


        /**
         * Called by the ResourceStore to turn a file into a resource.
         * You most often don't want to call this directly, but instead to hook
         * into it using the AOP mechanism of `Y.Plugin.Base`:
         *
         *     this.beforeHostMethod('parseResourceVersion', this._myParseResource, this);
         *
         * Generally `findResourceVersionByConvention()` and `parseResourceVersion()` are meant to work together.
         * `findResourceVersionByConvention()` figures out the type (and subtype) of a file, and 
         * this method turns the file into an actual resource.
         *
         * @method parseResourceVersion
         * @param {object} source the same as the `source` part of a resource
         * @param {string} type the resource type of the file
         * @param {string} subtype the optional resource subtype of the file
         * @param {string} mojitType the name of the mojit
         * @return {object|undefined} the resource version
         */
        parseResourceVersion: function(source, type, subtype, mojitType) {
            var fs = source.fs,
                baseParts = fs.basename.split('.'),
                res;

            // app-level resources
            if ('archetype' === type || 'command' === type || 'middleware' === type) {
                if ('mojit' === fs.rootType) {
                    Y.log(type + ' cannot be defined in a mojit. skipping ' + fs.fullPath, 'warn', NAME);
                    return;
                }
                res = {
                    source: source,
                    mojit: null,
                    type: type,
                    subtype: subtype,
                    name: fs.basename,
                    affinity: DEFAULT_AFFINITIES[type],
                    selector: '*'
                };
                res.id = [res.type, res.subtype, res.name].join('-');
                return res;
            }

            // mojit parts with format {name}.{affinity}.{selector}
            if ('action' === type ||
                    'addon' === type ||
                    'controller' === type ||
                    'model' === type) {
                res = {
                    source: source,
                    mojit: mojitType,
                    type: type,
                    subtype: subtype,
                    affinity: DEFAULT_AFFINITIES[type],
                    selector: '*'
                };
                if (baseParts.length >= 3) {
                    res.selector = baseParts.pop();
                }
                if (baseParts.length >= 2) {
                    res.affinity = baseParts.pop();
                }
                if (baseParts.length !== 1) {
                    Y.log('invalid ' + type + ' filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return;
                }
                res.name = this._libs.path.join(fs.subDirArray.join('/'), baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                // special case
                if ('addon' === type && ADDON_SUBTYPES_APPLEVEL[res.subtype]) {
                    res.mojit = null;
                }
                return res;
            }

            // mojit parts with format {name}.{selector}
            if ('asset' === type || 'binder' === type) {
                res = {
                    source: source,
                    mojit: mojitType,
                    type: type,
                    subtype: subtype,
                    affinity: DEFAULT_AFFINITIES[type],
                    selector: '*'
                };
                if (baseParts.length >= 2) {
                    res.selector = baseParts.pop();
                }
                if (baseParts.length !== 1) {
                    Y.log('invalid ' + type + ' filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return;
                }
                res.name = this._libs.path.join(fs.subDirArray.join('/'), baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                return res;
            }

            // special case:  spec
            if ('spec' === type) {
                res = {
                    source: source,
                    mojit: mojitType,
                    type: 'spec',
                    affinity: DEFAULT_AFFINITIES[type],
                    selector: '*'
                };
                if (baseParts.length !== 1) {
                    Y.log('invalid spec filename. skipping ' + source.fs.fullPath, 'warn', NAME);
                    return;
                }
                res.name = this._libs.path.join(source.fs.subDir, baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                return res;
            }

            // special case:  view
            if ('view' === type) {
                res = {
                    source: source,
                    mojit: mojitType,
                    type: type,
                    subtype: subtype,
                    view: {
                        outputFormat: fs.ext.substr(1),
                        engine: baseParts.pop()
                    },
                    affinity: DEFAULT_AFFINITIES[type],
                    selector: '*'
                };
                if (baseParts.length >= 2) {
                    res.selector = baseParts.pop();
                }
                if (baseParts.length !== 1) {
                    Y.log('invalid view filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return;
                }
                res.name = this._libs.path.join(fs.subDirArray.join('/'), baseParts.join('.'));
                res.id = [res.type, res.subtype, res.name].join('-');
                return res;
            }

            // just ignore unknown types
            return;
        },


        /**
         * Called by the ResourceStore to register a resource version.
         * You most often don't want to call this directly, but instead to hook
         * into it using the AOP mechanism of `Y.Plugin.Base`:
         *
         *     this.beforeHostMethod('parseResourceVersion', this._myParseResource, this);
         *
         * @method addResourceVersion
         * @param {object} res the resource version
         * @return {nothing}
         */
        addResourceVersion: function(res) {
            res.affinity = new Affinity(res.affinity);

            if (this._appConfigStatic.deferAllOptionalAutoloads &&
                    'optional' === res.affinity.type) {
                return;
            }

            if (res.selector) {
                this.selectors[res.selector] = true;
            }
            if (res.mojit) {
                if (!this._mojitRVs[res.mojit]) {
                    this._mojitRVs[res.mojit] = [];
                }
                this._mojitRVs[res.mojit].push(res);
            } else {
                this._appRVs.push(res);
            }
        },


        /**
         * For each possible runtime configuration (based on context), pre-calculates
         * which versions of the resources will be used.
         * The priority (highest to lowest):
         *      source,
         *      selector,
         *      affinity (env or "common").
         *
         * @method resolveResourceVersions
         * @return {nothing}
         */
        /**
            * Fired after the resources for a mojit have been resolved.
            * @event mojitResourcesResolved
            * @param {string} env the runtime environment (either `client` or `server`)
            * @param {array} posl priority-ordered seletor list
            * @param {string} mojit name of the mojit
            * @param {array} ress list of resources in the mojit (for the `env` and `posl`)
            */
        resolveResourceVersions: function() {
            var p, poslKey, posl, posls = {},
                e, env, envs = [ 'client', 'server' ],
                affinities, selectors, sourceBase,
                type, ress,
                s;

            posls = this.selector.getAllPOSLs();

            for (e = 0; e < envs.length; e += 1) {
                env = envs[e];

                affinities = {};    // affinity: priority modifier
                affinities[env] = 1;
                affinities.common = 0;

                for (p = 0; p < posls.length; p += 1) {
                    posl = posls[p];
                    poslKey = Y.JSON.stringify(posl);
                    selectors = {}; // selector:  priority modifier
                    for (s = 0; s < posl.length; s += 1) {
                        selectors[posl[s]] = (posl.length - s - 1) * 2;
                    }
                    sourceBase = posl.length * 2;
                    //console.log('-- source base ' + sourceBase);
                    //console.log(selectors);
                    //console.log(affinities);

                    if (!this._appResources[env]) {
                        this._appResources[env] = {};
                    }
                    this._appResources[env][poslKey] =
                        this._resolveVersions(affinities, selectors, sourceBase, [ this._appRVs ]);

                    if (!this._mojitResources[env]) {
                        this._mojitResources[env] = {};
                    }
                    if (!this._mojitResources[env][poslKey]) {
                        this._mojitResources[env][poslKey] = {};
                    }
                    for (type in this._mojitRVs) {
                        if (this._mojitRVs.hasOwnProperty(type)) {
                            ress = this._resolveVersions(affinities, selectors, sourceBase, [ this._mojitRVs.shared, this._mojitRVs[type] ]);
                            this._mojitResources[env][poslKey][type] = ress;
                            this.fire('mojitResourcesResolved', {
                                env: env,
                                posl: posl,
                                mojit: type,
                                ress: ress
                            });
                        }
                    }
                }
            }
        },


        /**
         * Returns a serializable object used to initialized Mojito on the client.
         *
         * FUTURE:  [issue 105] cache the output of this function
         * cache key:  all of ctx
         *
         * @method serializeClientStore
         * @param {object} ctx the context
         * @return {object} object that should be serialized and used to initialize MojitoClient
         */
        serializeClientStore: function(ctx) {
            var out = {};
            out.specs = {};
            out.mojits = {};

            out.appConfig = this.getAppConfig(ctx);
            delete out.appConfig.mojitsDirs;
            delete out.appConfig.mojitDirs;
            delete out.appConfig.routesFiles;
            delete out.appConfig.specs;

            out.routes = this.getRoutes(ctx);

            return out;
        },


        //====================================================================
        // PRIVATE METHODS


        /**
         * Used for unit testing.
         * @private
         * @method _mockLib
         * @param {string} name name of library to mock out
         * @param {situation-dependent} lib library to mock out
         * @return {nothing}
         */
        _mockLib: function(name, lib) {
            this._libs[name] = lib;
        },


        /**
         * @private
         * @method @parseValidDims
         * @param {object} dims contents of dimensions.json
         * @return {object} lookup hash for dimension keys and values
         */
        _parseValidDims: function(dims) {
            var d,
                dim,
                dimName,
                out = {};
            function grabKeys(dimName, o) {
                var k;
                for (k in o) {
                    if (o.hasOwnProperty(k)) {
                        out[dimName][k] = true;
                        if (Y.Lang.isObject(o[k])) {
                            grabKeys(dimName, o[k]);
                        }
                    }
                }
            }
            for (d = 0; d < dims[0].dimensions.length; d += 1) {
                dim = dims[0].dimensions[d];
                for (dimName in dim) {
                    if (dim.hasOwnProperty(dimName)) {
                        out[dimName] = {};
                        grabKeys(dimName, dim[dimName]);
                    }
                }
            }
            return out;
        },


        /**
         * Applies spec inheritance by following the `base` and merging up the
         * results.
         * @private
         * @method _expandSpec
         * @param {string} env the runtime environment (either `client` or `server`)
         * @param {object} ctx runtime context
         * @param {object} spec spec to expand
         * @return {object} expanded sped
         */
        // FUTURE:  expose this to RS addons?
        _expandSpec: function(env, ctx, spec) {
            var appConfig,
                base,
                specParts,
                mojitName,
                specName,
                ress;

            if (!spec.base) {
                return spec;
            }

            // The base will need to carry its ID with it.
            spec.id = spec.base;
            appConfig = this.getAppConfig(ctx);
            base = appConfig.specs[spec.base];

            if (!base) {
                // look in resources
                specParts = spec.base.split(':');
                mojitName = specParts.shift();
                specName = specParts.join(':') || 'default';
                ress = this.getResources(env, ctx, {type: 'spec', mojit: mojitName, name: specName});
                if (1 === ress.length) {
                    base = this.config.readConfigYCB(ress[0].source.fs.fullPath, ctx);
                }
            }
            if (!base) {
                throw new Error('Unknown base of "' + spec.base + '"');
            }

            delete spec.base;
            return this.mergeRecursive(this._expandSpec(env, ctx, base), spec);
        },


        /**
         * preloads metadata about resources in a package
         * (but not subpackages in its `node_modules/`)
         *
         * @private
         * @method _preloadPackage
         * @param {object} info metadata about the package
         * @return {nothing}
         */
        _preloadPackage: function(info) {
            var dir,
                pkg;
            // FUTURE:  use info.inherit to scope mojit dependencies
            /*
            console.log('--PACKAGE-- ' + info.depth + ' ' + info.pkg.name + '@' + info.pkg.version
                    + ' \t' + (info.pkg.yahoo && info.pkg.yahoo.mojito && info.pkg.yahoo.mojito.type)
                    + ' \t[' + info.parents.join(',') + ']'
            //      + ' \t-- ' + Y.JSON.stringify(info.inherit)
            );
            */
            pkg = {
                name: info.pkg.name,
                version: info.pkg.version,
                depth: info.depth
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
                dir = this._libs.path.join(info.dir, info.pkg.yahoo.mojito.location);
                this._preloadDirBundle(dir, pkg);
                break;
            case 'mojit':
                dir = this._libs.path.join(info.dir, info.pkg.yahoo.mojito.location);
                this._preloadDirMojit(dir, 'pkg', pkg);
                break;
            default:
                Y.log('Unknown package type "' + info.pkg.yahoo.mojito.type + '"', 'warn', NAME);
                break;
            }
        },


        /**
         * preloads metadata about resources in the application directory
         * (but not `node_modules/`)
         *
         * @private
         * @method _preloadApp
         * @param {object} pkg metadata (name and version) about the app's package
         * @return {nothing}
         */
        _preloadApp: function(pkg) {
            var ress,
                r,
                res,
                list,
                i;

            ress = this._findResourcesByConvention(this._config.root, 'app', pkg, 'shared');
            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                if ('mojit' !== res.type) {
                    // ignore app-level mojits found by convention, since they'll be loaded below
                    this.addResourceVersion(ress[r]);
                }
            }

            // load mojitsDirs
            list = this._globList(this._config.root, this._appConfigStatic.mojitsDirs);
            for (i = 0; i < list.length; i += 1) {
                this._preloadDirMojits(list[i], 'app', pkg);
            }

            // load mojitDirs
            list = this._globList(this._config.root, this._appConfigStatic.mojitDirs || []);
            for (i = 0; i < list.length; i += 1) {
                this._preloadDirMojit(list[i], 'app', pkg);
            }
        },


        /**
         * preloads metadata about resources in a directory
         *
         * @private
         * @method _preloadDirBundle
         * @param {string} dir directory path
         * @param {object} pkg metadata (name and version) about the package
         * @return {nothing}
         */
        _preloadDirBundle: function(dir, pkg) {
            var ress,
                r,
                res;
            // FUTURE:  support configuration too

            ress = this._findResourcesByConvention(dir, 'bundle', pkg, 'shared');
            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                this.addResourceVersion(res);
            }
            this._preloadDirMojits(this._libs.path.join(dir, 'mojits'), 'bundle', pkg);
        },


        /**
         * preloads a directory containing many mojits
         *
         * @private
         * @method _preloadDirMojits
         * @param {string} dir directory path
         * @param {string} dirType type represented by the "dir" argument.  values are "app", "bundle", "pkg", or "mojit"
         * @param {object} pkg metadata (name and version) about the package
         * @return {nothing}
         */
        _preloadDirMojits: function(dir, dirType, pkg) {
            var i,
                realDirs,
                children,
                childName,
                childPath;

            if ('/' !== dir.charAt(0)) {
                dir = this._libs.path.join(this._config.root, dir);
            }

            if (!(this._libs.fs.existsSync || this._libs.path.existsSync)(dir)) {
                return;
            }

            children = this._sortedReaddirSync(dir);
            for (i = 0; i < children.length; i += 1) {
                childName = children[i];
                if ('.' === childName.substring(0, 1)) {
                    continue;
                }
                childPath = this._libs.path.join(dir, childName);
                this._preloadDirMojit(childPath, dirType, pkg);
            }
        },


        /**
         * preloads a directory that represents a single mojit
         *
         * @private
         * @method _preloadDirMojit
         * @param {string} dir directory path
         * @param {string} dirType type represented by the "dir" argument.  values are "app", "bundle", "pkg", or "mojit"
         * @param {object} pkg metadata (name and version) about the package
         * @return {nothing}
         */
        _preloadDirMojit: function(dir, dirType, pkg) {
            var mojitType,
                packageJson,
                definitionJson,
                ress,
                r,
                res;

            if ('/' !== dir.charAt(0)) {
                dir = this._libs.path.join(this._config.root, dir);
            }

            if (!(this._libs.fs.existsSync || this._libs.path.existsSync)(dir)) {
                return;
            }

            if ('pkg' === dirType) {
                mojitType = pkg.name;
            } else {
                mojitType = this._libs.path.basename(dir);
            }
            packageJson = this.config.readConfigJSON(this._libs.path.join(dir, 'package.json'));
            if (packageJson) {
                if (packageJson.name) {
                    mojitType = packageJson.name;
                }

                if (packageJson.engines && packageJson.engines.mojito) {
                    if (!this._libs.semver.satisfies(mojitoVersion, packageJson.engines.mojito)) {
                        Y.log('skipping mojit because of version check ' + dir, 'warn', NAME);
                        return;
                    }
                }

                // TODO:  register mojit's package.json as a static asset, in "static handler" plugin
            }

            definitionJson = this.config.readConfigYCB(this._libs.path.join(dir, 'definition.json'), {});
            if (definitionJson.appLevel) {
                mojitType = 'shared';
            }

            // the mojit itself is registered as an app-level resource
            res = {
                source: {
                    fs: {
                        fullPath: dir,
                        rootDir: dir,
                        rootType: dirType,
                        subDir: '.',
                        subDirArray: ['.'],
                        basename: this._libs.path.basename(dir),
                        isFile: false,
                        ext: null
                    },
                    pkg: pkg
                },
                type: 'mojit',
                name: mojitType,
                id: 'mojit--' + mojitType,
                affinity: 'common',
                selector: '*'
            };
            this.addResourceVersion(res);

            ress = this._findResourcesByConvention(dir, 'mojit', pkg, mojitType);
            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                // just in case, only add those resources that really do belong to us
                if (res.mojit === mojitType) {
                    this.addResourceVersion(res);
                }
                // FUTURE:  else warn?
            }
        },


        /**
         * Resolves versions for a list of resources.
         * The priority is based on passed-in configuration.
         * See `resolveResourceVersions()` for details.
         *
         * @private
         * @method _resolveVersions
         * @param {object} affinities lookup hash for priority adjustment for each affinity
         * @param {object} selectors lookup hash for priority adjustment for each selector
         * @param {int} sourceBase multiplier for order in source list
         * @param {array of arrays} srcs resource versions to resolve
         * @return {array} list of resolved resources
         */
        _resolveVersions: function(affinities, selectors, sourceBase, srcs) {
            var s, src,
                r, res,
                priority,
                versions = {},  // id: priority: resource
                out = [],
                resid,
                highest,
                chosen;

            for (s = 0; s < srcs.length; s += 1) {
                src = srcs[s];
                for (r = 0; r < src.length; r += 1) {
                    res = src[r];
                    if (!selectors.hasOwnProperty(res.selector)) {
                        continue;
                    }
                    if (!affinities.hasOwnProperty(res.affinity)) {
                        continue;
                    }
                    priority = (s * sourceBase) +
                        selectors[res.selector] + affinities[res.affinity];
                    //console.log('--DEBUG-- pri=' + priority + ' --'
                    //            + ' src' + s + '=' + (s * sourceBase)
                    //            + ' ' + res.selector + '=' + selectors[res.selector]
                    //            + ' ' + res.affinity + '=' + affinities[res.affinity]
                    //            + ' -- ' + res.id);
                    if (!versions[res.id]) {
                        versions[res.id] = {};
                    }
                    if (!versions[res.id][priority]) {
                        versions[res.id][priority] = res;
                    }
                }
            }
            for (resid in versions) {
                if (versions.hasOwnProperty(resid)) {
                    highest = Math.max.apply(Math, Object.keys(versions[resid]));
                    //console.log('--DEBUG-- highest=' + highest + ' -- ' + resid);
                    chosen = Y.clone(versions[resid][highest], true);
                    out.push(chosen);
                }
            }
            return out;
        },


        /**
         * Finds resources based on our conventions.
         * -Doesn't- load mojits or their contents.  That's done elsewhere.
         *
         * @private
         * @method _findResourcesByConvention
         * @param {string} dir directory from which to find resources
         * @param {string} dirType type represented by the "dir" argument.  values are "app", "bundle", "pkg", or "mojit"
         * @param {object} pkg metadata (name and version) about the package
         * @param {string|null} mojitType name of mojit to which the resource belongs
         * @return {array} list of resources
         */
        _findResourcesByConvention: function(dir, dirType, pkg, mojitType) {
            var me = this,
                ress = [];
            //console.log('-- FIND RESOURCES BY CONVENTION -- ' + pkg.name + '@' + pkg.version + ' -- ' + mojitType);

            this._walkDirRecursive(dir, function(error, subdir, file, isFile) {
                var source, ret, res;

                if ('node_modules' === file) {
                    return false;
                }
                if ('libs' === file && 'test' !== me._appConfigStatic.env) {
                    return false;
                }
                if ('tests' === file && 'test' !== me._appConfigStatic.env) {
                    return false;
                }

                source = {
                    fs: {
                        fullPath: me._libs.path.join(dir, subdir, file),
                        rootDir: dir,
                        rootType: dirType,
                        subDir: subdir,
                        subDirArray: subdir.split('/'),
                        isFile: isFile,
                        ext: me._libs.path.extname(file)
                    },
                    pkg: pkg
                };
                source.fs.basename = me._libs.path.basename(file, source.fs.ext);

                if (me._skipBadPath(source.fs)) {
                    return false;
                }

                ret = me.findResourceVersionByConvention(source, mojitType);
                if ('object' === typeof ret) {
                    if (ret.skipSubdirParts) {
                        source.fs.subDirArray = source.fs.subDirArray.slice(ret.skipSubdirParts);
                        source.fs.subDir = source.fs.subDirArray.join('/') || '.';
                    }
                    res = me.parseResourceVersion(source, ret.type, ret.subtype, mojitType);
                    if ('object' === typeof res) {
                        ress.push(res);
                    }
                    // don't recurse into resources that are directories
                    return false;
                }
                return ret;
            });

            return ress;
        },


        /**
         * Indicates whether file should be skipped based on its path
         *
         * @private
         * @method _skipBadPath
         * @param {object} pathParts the "source.fs" part of the resource
         * @return {boolean} true indicates that the file should be skipped
         */
        _skipBadPath: function(fs) {
            if (fs.isFile && fs.ext.substr(1).match(isNotAlphaNum)) {
                return true;
            }
            return false;
        },


        /**
         * A wrapper for `fs.readdirSync()` that guarantees ordering. The order
         * in which the file system is walked is significant within the resource
         * store, e.g., when looking up a matching context.
         *
         * @private
         * @method _sortedReaddirSync
         * @param {string} path directory to read
         * @return {array} files in the directory
         */
        _sortedReaddirSync: function(path) {
            var out = this._libs.fs.readdirSync(path);
            return out.sort();
        },


        /** 
         * Recursively walks a directory
         * @private
         * @method _walkDirRecursive
         * @param {string} dir directory to start at
         * @param {function(error, subdir, name, isFile)} cb callback called for each file
         * @param {string} _subdir INTERNAL argument for recursion, please ignore
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
            fulldir = this._libs.path.join(dir, subdir);
            if (!(this._libs.fs.existsSync || this._libs.path.existsSync)(fulldir)) {
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
                childPath = this._libs.path.join(subdir, childName);
                childFullPath = this._libs.path.join(dir, childPath);
                try {
                    childStat = this._libs.fs.statSync(childFullPath);
                } catch (e) {
                    Y.log('invalid file. skipping ' + childFullPath, 'warn', NAME);
                    continue;
                }
                if (childStat.isFile()) {
                    cb(null, subdir, childName, true);
                } else if (childStat.isDirectory()) {
                    if (cb(null, subdir, childName, false)) {
                        this._walkDirRecursive(dir, cb, childPath);
                    }
                }
            }
        },


        /**
         * Takes a list of globs and turns it into a list of matching paths.
         * @private
         * @method _globList
         * @param {string} prefix prefix for every path in the list
         * @param {array} list list of globs
         * @return {array} list of paths matching the globs
         */
        _globList: function(prefix, list) {
            var found = [],
                i,
                glob;
            for (i = 0; i < list.length; i += 1) {
                glob = list[i];
                if ('/' !== glob.charAt(0)) {
                    glob = this._libs.path.join(prefix, glob);
                }
                found = found.concat(this._libs.glob.sync(glob, {}));
            }
            return found;
        },


        /**
         * Augments this resource store's Y object with the specified YUI modules.
         * @private
         * @method _yuiUseSync
         * @param {object} modules YUI module configuration information
         * @return {nothing}
         */
        _yuiUseSync: function(modules) {
            Y.applyConfig({
                useSync: true,
                modules: modules
            });
            Y.use.apply(Y, Object.keys(modules));
            Y.applyConfig({ useSync: false });
        }


    });

    Y.namespace('mojito');
    Y.mojito.ResourceStore = ResourceStore;


}, '0.0.1', { requires: [
    'base',
    'json-stringify',
    'oop'
]});
