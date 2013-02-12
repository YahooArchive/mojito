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
            this.onHostEvent('resolveMojitDetails', this.onResolveMojitDetails, this);
        },


        /**
         * This is called when the ResourceStore fires this event.
         * It precomputes the list of AC addons used by the mojit's controller,
         * to be used later during onGetMojitTypeDetails.
         * @method onResolveMojitDetails
         * @param {object} evt The fired event
         * @return {nothing}
         */
        onResolveMojitDetails: function (evt) {
            var store = this.get('host'),
                env = evt.args.env,
                mojitType = evt.args.type,
                r,
                res,
                ress = evt.args.ress,
                details = evt.mojitDetails,
                modules = {},
                required = {},
                sorted,
                yuiName,
                addonName,
                acAddonNames = {};

            if (!evt.args.ress) {
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
                    modules[res.yui.name] = store.yui._makeYUIModuleConfig(env, res);
                }
                if ('addon' === res.type && 'ac' === res.subtype) {
                    modules[res.yui.name] = store.yui._makeYUIModuleConfig(env, res);
                    // HACK/TODO: we are assuming the name of the filename will be
                    // the same as the addon namespace. This is a bold assumption
                    // and we will do the right thing eventually.
                    acAddonNames[res.yui.name] = libpath.basename(res.name);
                }
            }

            if (!details.controller) {
                // It's not an error if a mojit is missing a controller, since
                // some mojits only run on the server side (or only on the
                // client side).
                return;
            }

            required[details.controller] = true;
            // the language doesn't matter for this
            details.acAddons = [];
            sorted = store.yui._precomputeYUIDependencies('en', env, mojitType, modules, required, true);
            for (yuiName in sorted.paths) {
                if (sorted.paths.hasOwnProperty(yuiName)) {
                    addonName = acAddonNames[yuiName];
                    if (addonName) {
                        details.acAddons.push(addonName);
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
