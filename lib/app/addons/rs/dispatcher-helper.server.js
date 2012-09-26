/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, nomen:true*/
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

    function RSAddonDispatchHelper() {
        RSAddonDispatchHelper.superclass.constructor.apply(this, arguments);
    }


    RSAddonDispatchHelper.NS = 'dispatch-helper';


    Y.extend(RSAddonDispatchHelper, Y.Plugin.Base, {


        initializer: function (config) {
            this.addons = {}; // env: poslKey: mojit: details
            this.onHostEvent('mojitResourcesResolved', this.onMojitResourcesResolved, this);
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

            if (this.addons[env] && this.addons[env][poslKey]) {
                dest.addons = this.addons[env][poslKey][mojitType];
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
            var my = this,
                env = evt.env,
                posl = evt.posl,
                poslKey = JSON.stringify(posl),
                mojitType = evt.mojit,
                ress = evt.ress,
                controller,
                res,
                i;

            if ('server' !== evt.env) {
                return;
            }

            if (!evt.ress) {
                return;
            }

            if ('shared' === mojitType) {
                return;
            }

            for (i = 0; i < ress.length; i += 1) {
                res = ress[i];
                // console.log(res);
                if (!res.yui || !res.yui.name) {
                    continue;
                }

                // TODO: why can't we do the client affinity as well?
                if ('client' === res.affinity.affinity) {
                    continue;
                }

                if ('controller' === res.type) {
                    controller = res.yui.name;
                }
            }

            if (!controller) {
                Y.log('Missing controller for mojit ' + evt.mojit, 'error', NAME);
                return;
            }

            // setting up the proper namespace for the cache.
            this.addons[env] = this.addons[env] || {};
            this.addons[env][poslKey] = this.addons[env][poslKey] || {};

            // requiring controller, as a result all the required addons
            // will be attached in the right order.
            YUI({
                useSync: true
            }).use(controller, 'mojito-output-adapter-addon', 'oop', function (YY) {

                // caching the computed list of addon names for the current controller
                my.addons[env][poslKey][mojitType] = Y.Object.keys(YY.namespace('mojito.addons.ac'));

            });

        }

    });

    Y.namespace('mojito.addons.rs')['dispatch-helper'] = RSAddonDispatchHelper;

}, '0.0.1', { requires: [
    'plugin',
    'oop'
]});