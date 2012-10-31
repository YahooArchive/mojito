/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, nomen:true, node:true*/
/*global YUI*/


/**
 * @module ResourceStoreAddon
 */

/**
 * RS addon that computes AC addon dependencies at startup to be attached
 * at runtime.
 *
 * @class RSAddonDispatchHelper
 * @extension ResourceStore.server
 */
YUI.add('addon-rs-dispatch-helper', function (Y, NAME) {

    'use strict';

    var libpath = require('path');

    function RSAddonDispatchHelper() {
        RSAddonDispatchHelper.superclass.constructor.apply(this, arguments);
    }


    RSAddonDispatchHelper.NS = 'dispatch-helper';


    Y.extend(RSAddonDispatchHelper, Y.Plugin.Base, {


        initializer: function (config) {
            this.acAddons = {}; // env: poslKey: mojit: details
            this.onHostEvent('mojitResourcesResolved', this.onMojitResourcesResolved, this);
            this.onHostEvent('getMojitTypeDetails', this.onGetMojitTypeDetails, this);
        },


        /**
         * This is called when the ResourceStore fires this event.
         * It augments the mojit type details with the precomputed YUI module
         * dependencies.
         * @method onGetMojitTypeDetails
         * @param {object} evt The fired event.
         * @return {nothing}
         */
        onGetMojitTypeDetails: function (evt) {
            var dest = evt.mojit,
                env = evt.args.env,
                ctx = evt.args.ctx,
                posl = evt.args.posl,
                poslKey = JSON.stringify(posl),
                mojitType = evt.args.mojitType;
            dest.acAddons = {};
            if (this.acAddons[env] && this.acAddons[env][poslKey] && this.acAddons[env][poslKey][mojitType]) {
                dest.acAddons = this.acAddons[env][poslKey][mojitType];
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
        onMojitResourcesResolved: function (evt) {
            var store = this.get('host'),
                env = evt.env,
                posl = evt.posl,
                poslKey = JSON.stringify(posl),
                mojitType = evt.mojit,
                r,
                res,
                ress = evt.ress,
                controllerYuiName,
                modules = {},
                required = {},
                sorted,
                yuiName,
                addonName,
                acAddonNames = {};   // YUI module: addon name

            if (!evt.ress) {
                return;
            }

            if ('shared' === mojitType) {
                return;
            }

            for (r = 0; r < ress.length; r += 1) {
                res = ress[r];
                if (!res.yui || !res.yui.name) {
                    continue;
                }
                if ('controller' === res.type) {
                    controllerYuiName = res.yui.name;
                    modules[res.yui.name] = this.get('host').yui._makeYUIModuleConfig(env, res);
                }
                if ('addon' === res.type && 'ac' === res.subtype) {
                    modules[res.yui.name] = this.get('host').yui._makeYUIModuleConfig(env, res);
                    // HACK/TODO: we are assuming the name of the filename will be
                    // the same as the addon namespace. This is a bold assumption
                    // and we will do the right thing eventually.
                    acAddonNames[res.yui.name] = libpath.basename(res.name);
                }
            }

            if (!controllerYuiName) {
                // It's not an error if a mojit is missing a controller, since
                // some mojits only run on the server side (or only on the
                // client side).
                return;
            }

            // setting up the proper namespace for the cache.
            this.acAddons[env] = this.acAddons[env] || {};
            this.acAddons[env][poslKey] = this.acAddons[env][poslKey] || {};
            // TODO: should we worry if this.acAddons[env][poslKey][mojitType] is set
            //       at this point? It should never happen.
            this.acAddons[env][poslKey][mojitType] = [];

            required[controllerYuiName] = true;
            // the language doesn't matter for this
            sorted = store.yui._precomputeYUIDependencies('en', env, mojitType, modules, required, true);
            for (yuiName in sorted.paths) {
                if (sorted.paths.hasOwnProperty(yuiName)) {
                    addonName = acAddonNames[yuiName];
                    if (addonName) {
                        this.acAddons[env][poslKey][mojitType].push(addonName);
                    }
                }
            }
        }

    });

    Y.namespace('mojito.addons.rs')['dispatch-helper'] = RSAddonDispatchHelper;

}, '0.0.1', { requires: [
    'addon-rs-yui',
    'plugin',
    'oop'
]});
