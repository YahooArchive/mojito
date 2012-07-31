/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/


/**
 * @module ResourceStoreAddon
 */

/**
 * @class RSAddonUrl
 * @extension ResourceStore.server
 */
YUI.add('addon-rs-url', function(Y, NAME) {

    var libfs = require('fs'),
        libpath = require('path');

    function RSAddonUrl() {
        RSAddonUrl.superclass.constructor.apply(this, arguments);
    }
    RSAddonUrl.NS = 'url';

    Y.extend(RSAddonUrl, Y.Plugin.Base, {

        /**
         * This methods is part of Y.Plugin.Base.  See documentation for that for details.
         * @method initializer
         * @param {object} config Configuration object as per Y.Plugin.Base
         * @return {nothing}
         */
        initializer: function(config) {
            var appConfig;
            this.appRoot = config.appRoot;
            this.mojitoRoot = config.mojitoRoot;
            this.afterHostMethod('preloadResourceVersions', this.preloadResourceVersions, this);
            this.onHostEvent('getMojitTypeDetails', this.onGetMojitTypeDetails, this);

            appConfig = config.host.getStaticAppConfig();
            this.config = appConfig.staticHandling || {};
            this.config.appName = this.config.appName || libpath.basename(this.appRoot);
            this.config.frameworkName = this.config.frameworkName || 'mojito';
            if (!this.config.hasOwnProperty('prefix')) {
                this.config.prefix = 'static';
            }
            // FUTURE:  deprecate appConfig.assumeRollups
            this.assumeRollups = this.config.assumeRollups || appConfig.assumeRollups;
        },


        /**
         * Using AOP, this is called after the ResourceStore's version.
         * It computes the static handler URL for all resources in all the
         * mojits (as well as the mojit itself).
         * @method preloadResourceVersions
         * @return {nothing}
         */
        preloadResourceVersions: function() {
            var store = this.get('host'),
                mojits,
                m,
                mojit,
                mojitRes,
                mojitControllerRess,
                packageJson,
                mojitIsPublic,
                ress,
                r,
                res,
                skip;

            mojits = store.listAllMojits();
            mojits.push('shared');
            for (m = 0; m < mojits.length; m += 1) {
                mojit = mojits[m];
                mojitRes = store.getResourceVersions({id: 'mojit--' + mojit})[0];
                if (mojitRes) {
                    this._calcResourceURL(mojitRes, mojitRes);
                }

                // Server-only framework mojits like DaliProxy and HTMLFrameMojit
                // should never have URLs associated with them.  This never used
                // to be an issue until we added the "assumeRollups" feature to
                // preload JSON specs for specific mojits during the compile step
                // (`mojito compile json`) for Livestand.
                if ('shared' !== mojit && 'mojito' === mojitRes.source.pkg.name) {
                    mojitControllerRess = store.getResourceVersions({mojit: mojit, id: 'controller--controller'});
                    if (mojitControllerRess.length === 1 &&
                            mojitControllerRess[0].affinity.affinity === 'server') {
                        continue;
                    }
                }

                mojitIsPublic = false;
                if (mojitRes) {
                    packageJson = libpath.join(mojitRes.source.fs.fullPath, 'package.json');
                    packageJson = store.config.readConfigJSON(packageJson);
                    if ('public' === (packageJson.yahoo &&
                                      packageJson.yahoo.mojito &&
                                      packageJson.yahoo.mojito['package'])) {
                        mojitIsPublic = true;
                    }
                }

                ress = store.getResourceVersions({mojit: mojit});
                for (r = 0; r < ress.length; r += 1) {
                    res = ress[r];

                    skip = false;
                    if ('config' === res.type) {
                        skip = true;
                    }

                    // This is mainly used during `mojito build html5app`.
                    // In that situation, the user mainly doesn't want to
                    // publish each mojit's package.json.  However, Livestand
                    // did need to, so this feature allowed them to opt-in.
                    if ('config--package' === res.id && mojitIsPublic) {
                        skip = false;
                    }

                    if (skip) {
                        continue;
                    }

                    this._calcResourceURL(res, mojitRes);
                }
            }
        },


        /**
         * This is called when the ResourceStore fires this event.
         * It calculates the `assetsRoot` for the mojit.
         * @method onGetMojitTypeDetails
         * @param {object} evt The fired event
         * @return {nothing}
         */
        onGetMojitTypeDetails: function(evt) {
            var ress = this.get('host').getResources(evt.args.env, evt.args.ctx, {type: 'mojit', name: evt.args.mojitType});
            evt.mojit.assetsRoot = ress[0].url + '/assets';
        },


        /**
         * Calculates the static handler URL for the resource.
         * @private
         * @method _calcResourceURL
         * @param {object} res the resource for which to calculate the URL
         * @param {object} mojitRes the resource for the mojit
         * @return {nothing}
         */
        _calcResourceURL: function(res, mojitRes) {
            var fs = res.source.fs,
                relativePath = fs.fullPath.substr(fs.rootDir.length + 1),
                urlParts = [],
                rollupParts = [],
                rollupFsPath;

            // Don't clobber a URL calculated by another RS addon.
            if (res.hasOwnProperty('url')) {
                return;
            }

            if (this.config.prefix) {
                urlParts.push(this.config.prefix);
                rollupParts.push(this.config.prefix);
            }

            if ('shared' === res.mojit) {
                if ('mojito' === res.source.pkg.name) {
                    urlParts.push(this.config.frameworkName);
                } else {
                    urlParts.push(this.config.appName);
                }
                // fw resources are also put into the app-level rollup
                if (res.yui && res.yui.name) {
                    rollupParts.push(this.config.appName);
                    rollupParts.push('rollup.client.js');
                    rollupFsPath = libpath.join(this.appRoot, 'rollup.client.js');
                }
            } else {
                if ('mojit' === res.type) {
                    urlParts.push(res.name);
                } else {
                    urlParts.push(res.mojit);
                }
                if (res.yui && res.yui.name) {
                    rollupParts.push(res.mojit);
                    rollupParts.push('rollup.client.js');
                    rollupFsPath = libpath.join(mojitRes.source.fs.fullPath, 'rollup.client.js');
                }
            }

            if ('mojit' === res.type) {
                if ('shared' !== res.name) {
                    res.url = '/' + urlParts.join('/');
                }
                return;
            }

            urlParts.push(relativePath);

            if (rollupFsPath && (this.assumeRollups || libpath.existsSync(rollupFsPath))) {
                res.url = '/' + rollupParts.join('/');
                fs.rollupPath = rollupFsPath;
            } else {
                res.url = '/' + urlParts.join('/');
            }
        }


    });
    Y.namespace('mojito.addons.rs');
    Y.mojito.addons.rs.url = RSAddonUrl;

}, '0.0.1', { requires: ['plugin', 'oop']});
