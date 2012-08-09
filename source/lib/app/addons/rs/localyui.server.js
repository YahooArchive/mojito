/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/


// ********************************************************************
// TEMPORARY -- as part of the YUI App Framework integrated environment
// ********************************************************************


YUI.add('addon-rs-localyui', function(Y, NAME) {

    var libfs = require('fs'),
        libpath = require('path'),
        libvm = require('vm'),
        MODULE_SUBDIRS = {
            autoload: true,
            tests: true,
            yui_modules: true
        };

    function RSAddonLocalYUI() {
        RSAddonLocalYUI.superclass.constructor.apply(this, arguments);
    }
    RSAddonLocalYUI.NS = 'localyui';

    Y.extend(RSAddonLocalYUI, Y.Plugin.Base, {

        initializer: function(config) {
            this.mojitoRoot = config.mojitoRoot;
            this.afterHostMethod('getAppConfig', this.getAppConfig, this);
        },


        getAppConfig: function(ctx) {
            var config = Y.clone(Y.Do.currentRetVal, 1);
            config.middleware = config.middleware || [];
            config.middleware = config.middleware.concat([
                'mojito-handler-static',
                'mojito-parser-body',
                'mojito-parser-cookies',
                'mojito-contextualizer',
                'mojito-handler-tunnel',
                'mojito-router',
                'mojito-handler-dispatcher',
                'mojito-handler-localyui'
            ]);
            config.yui = config.yui || {};
            config.yui.config = config.yui.config || {};
            config.yui.config.comboBase = '/yui/combo/yui3?';
            config.yui.config.combine = true;
            config.yui.config.root = 'build/';
            return new Y.Do.AlterReturn(null, config);
        }


    });
    Y.namespace('mojito.addons.rs');
    Y.mojito.addons.rs.localyui = RSAddonLocalYUI;

}, '0.0.1', { requires: ['event-custom']});
