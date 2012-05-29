/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('addon-rs-routes', function(Y, NAME) {

    var libpath = require('path'),
        libycb = require(libpath.join(__dirname, '../../../libs/ycb'));

    function RSAddonRoutes() {
        RSAddonRoutes.superclass.constructor.apply(this, arguments);
    }
    RSAddonRoutes.NS = 'routes';
    RSAddonRoutes.DEPS = ['config'];
    RSAddonRoutes.ATTRS = {};

    Y.extend(RSAddonRoutes, Y.Plugin.Base, {

        initializer: function(config) {
            this.rs = config.host;
            this.appRoot = config.appRoot;
        },


        destructor: function() {
            // TODO:  needed to break cycle so we don't leak memory?
            this.rs = null;
        },


        read: function(env, ctx, cb) {
            ctx.runtime = env;
            var appConfig = this.rs.getAppConfig(ctx),
                routesFiles = appConfig.routesFiles,
                p,
                path,
                fixedPaths = {},
                out = {},
                ress,
                r,
                res,
                path,
                routes;

            for (p = 0; p < routesFiles.length; p += 1) {
                path = routesFiles[p];
                // relative paths are relative to the application
                if ('/' !== path.charAt(1)) {
                    path = libpath.join(this.appRoot, path);
                }
                fixedPaths[path] = true;
            }

            ress = this.rs.getResources(env, ctx, {type:'config'});
            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                if (fixedPaths[res.source.fs.fullPath]) {
                    routes = this.rs.config.readConfigYCB(res.source.fs.fullPath, ctx);
                    out = Y.merge(out, routes);
                }
            }

            cb(null, out);
        }


    });
    Y.namespace('mojito.addons.rs');
    Y.mojito.addons.rs.routes = RSAddonRoutes;

}, '0.0.1', { requires: ['plugin', 'oop']});
