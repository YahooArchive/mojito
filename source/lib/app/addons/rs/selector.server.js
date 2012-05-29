/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('addon-rs-selector', function(Y, NAME) {

    var libpath = require('path'),
        libycb = require(libpath.join(__dirname, '../../../libs/ycb'));

    function RSAddonSelector() {
        RSAddonSelector.superclass.constructor.apply(this, arguments);
    }
    RSAddonSelector.NS = 'selector';
    RSAddonSelector.DEPS = ['config'];
    RSAddonSelector.ATTRS = {};

    Y.extend(RSAddonSelector, Y.Plugin.Base, {

        initializer: function(config) {
            var dims,
                json;
            this.rs = config.host;
            this.appRoot = config.appRoot;
            this.mojitoRoot = config.mojitoRoot;

            dims = this.rs.config.getDimensions();
            json = this.rs.config.readConfigJSON(libpath.join(this.appRoot, 'application.json'));
            json = dims.concat(json);
            // TODO:  use rs.config for this too
            this._appConfigYCB = new libycb.Ycb(json);
        },


        destructor: function() {
            // TODO:  needed to break cycle so we don't leak memory?
            this.rs = null;
        },


        getListFromContext: function(ctx) {
            var sels = ['*'];
            var p, part, parts;
            // TODO:  use rs.config for this too
            parts = this._appConfigYCB.readNoMerge(ctx, {});
            for (p = 0; p < parts.length; p++) {
                part = parts[p];
                if (part.selector) {
                    sels.unshift(part.selector);
                }
            }
            return sels;
        }


    });
    Y.namespace('mojito.addons.rs');
    Y.mojito.addons.rs.selector = RSAddonSelector;

}, '0.0.1', { requires: ['plugin', 'oop']});
