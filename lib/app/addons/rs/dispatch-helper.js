/*
 * Copyright (c) 2012-2014, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint plusplus: true */
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
            this.modules = {}; // Controllers and ac addons.
            this.beforeHostMethod('addResourceVersion', this.addResourceVersion, this);
            this.onHostEvent('resolveMojitDetails', this.onResolveMojitDetails, this);
        },

        /**
         * Using AOP, this is called before the ResourceStore's version, in order
         * to keep track of all the controllers and AC addons. These modules are then
         * used by onResolveMojitDetails in order to precompute list of AC addons for
         * a mojit's controller.
         * @method addResourceVersion
         * @param {object} res resource version metadata
         * @return {nothing}
         */
        addResourceVersion: function (res) {
            if (res.type === 'controller' || (res.type === 'addon' && res.subtype === 'ac')) {
                // We only care about controllers and AC addons since a mojit's controller's addons
                // should be derived from its addons requirements, recursively including the addons of
                // the controllers and addons it requires.

                // Do not overwrite a previous module with the same name; this ensures that
                // if there are duplicate modules, only the shallowest is considered.
                if (!this.modules[res.yui.name]) {
                    this.modules[res.yui.name] = res;
                }
            }
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
            var self = this,
                store = this.get('host'),
                env = evt.args.env,
                mojitType = evt.args.type,
                details = evt.mojitDetails,
                addonName,
                acAddonNames = evt.acAddonNames;

            if ('shared' === mojitType) {
                return;
            }

            if (!details.controller) {
                // It's not an error if a mojit is missing a controller, since
                // some mojits only run on the server side (or only on the
                // client side).
                return;
            }

            details.acAddons = [];
            (function getRequiredAddons(requires, seen) {
                var r,
                    module;
                for (r = 0; r < requires.length; r++) {
                    module = requires[r];
                    if (seen[module] || !self.modules[module] ||
                            (self.modules[module].affinity.affinity !== env &&
                                self.modules[module].affinity.affinity !== 'common')) {
                        continue;
                    }
                    seen[module] = true;

                    getRequiredAddons(self.modules[module].yui.meta.requires, seen);
                    if (acAddonNames[module]) {
                        details.acAddons.push(acAddonNames[module]);
                    }
                }
            }(self.modules[details.controller].yui.meta.requires, {}));
        }

    });

    Y.namespace('mojito.addons.rs')['dispatch-helper'] = RSAddonDispatchHelper;

}, '0.0.1', { requires: [
    'addon-rs-yui',
    'plugin',
    'oop'
]});