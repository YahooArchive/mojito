/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*global YUI*/

/**
 * @module ActionContextAddon
 */
YUI.add('mojito-models-addon', function (Y, NAME) {

    'use strict';

    // TODO:
    // - update tests
    // - update fixtures
    // - update documentation
    // - update examples

    /**
     * <strong>Access point:</strong> <em>ac.models.*</em>
     * Addon that provides access to the models collection
     * @class Models.common
     */
    function Addon(command) {

        var models = {};

        /**
         * Gets model instance
         * @method get
         * @param {string} modelName The name of the model.
         * @return {object} model instance, or null.
         */
        // this is an experiment where "get" method uses the closure
        // rather than be directly attached, to avoid storing
        // a instance.config or models reference in the addon instance.
        this.get = Y.bind(function (config, modelName) {

            var modelInstance;

            // instantanting the model once during the lifetime of
            // the ac object, this acts like an internal cache.
            if (Y.mojito.models[modelName] && !models[modelName]) {

                // We have to heir() otherwise this.something in the model
                // will pollute other instances of the model.
                modelInstance = Y.mojito.util.heir(Y.mojito.models[modelName]);

                if (Y.Lang.isFunction(modelInstance.init)) {
                    // NOTE that we use the same config here that we use to
                    // config the controller
                    modelInstance.init(config);
                }
                models[modelName] = modelInstance;

            }

            // returning from cache if exists
            return models[modelName];

        },  this,
            command.instance.config /* config (first arg) */
            );

    }

    Addon.prototype = {

        namespace: 'models'

    };

    Y.namespace('mojito.addons.ac').models = Addon;

}, '0.1.0', {requires: [
    'mojito'
]});
