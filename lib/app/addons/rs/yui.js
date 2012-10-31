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
        },

        yuiSandbox = require(libpath.join(__dirname, '..', '..', '..', 'yui-sandbox.js')).getYUI(),
        MODULE_META_ENTRIES          = ['requires', 'use', 'optional', 'skinnable', 'after', 'condition'],
        // TODO: revisit this list with @davglass
        MODULE_META_PRIVATE_ENTRIES  = ['after', 'expanded', 'supersedes', 'ext', '_parsed', '_inspected', 'skinCache', 'langCache'],

        REGEX_LANG_TOKEN = /\"\{langToken\}\"/g,
        REGEX_LANG_PATH  = /\{langPath\}/g,
        REGEX_LOCALE     = /\_([a-z]{2}(-[A-Z]{2})?)$/,

        MODULE_TEMPLATES = {
            'loader-app-base':
                'YUI.add("loader-app-base",function(Y){' +
                    'Y.applyConfig({groups:{app:{' +
                        'combine:true,' +
                        'maxURLLength:1024,' +
                        'base:"/static/",' +
                        'comboBase:"/static/combo?",' +
                        'root:"",' +
                        'modules:{app-base}' +
                    '}}});' +
                '},"",{requires:["loader-base"]});',
            'loader-app-full':
                'YUI.add("loader-app-full",function(Y){' +
                    'Y.applyConfig({groups:{app:{' +
                        'combine:true,' +
                        'maxURLLength:1024,' +
                        'base:"/static/",' +
                        'comboBase:"/static/combo?",' +
                        'root:"",' +
                        'modules:{app-full}' +
                    '}}});' +
                '},"",{requires:["loader-base"]});',

            'loader':
                'YUI.add("loader",function(Y){' +
                '},"",{requires:["loader-base","loader-yui3","loader-app-base"]});',

            'loader-lock':
                'YUI.add("loader",function(Y){' +
                    // TODO: we should use YUI.applyConfig() instead of the internal
                    //       YUI.Env API, but that's pending due a bug in YUI:
                    //       http://yuilibrary.com/projects/yui3/ticket/2532854
                    'YUI.Env[Y.version].modules=YUI.Env[Y.version].modules||' +
                    '{yui-base};' +
                '},"",{requires:["loader-base","loader-app-base"]});',

            'loader-full':
                'YUI.add("loader",function(Y){' +
                    // TODO: we should use YUI.applyConfig() instead of the internal
                    //       YUI.Env API, but that's pending due a bug in YUI:
                    //       http://yuilibrary.com/projects/yui3/ticket/2532854
                    'YUI.Env[Y.version].modules=YUI.Env[Y.version].modules||' +
                    '{yui-full};' +
                '},"",{requires:["loader-base","loader-app-full"]});'
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
            this.beforeHostMethod('makeResourceVersions', this.makeResourceVersions, this);
            this.afterHostMethod('resolveResourceVersions', this.resolveResourceVersions, this);
            this.beforeHostMethod('getResourceContent', this.getResourceContent, this);
            this.yuiConfig = config.host.getStaticAppConfig().yui;

            this.langs = {};            // keys are list of languages in the app, values are simply "true"
            this.resContents = {};      // res.id: contents
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
         * Of the languages that exist in the app, finds the closest that
         * matches the requested language.
         * @method getClosestLang
         * @param {string} want the desired language code
         * @return {string} closest matching language code
         */
        getClosestLang: function(want) {
            var p,
                parts,
                test;
            parts = want ? want.split('-') : [];
            for (p = want.length; p > 0; p -= 1) {
                test = parts.slice(0, p).join('-');
                if (this.langs[test]) {
                    return test;
                }
            }
            return '';
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
                lang,
                langExt,
                langs = Object.keys(this.langs),
                res;

            // we always want to make the no-lang version
            if (!this.langs['']) {
                langs.push('');
            }

            res = {
                source: {},
                type: 'yui-loader',
                subtype: 'rollup',
                name: '',
                affinity: 'common',
                selector: '*',
                yui: {
                    name: 'loader'
                }
            };
            res.id = [res.type, res.subtype, res.name].join('-');
            res.source.pkg = store.getAppPkgMeta();
            res.source.fs = store.makeResourceFSMeta(this.appRoot, 'app', '.', 'loader.js', true);
            store.addResourceVersion(res);

            for (l = 0; l < langs.length; l += 1) {
                lang = langs[l];
                langExt = lang ? '_' + lang : '';

                res = {
                    source: {},
                    type: 'yui-loader',
                    subtype: 'app-base',
                    name: lang,
                    affinity: 'common',
                    selector: '*',
                    yui: {
                        name: 'loader-app-base' + langExt
                    }
                };
                res.id = [res.type, res.subtype, res.name].join('-');
                res.source.pkg = store.getAppPkgMeta();
                res.source.fs = store.makeResourceFSMeta(this.appRoot, 'app', '.', 'loader-app-base' + langExt + '.js', true);
                store.addResourceVersion(res);

                res = {
                    source: {},
                    type: 'yui-loader',
                    subtype: 'app-full',
                    name: lang,
                    affinity: 'common',
                    selector: '*',
                    yui: {
                        name: 'loader-app-full' + langExt
                    }
                };
                res.id = [res.type, res.subtype, res.name].join('-');
                res.source.pkg = store.getAppPkgMeta();
                res.source.fs = store.makeResourceFSMeta(this.appRoot, 'app', '.', 'loader-app-full' + langExt + '.js', true);
                store.addResourceVersion(res);

                res = {
                    source: {},
                    type: 'yui-loader',
                    subtype: 'yui-base',
                    name: lang,
                    affinity: 'common',
                    selector: '*',
                    yui: {
                        name: 'loader-lock' + langExt
                    }
                };
                res.id = [res.type, res.subtype, res.name].join('-');
                res.source.pkg = store.getAppPkgMeta();
                res.source.fs = store.makeResourceFSMeta(this.appRoot, 'app', '.', 'loader-lock' + langExt + '.js', true);
                store.addResourceVersion(res);

                res = {
                    source: {},
                    type: 'yui-loader',
                    subtype: 'yui-full',
                    name: lang,
                    affinity: 'common',
                    selector: '*',
                    yui: {
                        name: 'loader-full' + langExt
                    }
                };
                res.id = [res.type, res.subtype, res.name].join('-');
                res.source.pkg = store.getAppPkgMeta();
                res.source.fs = store.makeResourceFSMeta(this.appRoot, 'app', '.', 'loader-full' + langExt + '.js', true);
                store.addResourceVersion(res);
            }
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
            var contents = this.resContents[res.id];
            if (contents) {
                callback(null, new Buffer(contents, 'utf8'), null);
                return new Y.Do.Halt(null, null);
            }
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
                appConfig = store.getAppConfig(),
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
                i;

            // TODO:  inline these calls, and optimize
            mojits = this.getConfigAllMojits('client', {});
            shared = this.getConfigShared('client', {});

            Ysandbox = yuiSandbox({
                fetchCSS: true,
                combine: true,
                base: "/static/combo?",
                comboBase: "/static/combo?",
                root: ""
            }, ((appConfig.yui && appConfig.yui.config) || {}));

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

            this.resContents['yui-loader-rollup-'] = MODULE_TEMPLATES.loader;

            for (i = 0; i < langs.length; i += 1) {
                lang = langs[i] || '';

                this.resContents['yui-loader-app-base-' + lang] =
                    this._produceMeta('loader-app-base', lang || '*', appMetaData, yuiMetaData);

                this.resContents['yui-loader-app-full-' + lang] =
                    this._produceMeta('loader-app-full', lang || '*', appMetaData, yuiMetaData);

                this.resContents['yui-loader-yui-base-' + lang] =
                    this._produceMeta('loader-lock', lang || '*', appMetaData, yuiMetaData);

                this.resContents['yui-loader-yui-full-' + lang] =
                    this._produceMeta('loader-full', lang || '*', appMetaData, yuiMetaData);
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
                        delete module.expanded_map;
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
                        delete module[MODULE_META_PRIVATE_ENTRIES[i]];
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
                .replace('{app-full}', appMetaData.full[lang] || appMetaData.full['*'])
                .replace('{yui-base}', yuiMetaData.base[lang] || yuiMetaData.base['*'])
                .replace('{yui-full}', yuiMetaData.full[lang] || yuiMetaData.full['*'])
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
            delete YUI.Env._renderedMods;

            // Trick the loader into thinking it's -not- running on nodejs.
            // This is the official way to do it.
            originalYUAnodejs = Y.UA.nodejs;
            Y.UA.nodejs = ('server' === env);

            // Use ignoreRegistered here instead of the old `delete YUI.Env._renderedMods` hack
            loader = new Y.Loader({ ignoreRegistered: true });
            // Only override the default if it's required
            if (this.yuiConfig && this.yuiConfig.base) {
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
         * @param {object} runSandbox if passed, the function in the module
         *      will be called using this parameter as the YUI sandbox
         * @return {nothing}
         */
        _captureYUIModuleDetails: function(res, runSandbox) {
            var file,
                ctx,
                yui = {};
            file = libfs.readFileSync(res.source.fs.fullPath, 'utf8');
            ctx = {
                require: require,
                module: require('module'),
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
                        if (runSandbox) {
                            try {
                                fn(runSandbox, yui.name);
                            } catch (e) {
                                Y.log('failed to run javascript file ' + res.source.fs.fullPath + '\n' + e.message, 'error', NAME);
                            }
                        }
                    }
                }
            };
            try {
                libvm.runInNewContext(file, ctx, res.source.fs.fullPath);
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
