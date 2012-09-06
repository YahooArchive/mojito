/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, stupid:true*/
/*global YUI*/


/**
 * @module ResourceStoreAddon
 */


/**
 * @class RSAddonYUI
 * @extension ResourceStore.server
 */
YUI.add('addon-rs-yui', function(Y, NAME) {

    var libfs = require('fs'),
        libpath = require('path'),
        libvm = require('vm'),
        WARN_SERVER_MODULES = /\b(dom-[\w\-]+|node-[\w\-]+|io-upload-iframe)/ig,
        MODULE_SUBDIRS = {
            autoload: true,
            tests: true,
            yui_modules: true
        };

    function RSAddonYUI() {
        RSAddonYUI.superclass.constructor.apply(this, arguments);
    }
    RSAddonYUI.NS = 'yui';

    Y.extend(RSAddonYUI, Y.Plugin.Base, {

        /**
         * This methods is part of Y.Plugin.Base.  See documentation for that for details.
         * @method initializer
         * @param {object} config Configuration object as per Y.Plugin.Base
         * @return {nothing}
         */
        initializer: function(config) {
            this.appRoot = config.appRoot;
            this.mojitoRoot = config.mojitoRoot;
            this.afterHostMethod('findResourceVersionByConvention', this.findResourceVersionByConvention, this);
            this.beforeHostMethod('parseResourceVersion', this.parseResourceVersion, this);
            this.beforeHostMethod('addResourceVersion', this.addResourceVersion, this);
            this.onHostEvent('getMojitTypeDetails', this.onGetMojitTypeDetails, this);
            this.onHostEvent('mojitResourcesResolved', this.onMojitResourcesResolved, this);
            this.yuiConfig = config.host.getStaticAppConfig().yui;

            this.modules = {};          // env: poslKey: module: details
            this.sortedModules = {};    // env: poslKey: lang: module: details

            this.usePrecomputed = -1 !== this.yuiConfig.dependencyCalculations.indexOf('precomputed');
            this.useOnDemand = -1 !== this.yuiConfig.dependencyCalculations.indexOf('ondemand');
            if (!this.usePrecomputed) {
                this.useOnDemand = true;
            }
        },


        /**
         * Returns a datastructure which tells a YUI instance where to find
         * the YUI modules that are shared among all mojits.
         * @method getConfigShared
         * @param {string} env runtime environment (either `client`, or `server`)
         * @param {object} ctx runtime context
         * @param {boolean} justApp Indicates whether to include the YUI
         *      modules just found in the application (true), or also include
         *      those found in mojito (false).
         * @return {object} datastructure for configuring YUI
         */
        getConfigShared: function(env, ctx, justApp) {
            var r,
                res,
                ress,
                modules = {};
            ress = this.get('host').getResources(env, ctx, { mojit: 'shared' });
            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                if (!res.yui || !res.yui.name) {
                    continue;
                }
                if (justApp && ('mojito' === res.source.pkg.name)) {
                    continue;
                }
                modules[res.yui.name] = this._makeYUIModuleConfig(env, res);
            }
            return { modules: modules };
        },


        /**
         * Returns a datastructure which tells a YUI instance where to find
         * the YUI modules that are in all the mojits.
         * @method getConfigAllMojits
         * @param {string} env runtime environment (either `client`, or `server`)
         * @param {object} ctx runtime context
         * @return {object} datastructure for configuring YUI
         */
        getConfigAllMojits: function(env, ctx) {
            var store = this.get('host'),
                m,
                mojit,
                mojits,
                r,
                res,
                ress,
                modules = {};
            mojits = store.listAllMojits();
            for (m = 0; m < mojits.length; m += 1) {
                mojit = mojits[m];
                ress = store.getResources(env, ctx, { mojit: mojit });
                for (r = 0; r < ress.length; r += 1) {
                    res = ress[r];
                    if (!res.yui || !res.yui.name) {
                        continue;
                    }
                    if (res.mojit !== mojit) {
                        // generally only happens if res.mojit is 'shared'
                        continue;
                    }
                    modules[res.yui.name] = this._makeYUIModuleConfig(env, res);
                }
            }
            return { modules: modules };
        },


        /**
         * Using AOP, this is called after the ResourceStore's version.
         * @method findResourceVersionByConvention
         * @param {object} source metadata about where the resource is located
         * @param {string} mojitType name of mojit to which the resource likely belongs
         * @return {object||null} for yui modules or lang bundles, returns metadata signifying that
         */
        findResourceVersionByConvention: function(source, mojitType) {
            var fs = source.fs;

            if (!fs.isFile) {
                return;
            }
            if ('.js' !== fs.ext) {
                return;
            }

            if (fs.subDirArray.length >= 1 && MODULE_SUBDIRS[fs.subDirArray[0]]) {
                return new Y.Do.AlterReturn(null, {
                    type: 'yui-module',
                    skipSubdirParts: 1
                });
            }

            if (fs.subDirArray.length >= 1 && 'lang' === fs.subDirArray[0]) {
                return new Y.Do.AlterReturn(null, {
                    type: 'yui-lang',
                    skipSubdirParts: 1
                });
            }
        },


        /**
         * Using AOP, this is called before the ResourceStore's version.
         * @method parseResourceVersion
         * @param {object} source metadata about where the resource is located
         * @param {string} type type of the resource
         * @param {string} subtype subtype of the resource
         * @param {string} mojitType name of mojit to which the resource likely belongs
         * @return {object||null} for yui modules or lang bundles, returns the resource metadata
         */
        parseResourceVersion: function(source, type, subtype, mojitType) {
            var fs = source.fs,
                baseParts,
                res;

            if ('yui-lang' === type) {
                res = {
                    source: source,
                    mojit: mojitType,
                    type: 'yui-lang',
                    affinity: 'common',
                    selector: '*'
                };
                if (!res.yui) {
                    res.yui = {};
                }
                if (fs.basename === mojitType) {
                    res.yui.lang = '';
                } else if (mojitType === fs.basename.substr(0, mojitType.length)) {
                    res.yui.lang = fs.basename.substr(mojitType.length + 1);
                } else {
                    Y.log('invalid YUI lang file format. skipping ' + fs.fullPath, 'error', NAME);
                }
                res.name = res.yui.lang;
                res.id = [res.type, res.subtype, res.name].join('-');
                return new Y.Do.Halt(null, res);
            }

            if ('yui-module' === type) {
                baseParts = fs.basename.split('.');
                res = {
                    source: source,
                    mojit: mojitType,
                    type: 'yui-module',
                    affinity: 'server',
                    selector: '*'
                };
                if (baseParts.length >= 3) {
                    res.selector = baseParts.pop();
                }
                if (baseParts.length >= 2) {
                    res.affinity = baseParts.pop();
                }
                if (baseParts.length !== 1) {
                    Y.log('invalid yui-module filename. skipping ' + fs.fullPath, 'warn', NAME);
                    return;
                }
                this._captureYUIModuleDetails(res);
                res.name = res.yui.name;
                res.id = [res.type, res.subtype, res.name].join('-');
                return new Y.Do.Halt(null, res);
            }
        },


        /**
         * Using AOP, this is called before the ResourceStore's version.
         * If the resource is a YUI module, augments the metadata with details
         * about the YUI module.
         * @method addResourceVersion
         * @param {object} res resource version metadata
         * @return {nothing}
         */
        addResourceVersion: function(res) {
            if ('.js' !== res.source.fs.ext) {
                return;
            }
            if (res.yui && res.yui.name) {
                // work done already
                return;
            }
            // ASSUMPTION:  no app-level resources are YUI modules
            if (!res.mojit) {
                return;
            }
            if ('asset' === res.type) {
                return;
            }
            this._captureYUIModuleDetails(res);
        },


        /**
         * This is called when the ResourceStore fires this event.
         * It augments the mojit type details with the precomputed YUI module
         * dependencies.
         * @method onGetMojitTypeDetails
         * @param {object} evt The fired event.
         * @return {nothing}
         */
        onGetMojitTypeDetails: function(evt) {
            var store = this.get('host'),
                dest = evt.mojit,
                env = evt.args.env,
                ctx = evt.args.ctx,
                posl = evt.args.posl,
                poslKey = Y.JSON.stringify(posl),
                mojitType = evt.args.mojitType,
                ress,
                r,
                res,
                sorted;
            //console.log('--------------------------------- onGetMojitTypeDetails -- ' + [env, ctx.lang, poslKey, mojitType].join(','));

            if (!dest.yui) {
                dest.yui = { config: {} };
            }
            if (!dest.yui.config) {
                dest.yui.config = { module: {} };
            }

            if (this.modules[env] && this.modules[env][poslKey]) {
                dest.yui.config.modules = this.modules[env][poslKey][mojitType];
            }

            ress = store.getResources(env, ctx, {mojit: mojitType});
            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                if (res.type === 'binder') {
                    if (!dest.views[res.name]) {
                        dest.views[res.name] = {};
                    }
                    dest.views[res.name]['binder-module'] = res.yui.name;
                    sorted = this._getYUIDependencies('client', poslKey, ctx.lang, res.yui.name);
                    if (sorted && sorted.paths) {
                        dest.views[res.name]['binder-yui-sorted'] = Y.clone(sorted.paths, true);
                    }
                }
                if (res.type === 'controller') {
                    dest['controller-module'] = res.yui.name;
                    sorted = this._getYUIDependencies(env, poslKey, ctx.lang, res.yui.name);
                    if (sorted && sorted.sorted) {
                        dest.yui.sorted = sorted.sorted.slice();
                    }
                    if (this.usePrecomputed && sorted && sorted.paths) {
                        dest.yui.sortedPaths = Y.clone(sorted.paths, true);
                    }
                }
            }
        },


        /**
         * This is called when the ResourceStore fires this event.
         * It precomputes the YUI module dependencies, to be used later during
         * onGetMojitTypeDetails.
         * @method onMojitResourcesResolved
         * @param {object} evt The fired event
         * @return {nothing}
         */
        onMojitResourcesResolved: function(evt) {
            var env = evt.env,
                posl = evt.posl,
                poslKey = Y.JSON.stringify(posl),
                mojit = evt.mojit,
                ress = evt.ress,
                r,
                res,
                langs = {},
                l,
                ll,
                lang,
                langName,
                langNames,
                viewEngineRequired = {},
                modules = {},
                binders = {},
                controller,
                controllerRequired = {},
                required,
                sorted,
                binderName,
                binder;
            //console.log('--------------------------------- onMojitResourcesResolved -- ' + [env, poslKey, mojit].join(','));

            if ('shared' === mojit) {
                return;
            }

            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                if ('addon' === res.type && 'view-engines' === res.subtype) {
                    viewEngineRequired[res.yui.name] = true;
                }
                if ('yui-lang' === res.type) {
                    langs[res.name] = res;
                }
                if (res.yui && res.yui.name) {
                    modules[res.yui.name] = {
                        requires: res.yui.meta.requires,
                        fullpath: (('client' === env) ? res.url : res.source.fs.fullPath)
                    };
                    if (res.mojit === mojit && res.type !== 'yui-lang' && res.type !== 'binder') {
                        controllerRequired[res.yui.name] = true;
                    }
                    if ('binder' === res.type) {
                        binders[res.name] = res;
                    }
                    if ('controller' === res.type) {
                        controller = res;
                    }
                }
            }
            if (controller && modules['inlinecss/' + mojit]) {
                controller.yui.meta.requires.push('inlinecss/' + mojit);
            }

            if (!this.modules[env]) {
                this.modules[env] = {};
            }
            if (!this.modules[env][poslKey]) {
                this.modules[env][poslKey] = {};
            }
            this.modules[env][poslKey][mojit] = Y.clone(modules, true);

            // we always want to do calculations for no-lang
            if (!langs['']) {
                langs[''] = undefined;
            }
            langNames = Object.keys(langs);
            for (l = 0; l < langNames.length; l += 1) {
                langName = langNames[l];
                lang = langs[langName];

                if (controller) {
                    required = Y.clone(controllerRequired, true);
                    required['mojito-dispatcher'] = true;
                    required[controller.yui.name] = true;
                    if (lang && lang.yui) {
                        required[lang.yui.name] = true;
                    } else {
                        for (ll in langs) {
                            if (langs.hasOwnProperty(ll) && ll !== '') {
                                lang = langs[ll];
                                required[lang.yui.name] = true;
                            }
                        }
                    }
                    // we don't know which views will be used, so we need all view engines
                    required = Y.merge(required, viewEngineRequired);
                    sorted = this._precomputeYUIDependencies(langName, env, mojit, modules, required);
                    this._setYUIDependencies(env, poslKey, langName, controller.yui.name, sorted);
                }

                if ('client' === env) {
                    for (binderName in binders) {
                        if (binders.hasOwnProperty(binderName)) {
                            binder = binders[binderName];
                            required = { 'mojito-client': true };
                            required[binder.yui.name] = true;

                            // view engines are needed to support mojitProxy.render()
                            required = Y.merge(required, viewEngineRequired);

                            sorted = this._precomputeYUIDependencies(langName, env, mojit, modules, required);
                            this._setYUIDependencies(env, poslKey, langName, binder.yui.name, sorted);
                        }
                    }
                }
            } // for each lang
        },


        /**
         * Precomputes a set of dependencies.
         * @private
         * @method _precomputeYUIDependencies
         * @param {string} lang YUI language code
         * @param {string} env runtime environment (either `client`, or `server`)
         * @param {string} mojit name of the mojit
         * @param {object} modules YUI module metadata
         * @param {object} required lookup hash of YUI module names that are required
         * @return {object} precomputed (and sorted) module dependencies
         */
        _precomputeYUIDependencies: function(lang, env, mojit, modules, required) {
            var loader,
                m,
                module,
                info,
                warn,
                sortedPaths = {};

            // We don't actually need the full list, just the required modules.
            // YUI.Loader() will do the rest at runtime.
            if (!this.usePrecomputed) {
                for (module in required) {
                    if (required.hasOwnProperty(module)) {
                        sortedPaths[module] = modules[module].fullpath;
                    }
                }
                return {
                    sorted: Object.keys(sortedPaths),
                    paths: sortedPaths
                };
            }

            // HACK
            // We need to clear YUI's cached dependencies, since there's no
            // guarantee that the previously calculated dependencies have been done
            // using the same context as this calculation.
            delete YUI.Env._renderedMods;

            // Use ignoreRegistered here instead of the old `delete YUI.Env._renderedMods` hack
            loader = new Y.Loader({ lang: lang, ignoreRegistered: true });
            // Only override the default if it's required
            if (this.yuiConfig && this.yuiConfig.base) {
                loader.base = this.yuiConfig.base;
            }

            loader.addGroup({modules: modules}, mojit);
            loader.calculate({required: required});

            for (m = 0; m < loader.sorted.length; m += 1) {
                module = loader.sorted[m];
                info = loader.moduleInfo[module];
                if (info) {
                    // modules with "nodejs" in their name are tweaks on other modules
                    if ('client' === env && module.indexOf('nodejs') !== -1) {
                        continue;
                    }
                    sortedPaths[module] = info.fullpath || loader._url(info.path);
                }
            }

            // log warning if server mojit has dom dependency
            if ('server' === env) {
                warn = Y.Object.keys(sortedPaths).join(' ').match(WARN_SERVER_MODULES);
                if (warn) {
                    Y.log('your mojit "' + mojit + '" has a server affinity and these client-related deps: ' + warn.join(', '), 'WARN', NAME);
                    Y.log('Mojito may be unable to start, unless you have provided server-side DOM/host-object suppport', 'WARN', NAME);
                }
            }

            return {
                sorted: loader.sorted,
                paths: sortedPaths
            };
        },


        /**
         * Saves the precomputed YUI module dependencies for later.
         * @private
         * @method _setYUIDependencies
         * @param {string} env runtime environment (either `client`, or `server`)
         * @param {string} poslKey key (representing the POSL) under which to save the moduldes
         * @param {string} lang YUI language code
         * @param {string} module YUI module name for which the precomputed dependencies are for
         * @param {object} sorted the precomputed dependencies
         * @return {nothing}
         */
        _setYUIDependencies: function(env, poslKey, lang, module, sorted) {
            if (!this.sortedModules[env]) {
                this.sortedModules[env] = {};
            }
            if (!this.sortedModules[env][poslKey]) {
                this.sortedModules[env][poslKey] = {};
            }
            if (!this.sortedModules[env][poslKey][lang]) {
                this.sortedModules[env][poslKey][lang] = {};
            }
            this.sortedModules[env][poslKey][lang][module] = sorted;
        },


        /**
         * Returns precomputed dependencies saved by _setYuiSorted.
         * @private
         * @method _getYUIDependencies
         * @param {string} env runtime environment (either `client`, or `server`)
         * @param {string} poslKey key (representing the POSL) under which to save the moduldes
         * @param {string} lang YUI language code
         * @param {string} module YUI module name for which the precomputed dependencies are for
         * @return {object} the precomputed dependencies
         */
        _getYUIDependencies: function(env, poslKey, lang, module) {
            lang = lang || '';
            var parts = lang.split('-'),
                p,
                test;
            if (!this.sortedModules[env]) {
                return;
            }
            if (!this.sortedModules[env][poslKey]) {
                return;
            }
            // example:  first try "zh-Hans-CN", then "zh-Hans", then "zh"
            for (p = parts.length; p > 0; p -= 1) {
                test = parts.slice(0, p).join('-');
                if (this.sortedModules[env][poslKey][test] &&
                        this.sortedModules[env][poslKey][test][module]) {
                    return this.sortedModules[env][poslKey][test][module];
                }
            }
            // fall back to "default language"
            return this.sortedModules[env][poslKey][''][module];
        },


        /**
         * Generates the YUI configuration for the resource.
         * @private
         * @method _makeYUIModuleConfig
         * @param {string} env runtime environment (either `client`, or `server`)
         * @param {object} res the resource metadata
         * @return {object} the YUI configuration for the module
         */
        _makeYUIModuleConfig: function(env, res) {
            var config = {
                fullpath: ('client' === env) ? res.url : res.source.fs.fullPath,
                requires: (res.yui.meta && res.yui.meta.requires) || []
            };
            return config;
        },


        /**
         * If the resource is a YUI module, augments its metadata with metadata
         * about the YUI module.
         * @private
         * @method _captureYUIModuleDetails
         * @param {object} res resource metadata
         * @return {nothing}
         */
        _captureYUIModuleDetails: function(res) {
            var file,
                ctx,
                yui = {};
            file = libfs.readFileSync(res.source.fs.fullPath, 'utf8');
            ctx = {
                console: {
                    log: function() {}
                },
                window: {},
                document: {},
                YUI: {
                    ENV: {},
                    config: {},
                    use: function() {},
                    add: function(name, fn, version, meta) {
                        yui.name = name;
                        yui.version = version;
                        yui.meta = meta || {};
                        if (!yui.meta.requires) {
                            yui.meta.requires = [];
                        }
                    }
                }
            };
            try {
                libvm.runInNewContext(file, ctx, res.source.fs.fullPath);
            } catch (e) {
                yui = null;
                Y.log(e.message + '\n' + e.stack, 'error', NAME);
            }
            if (yui) {
                res.yui = Y.merge(res.yui || {}, yui);
            }
        }


    });
    Y.namespace('mojito.addons.rs');
    Y.mojito.addons.rs.yui = RSAddonYUI;

}, '0.0.1', { requires: ['plugin', 'oop', 'loader-base', 'json-stringify']});
