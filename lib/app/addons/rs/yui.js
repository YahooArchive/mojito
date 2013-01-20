/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, nomen:true, stupid:true, continue:true, node:true*/
/*global YUI*/


/**
 * @module ResourceStoreAddon
 */


/**
 * @class RSAddonYUI
 * @extension ResourceStore.server
 */
YUI.add('addon-rs-yui', function(Y, NAME) {

    'use strict';

    var libfs = require('fs'),
        libpath = require('path'),
        libvm = require('vm'),
        libmime = require('mime'),

        WARN_SERVER_MODULES = /\b(dom-[\w\-]+|node-[\w\-]+|io-upload-iframe)/ig,
        MODULE_SUBDIRS = {
            autoload: true,
            tests: true,
            yui_modules: true
        },

        // creating a vm context to execute all files
        // we want to reuse it because it is 200x faster
        // than creating a new one per file
        contextForRunInContext = libvm.createContext({
            require: require,
            module: require('module'),
            console: {
                log: function() {}
            },
            window: {},
            document: {},
            YUI: null
        }),

        yuiSandboxFactory = require(libpath.join(__dirname, '..', '..', '..', 'yui-sandbox.js')),
        syntheticStat = null,

        MODULE_META_ENTRIES          = ['path', 'requires', 'use', 'optional', 'skinnable', 'after', 'condition'],
        // TODO: revisit this list with @davglass
        MODULE_META_PRIVATE_ENTRIES  = ['after', 'expanded', 'supersedes', 'ext', '_parsed', '_inspected', 'skinCache', 'langCache'],

        REGEX_LANG_TOKEN = /\"\{langToken\}\"/g,
        REGEX_LANG_PATH  = /\{langPath\}/g,
        REGEX_LOCALE     = /\_([a-z]{2}(-[A-Z]{2})?)$/,

        MODULE_PER_LANG  = ['loader-app-base', 'loader-app-resolved', 'loader-yui3-base', 'loader-yui3-resolved'],
        MODULE_TEMPLATES = {
            /*
             * This is a replacement of the original loader to include loader-app
             * module, which represents the meta of the app.
             */
            'loader-app':
                'YUI.add("loader",function(Y){' +
                '},"",{requires:["loader-base","loader-yui3","loader-app"]});',

            /*
             * Use this module when you want to rely on the loader to do recursive
             * computations to resolve combo urls for app yui modules in the client
             * runtime.
             * Note: This is the default config used by YUI.
             */
            'loader-app-base':
                'YUI.add("loader-app",function(Y){' +
                    'Y.applyConfig({groups:{app:Y.merge(' +
                        '((Y.config.groups&&Y.config.groups.app)||{}),' +
                        '{modules:{app-base}}' +
                    ')}});' +
                '},"",{requires:["loader-base"]});',

            /*
             * Use this module when you want to precompute the loader metadata to
             * avoid doing recursive computations to resolve combo urls for app yui modules
             * in the client runtime.
             * Note: Keep in mind that this meta is considerable bigger than "loader-app-base".
             */
            'loader-app-resolved':
                'YUI.add("loader-app",function(Y){' +
                    'Y.applyConfig({groups:{app:Y.merge(' +
                        '((Y.config.groups&&Y.config.groups.app)||{}),' +
                        '{modules:{app-resolved}}' +
                    ')}});' +
                '},"",{requires:["loader-base"]});',

            /*
             * Use this module when you want to rely on the loader to do recursive
             * computations to resolve combo urls for yui core modules in the client
             * runtime.
             * Note: This is a more restrictive configuration than the default
             * meta bundle with yui, but it is considerable smaller, which helps
             * with performance.
             */
            'loader-yui3-base':
                'YUI.add("loader-yui3",function(Y){' +
                    // TODO: we should use YUI.applyConfig() instead of the internal
                    //       YUI.Env API, but that's pending due a bug in YUI:
                    //       http://yuilibrary.com/projects/yui3/ticket/2532854
                    'YUI.Env[Y.version].modules=YUI.Env[Y.version].modules||' +
                    '{yui-base};' +
                '},"",{requires:["loader-base"]});',

            /*
             * Use this module when you want to precompute the loader metadata to
             * avoid doing recursive computations to resolve combo urls for yui core
             * modules in the client runtime.
             * Note: Keep in mind that this meta is considerable bigger than "loader-yui3-base".
             */
            'loader-yui3-resolved':
                'YUI.add("loader-yui3",function(Y){' +
                    // TODO: we should use YUI.applyConfig() instead of the internal
                    //       YUI.Env API, but that's pending due a bug in YUI:
                    //       http://yuilibrary.com/projects/yui3/ticket/2532854
                    'YUI.Env[Y.version].modules=YUI.Env[Y.version].modules||' +
                    '{yui-resolved};' +
                '},"",{requires:["loader-base"]});'
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

            // for all synthetic files, since we don't have an actual file, we need to
            // create a stat object, in this case we use the mojito folder stat as
            // a replacement. We make it syncronous since it is meant to be executed
            // once during the preload process.
            syntheticStat = libfs.statSync(libpath.join(__dirname, '../../../..'));

            this.afterHostMethod('findResourceVersionByConvention', this.findResourceVersionByConvention, this);
            this.beforeHostMethod('parseResourceVersion', this.parseResourceVersion, this);
            this.beforeHostMethod('addResourceVersion', this.addResourceVersion, this);
            this.beforeHostMethod('makeResourceVersions', this.makeResourceVersions, this);
            this.afterHostMethod('resolveResourceVersions', this.resolveResourceVersions, this);
            this.beforeHostMethod('getResourceContent', this.getResourceContent, this);
            this.staticAppConfig = config.host.getStaticAppConfig() || {};
            this.yuiConfig = (this.staticAppConfig.yui && this.staticAppConfig.yui.config) || {};
            this.langs = {};            // keys are list of languages in the app, values are simply "true"
            this.resContents    = {};      // res.id: contents
            this.appModulesRess = {};      // res.yui.name: module ress accessible over the network
            this.yuiModulesRess = {};      // res.yui.name: fake ress
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
         * Hook to allow other RS addons to control the combo
         * handler configuration for group "app". By default,
         * the `yui.config.groups.app` will allow customization
         * of the combo handler when needed from application.json
         * @method getAppGroupConfig
         * @param {object} ctx the context
         * @return {object} yui configuration for group "app"
         */
        getAppGroupConfig: function(ctx) {
            var appConfig = this.get('host').getAppConfig(ctx),
                yuiConfig = (appConfig.yui && appConfig.yui.config) || {};
            return Y.merge({
                combine: (yuiConfig.combine === false) ? false : true,
                maxURLLength: 1024,
                base: "/.",
                comboBase: "/combo~",
                comboSep: "~",
                root: ""
            }, ((yuiConfig.groups && yuiConfig.groups.app) || {}));
        },


        /**
         * Produce the YUI seed files. This can be controlled through
         * application.json->yui->config->seed in a form of
         * a array with the list of full paths for all seed files.
         * @method getAppSeedFiles
         * @param {object} ctx the context
         * @return {array} list of seed files
         */
        getAppSeedFiles: function(ctx) {
            var closestLang = Y.mojito.util.findClosestLang(ctx.lang, this.langs),
                files = [],
                appConfig = this.get('host').getAppConfig(ctx),
                yuiConfig = (appConfig.yui && appConfig.yui.config) || {},
                seed = yuiConfig.seed ? Y.Array(yuiConfig.seed) : [
                    'yui-base',
                    'loader-base',
                    'loader-yui3',
                    'loader-app',
                    'loader-app-base{langPath}'
                ],
                hash = {},
                i;

            // adjusting lang just to be url friendly
            closestLang = closestLang ? '_' + closestLang : '';

            // The seed files collection is lang aware, hence we should adjust
            // is on runtime.
            for (i = 0; i < seed.length; i += 1) {
                if (hash.hasOwnProperty(seed[i])) {
                    Y.log('Skiping duplicated entry in yui.config.seed: ' + seed[i], 'warn', NAME);
                } else {
                    // adjusting the seed based on {langToken} to facilitate
                    // the customization of the seed file url per lang.
                    files[i] = seed[i].replace(REGEX_LANG_PATH, closestLang);
                    // verifying if the file is actually a synthetic or yui module
                    if (this.yuiModulesRess.hasOwnProperty(files[i])) {
                        files[i] = this.yuiModulesRess[files[i]].url;
                    } else if (this.appModulesRess.hasOwnProperty(files[i])) {
                        files[i] = this.appModulesRess[files[i]].url;
                    }
                }
                // hash table to avoid duplicated entries in the seed
                hash[seed[i]] = true;
            }

            return files;
        },


        /*
         * Aggregate all yui core files
         * using the path of as the hash.
         *
         * @method getYUIURLResources
         * @return {object} yui core resources by url
         * @api private
         */
        getYUIURLResources: function () {
            var name,
                urls = {};

            for (name in this.yuiModulesRess) {
                if (this.yuiModulesRess.hasOwnProperty(name)) {
                    urls[this.yuiModulesRess[name].url] = this.yuiModulesRess[name];
                }
            }
            return urls;
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
                res,
                sandbox;

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
                sandbox = {
                    Intl: {
                        add: function(langFor, lang) {
                            res.yui.langFor = langFor;
                            res.yui.lang = lang;
                        }
                    }
                };
                this._captureYUIModuleDetails(res, sandbox);
                res.name = res.yui.name;
                res.id = [res.type, res.subtype, res.name].join('-');
                this.langs[res.yui.lang] = true;
                // caching the lang res
                if (this.appModulesRess[res.yui.name]) {
                    Y.log('Language bundle collision for name=' + res.yui.name +
                        '. Choosing: ' + this.appModulesRess[res.yui.name].source.fs.fullPath +
                        ' over ' + res.source.fs.fullPath, 'warn', NAME);
                } else {
                    this.appModulesRess[res.yui.name] = res;
                }
                if (res.yui.name === 'lang/' + res.yui.langFor) {
                    res.yui.isRootLang = true;
                }
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
                // caching the res if it is accesible form client since
                // the appModulesRes is used to server static files.
                if (res.affinity !== 'server') {
                    if (this.appModulesRess[res.yui.name]) {
                        Y.log('YUI module collision for name=' + res.yui.name +
                            '. Choosing: ' + this.appModulesRess[res.yui.name].source.fs.fullPath +
                            ' over ' + res.source.fs.fullPath, 'warn', NAME);
                    } else {
                        this.appModulesRess[res.yui.name] = res;
                    }
                }
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
         * Using AOP, this is called before the ResourceStore's version.
         * We register some fake resource versions that represent the YUI
         * configurations.
         * @method addResourceVersion
         * @param {object} res resource version metadata
         * @return {nothing}
         */
        makeResourceVersions: function() {
            //console.log('------------------------------------------- YUI makeResourceVersions');
            var store = this.get('host'),
                l,
                i,
                lang,
                name,
                langExt,
                langs = Object.keys(this.langs),
                res;

            // we always want to make the no-lang version
            if (!this.langs['']) {
                langs.push('');
            }

            res = {
                source: {},
                mojit: 'shared',
                type: 'yui-module',
                subtype: 'synthetic',
                name: 'loader-app',
                affinity: 'client',
                selector: '*',
                yui: {
                    name: 'loader-app'
                }
            };
            res.id = [res.type, res.subtype, res.name].join('-');
            res.source.pkg = store.getAppPkgMeta();
            res.source.fs = store.makeResourceFSMeta(this.appRoot, 'app', '.', 'loader-app.js', true);
            // adding res to cache
            this.appModulesRess['loader-app'] = res;
            store.addResourceVersion(res);

            for (l = 0; l < langs.length; l += 1) {
                lang = langs[l];
                langExt = lang ? '_' + lang : '';

                for (i = 0; i < MODULE_PER_LANG.length; i += 1) {

                    name = MODULE_PER_LANG[i];

                    res = {
                        source: {},
                        mojit: 'shared',
                        type: 'yui-module',
                        subtype: 'synthetic',
                        name: [name, lang].join('-'),
                        affinity: 'client',
                        selector: '*',
                        yui: {
                            name: name + langExt
                        }
                    };
                    res.id = [res.type, res.subtype, res.name].join('-');
                    res.source.pkg = store.getAppPkgMeta();
                    res.source.fs = store.makeResourceFSMeta(this.appRoot, 'app', '.',
                        name + langExt + '.js', true);
                    // adding res to cache
                    this.appModulesRess[name + langExt] = res;
                    store.addResourceVersion(res);

                }

            }

            // we can also make some fake resources for all yui
            // modules that we might want to serve.
            this._precalcYUIResources();
        },


        /**
         * Using AOP, this is called after the ResourceStore's version.
         * We precompute the YUI configurations.
         * @method resolveResourceVersions
         * @return {nothing}
         */
        resolveResourceVersions: function() {
            //console.log('------------------------------------------- YUI resolveResourceVersions');
            var langs = Object.keys(this.langs);
            // we always want to make the no-lang version
            if (!this.langs['']) {
                langs.push('');
            }
            this._precalcLoaderMeta(langs);
        },


        /**
         * Return the content for resources we make in makeResourceVersions().
         *
         * @method getResourceContent
         * @param {object} res the resource object
         * @param {function} callback callback used to return the resource content (or error)
         * @param {Error|undefined} callback.err Error that occurred, if any.
         *      If an error is given that the other two arguments will be undefined.
         * @param {Buffer} callback.content the contents of the resource
         * @param {Stat||null} callback.stat Stat object with details about the file on the filesystem
         *          Can be null if the resource doesn't have a direct representation on the filesystem.
         * @return {undefined} nothing is returned, the results are returned via the callback
         */
        getResourceContent: function(res, callback) {
            var contents = res.name && this.resContents[res.name];
            if (contents) {
                callback(null, new Buffer(contents, 'utf8'), syntheticStat);
                return new Y.Do.Halt(null, null);
            }
        },


        /**
         * Precomputes YUI modules resources, so that we don't have to at runtime.
         * @private
         * @method _precalcYUIResources
         * @return {nothing}
         */
        _precalcYUIResources: function() {
            var name,
                modules,
                mimetype,
                charset,
                fullpath,
                staticHandling = this.staticAppConfig.staticHandling || {},
                Ysandbox = yuiSandboxFactory
                    .getYUI(this.yuiConfig.filter)(Y.merge(this.yuiConfig));

            // used to find the the modules in YUI itself
            Ysandbox.use('loader');
            modules = (new Ysandbox.Loader(Ysandbox.config)).moduleInfo || {};

            for (name in modules) {
                if (modules.hasOwnProperty(name)) {
                    // faking a RS object for the sake of simplicity
                    fullpath = libpath.join(__dirname,
                        '../../../../node_modules/yui', modules[name].path);
                    mimetype = libmime.lookup(fullpath);
                    charset  = libmime.charsets.lookup(mimetype);

                    modules[name] = {
                        url: libpath.join('/', (staticHandling.prefix || 'static'),
                                'yui', modules[name].path),
                        source: {
                            fs: {
                                isFile: true,
                                fullPath: fullpath
                            }
                        },
                        mime: {
                            type: mimetype,
                            charset: charset
                        }
                    };
                }
            }
            this.yuiModulesRess = modules;
        },

        /**
         * Precomputes YUI loader metadata, so that we don't have to at runtime.
         * @private
         * @method _precalcLoaderMeta
         * @param {array} langs array of languages for which to compute YUI loader metadata
         * @return {nothing}
         */
        _precalcLoaderMeta: function(langs) {
            //console.log('------------------------------------------- YUI _precalcLoaderMeta');
            var store = this.get('host'),
                lang,
                mojits,
                shared,
                Ysandbox,
                modules_config,
                Ysanbdox,
                loader,
                resolved,
                appMetaData = {
                    base: {},
                    full: {}
                },
                yuiMetaData = {
                    base: {},
                    full: {}
                },
                expanded_modules = {}, // expanded meta (including fullpaths)
                modules = {},          // regular meta  (a la loader-yui3)
                conditions = {},       // hash to store conditional functions
                name,
                i,
                l;

            // TODO:  inline these calls, and optimize
            mojits = this.getConfigAllMojits('client', {});
            shared = this.getConfigShared('client', {});

            Ysandbox = yuiSandboxFactory
                .getYUI(this.yuiConfig.filter)(Y.merge(this.yuiConfig));

            modules_config = Ysandbox.merge((mojits.modules || {}), (shared.modules || {}));
            Ysandbox.applyConfig({
                modules: Ysandbox.merge({}, modules_config),
                useSync: true
            });
            Ysandbox.use('loader');

            // using the loader at the server side to compute the loader metadata
            // to avoid loading the whole thing on demand.
            loader = new Ysandbox.Loader(Ysandbox.merge(Ysandbox.config, {
                require: Ysandbox.Object.keys(modules_config)
            }));
            resolved = loader.resolve(true);

            // we need to copy, otherwise the datastructures that Y.loader holds
            // onto get mixed with our changes, and Y.loader gets confused
            resolved = Y.mojito.util.copy(resolved);

            this._processMeta(resolved.jsMods,  modules, expanded_modules, conditions);
            this._processMeta(resolved.cssMods, modules, expanded_modules, conditions);

            for (i = 0; i < langs.length; i += 1) {
                lang = langs[i] || '*';

                appMetaData.base[lang] = {};
                appMetaData.full[lang] = {};
                yuiMetaData.base[lang] = {};
                yuiMetaData.full[lang] = {};

                for (name in expanded_modules) {
                    if (expanded_modules.hasOwnProperty(name)) {
                        if (expanded_modules[name].owner &&
                                !expanded_modules[expanded_modules[name].owner]) {
                            // if there is not a module corresponding with the lang pack
                            // that means the controller doesn't have client affinity,
                            // in that case, we don't need to ship it.
                            continue;
                        }
                        if ((lang === '*') ||
                                (expanded_modules[name].langPack === '*') ||
                                    (!expanded_modules[name].langPack) ||
                                            (lang === expanded_modules[name].langPack)) {

                            // we want to separate modules into different buckets
                            // to be able to support groups in loader config
                            if (modules_config[name]) {
                                appMetaData.base[lang][name] = modules[name];
                                appMetaData.full[lang][name] = expanded_modules[name];
                            } else {
                                yuiMetaData.base[lang][name] = modules[name];
                                yuiMetaData.full[lang][name] = expanded_modules[name];
                            }
                        }
                    }
                }

                appMetaData.base[lang] = JSON.stringify(appMetaData.base[lang]);
                appMetaData.full[lang] = JSON.stringify(appMetaData.full[lang]);
                yuiMetaData.base[lang] = JSON.stringify(yuiMetaData.base[lang]);
                yuiMetaData.full[lang] = JSON.stringify(yuiMetaData.full[lang]);

                for (name in conditions) {
                    if (conditions.hasOwnProperty(name)) {
                        appMetaData.base[lang] = appMetaData.base[lang]
                            .replace('"{' + name + '}"', conditions[name]);
                        appMetaData.full[lang] = appMetaData.full[lang]
                            .replace('"{' + name + '}"', conditions[name]);
                        yuiMetaData.base[lang] = yuiMetaData.base[lang]
                            .replace('"{' + name + '}"', conditions[name]);
                        yuiMetaData.full[lang] = yuiMetaData.full[lang]
                            .replace('"{' + name + '}"', conditions[name]);
                    }
                }
            } // for each lang

            this.resContents['loader-app'] = MODULE_TEMPLATES['loader-app'];

            for (l = 0; l < langs.length; l += 1) {
                lang = langs[l] || '';

                for (i = 0; i < MODULE_PER_LANG.length; i += 1) {

                    name = MODULE_PER_LANG[i];
                    // populating the internal cache using name+lang as the key
                    this.resContents[([name, lang].join('-'))] =
                        this._produceMeta(name, lang || '*', appMetaData, yuiMetaData);

                }

            }
        },


        /**
         * @private
         * @method _processMeta
         * @param {object} resolvedMods resolved module metadata, from Y.Loader.resolve()
         * @param {object} modules regular YUI module metadata (ala loader-yui3)
         * @param {object} expanded_modules YUI module metadata that include details such as fullpaths. This parameter is populated by this method.
         * @param {object} conditions store of conditional functions. This parameter is populated by this method.
         * @return {nothing}
         */
        _processMeta: function(resolvedMods, modules, expanded_modules, conditions) {
            var m,
                l,
                i,
                module,
                name,
                mod,
                lang,
                bundle;

            for (m in resolvedMods) {
                if (resolvedMods.hasOwnProperty(m)) {
                    module = resolvedMods[m];

                    mod = name = module.name;
                    bundle = name.indexOf('lang/') === 0;
                    lang = bundle && REGEX_LOCALE.exec(name);

                    if (lang) {
                        mod = mod.slice(0, lang.index); // eg. lang/foo_en-US -> lang/foo
                        lang = lang[1];
                        // TODO: validate lang
                    }
                    mod = bundle ? mod.slice(5) : mod; // eg. lang/foo -> foo

                    // language manipulation
                    // TODO: this routine is very restrictive, and we might want to
                    // make it optional later on.
                    if (module.lang) {
                        module.lang = ['{langToken}'];
                    }
                    if (bundle) {
                        module.owner = mod;
                        // applying some extra optimizations
                        module.langPack = lang || '*';
                        module.intl = true;
                        module.expanded_map = undefined;
                    }

                    if (module.condition && module.condition.test) {
                        conditions[module.name] = module.condition.test.toString();
                        module.condition.test = "{" + module.name + "}";
                    }

                    modules[module.name] = {};
                    if (module.type === 'css') {
                        modules[module.name].type = 'css';
                    }
                    for (i = 0; i < MODULE_META_ENTRIES.length; i += 1) {
                        if (module[MODULE_META_ENTRIES[i]]) {
                            modules[module.name][MODULE_META_ENTRIES[i]] =
                                module[MODULE_META_ENTRIES[i]];
                        }
                    }

                    expanded_modules[module.name] = module;
                    for (i = 0; i < MODULE_META_PRIVATE_ENTRIES.length; i += 1) {
                        module[MODULE_META_PRIVATE_ENTRIES[i]] = undefined;
                    }
                }
            }
        },


        /**
         * Generates the final YUI metadata.
         * @private
         * @method _produceMeta
         * @param {string} name type of YUI metadata to return
         * @param {string} lang which language the metadata should be customized for
         * @param {object} appMetaData gathered YUI metadata for the application
         * @param {object} yuiMetaData gathered YUI metadata for YUI itself
         * @return {string} the requested YUI metadata
         */
        _produceMeta: function(name, lang, appMetaData, yuiMetaData) {
            var token = '',
                path  = '';

            if (lang) {
                token = '"' + lang + '"';
                path  = '_' + lang;
            } else {
                lang = '*';
            }

            // module definition definitions
            return MODULE_TEMPLATES[name]
                .replace('{app-base}', appMetaData.base[lang] || appMetaData.base['*'])
                .replace('{app-resolved}', appMetaData.full[lang] || appMetaData.full['*'])
                .replace('{yui-base}', yuiMetaData.base[lang] || yuiMetaData.base['*'])
                .replace('{yui-resolved}', yuiMetaData.full[lang] || yuiMetaData.full['*'])
                .replace(REGEX_LANG_TOKEN, token)
                .replace(REGEX_LANG_PATH, path);
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
         * @param {boolean} forceYLoader whether to force the use of Y.Loader
         * @return {object} precomputed (and sorted) module dependencies
         */
        _precomputeYUIDependencies: function(lang, env, mojit, modules, required, forceYLoader) {
            var loader,
                m,
                module,
                originalYUAnodejs,
                info,
                warn,
                sortedPaths = {};

            // We don't actually need the full list, just the required modules.
            // YUI.Loader() will do the rest at runtime.
            if (!forceYLoader) {
                for (module in required) {
                    if (required.hasOwnProperty(module) && modules[module]) {
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
            YUI.Env._renderedMods = undefined;

            // Trick the loader into thinking it's -not- running on nodejs.
            // This is the official way to do it.
            originalYUAnodejs = Y.UA.nodejs;
            Y.UA.nodejs = ('server' === env);

            // Use ignoreRegistered here instead of the old `YUI.Env._renderedMods = undefined;` hack
            loader = new Y.Loader({ ignoreRegistered: true });
            // Only override the default if it's required
            if (this.yuiConfig.base) {
                loader.base = this.yuiConfig.base;
            }

            loader.addGroup({modules: modules}, mojit);
            loader.calculate({required: required});

            Y.UA.nodejs = originalYUAnodejs;

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
         * Generates the YUI configuration for the resource.
         * @private
         * @method _makeYUIModuleConfig
         * @param {string} env runtime environment (either `client`, or `server`)
         * @param {object} res the resource metadata
         * @return {object} the YUI configuration for the module
         */
        _makeYUIModuleConfig: function(env, res) {
            var config = {
                requires: (res.yui.meta && res.yui.meta.requires) || []
            };
            if ('client' === env) {
                // using relative path since the loader will do the rest
                config.path = res.url;
            } else {
                config.fullpath = res.source.fs.fullPath;
            }
            return config;
        },


        /**
         * If the resource is a YUI module, augments its metadata with metadata
         * about the YUI module.
         * @private
         * @method _captureYUIModuleDetails
         * @param {object} res resource metadata
         * @param {object} runSandbox if passed, the function in the module
         *      will be called using this parameter as the YUI sandbox
         * @return {nothing}
         */
        _captureYUIModuleDetails: function(res, runSandbox) {
            var file,
                ctx,
                yui = {};
            file = libfs.readFileSync(res.source.fs.fullPath, 'utf8');
            // setting up the fake YUI before executing the file
            contextForRunInContext.YUI = {
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
                    if (runSandbox) {
                        try {
                            fn(runSandbox, yui.name);
                        } catch (e) {
                            Y.log('failed to run javascript file ' + res.source.fs.fullPath + '\n' + e.message, 'error', NAME);
                        }
                    }
                }
            };
            try {
                libvm.runInContext(file, contextForRunInContext, res.source.fs.fullPath);
            } catch (e) {
                yui = null;
                Y.log('failed to parse javascript file ' + res.source.fs.fullPath + '\n' + e.message, 'error', NAME);
            }
            if (yui) {
                res.yui = Y.merge(res.yui || {}, yui);
            }
        }


    });
    Y.namespace('mojito.addons.rs');
    Y.mojito.addons.rs.yui = RSAddonYUI;

}, '0.0.1', { requires: ['plugin', 'oop', 'loader-base', 'mojito-util']});
