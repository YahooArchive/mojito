/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/

YUI.add('addon-rs-url', function(Y, NAME) {

    var libfs = require('fs'),
        libpath = require('path');

    function RSAddonUrl() {
        RSAddonUrl.superclass.constructor.apply(this, arguments);
    }
    RSAddonUrl.NS = 'url';
    RSAddonUrl.ATTRS = {};

    Y.extend(RSAddonUrl, Y.Plugin.Base, {

        initializer: function(config) {
            var appConfig;
            this.rs = config.host;
            this.appRoot = config.appRoot;
            this.mojitoRoot = config.mojitoRoot;
            this.URLpaths = {};
            this.afterHostMethod('preloadResourceVersions', this.preloadResourceVersions, this);
            this.onHostEvent('getMojitTypeDetails', this.getMojitTypeDetails, this);

            appConfig = this.rs.getStaticAppConfig();
            this.config = appConfig.staticHandling || {};
            this.config.appName = this.config.appName || libpath.basename(this.appRoot);
            this.config.frameworkName = this.config.frameworkName || 'mojito';
            if (!this.config.hasOwnProperty('prefix')) {
                this.config.prefix = 'static';
            }
            // FUTURE:  deprecate appConfig.assumeRollups
            this.assumeRollups = this.config.assumeRollups || appConfig.assumeRollups;
        },


        destructor: function() {
            // TODO:  needed to break cycle so we don't leak memory?
            this.rs = null;
        },


        preloadResourceVersions: function() {
            var mojits = this.rs.listAllMojits(),
                m,
                mojit,
                mojitRes,
                mojitControllerRess,
                ress,
                r,
                res;

            mojits.push('shared');
            for (m = 0; m < mojits.length; m += 1) {
                mojit = mojits[m];
                mojitRes = this.rs.getResourceVersions({id: 'mojit--' + mojit})[0];

                // Server-only framework mojits like DaliProxy and HTMLFrameMojit
                // should never have URLs associated with them.  This never used
                // to be an issue until we added the "assumeRollups" feature to
                // preload JSON specs for specific mojits during the compile step
                // (`mojito compile json`) for Livestand.
                if ('shared' !== mojit && 'mojito' === mojitRes.source.pkg.name) {
                    mojitControllerRess = this.rs.getResourceVersions({mojit: mojit, id: 'controller--controller'});
                    if (mojitControllerRess.length === 1 &&
                            mojitControllerRess[0].affinity.affinity === 'server') {
                        continue;
                    }
                }

                ress = this.rs.getResourceVersions({mojit: mojit});
                for (r = 0; r < ress.length; r += 1) {
                    res = ress[r];
                    this._calcResourceURL(res, mojitRes);
                }
            }
        },


        getMojitTypeDetails: function(evt) {
            var parts = [];
            if (this.config.prefix) {
                parts.push(this.config.prefix);
            }
            parts.push(evt.args.mojitType);
            evt.mojit.assetsRoot = '/' + parts.join('/') + '/assets';
        },


        _calcResourceURL: function(res, mojitRes) {
            var fs = res.source.fs,
                relativePath = fs.fullPath.substr(fs.rootDir.length + 1),
                urlParts = [],
                rollupParts = [],
                rollupFsPath;

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
                urlParts.push(res.mojit);
                if (res.yui && res.yui.name) {
                    rollupParts.push(res.mojit);
                    rollupParts.push('rollup.client.js');
                    rollupFsPath = libpath.join(mojitRes.source.fs.fullPath, 'rollup.client.js');
                }
            }

            urlParts.push(relativePath);

            if (rollupFsPath && (this.assumeRollups || libpath.existsSync(rollupFsPath))) {
                res.url = '/' + rollupParts.join('/');
                this.URLpaths[res.url] = rollupFsPath;
                fs.rollupPath = rollupFsPath;
            } else {
                res.url = '/' + urlParts.join('/');
                this.URLpaths[res.url] = fs.fullPath;
            }
        }


    });
    Y.namespace('mojito.addons.rs');
    Y.mojito.addons.rs.url = RSAddonUrl;

}, '0.0.1', { requires: ['plugin', 'oop']});
