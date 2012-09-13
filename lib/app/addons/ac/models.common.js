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

    /**
     * <strong>Access point:</strong> <em>ac.models.*</em>
     * Addon that provides access to the models collection
     * @class Models.common
     */
    function Addon(command) {

        var instance = command.instance,
            config   = instance.config;

        // making every model accessible through this addon
        Y.Object.each(Y.mojito.models, function (model, modelName) {

            // TODO: should we care about models that are not listed by
            //       RS under instance.models? Are global models listed
            //       there?
            if (instance.models && instance.models[modelName]) {

                // TODO: Why? There's no particular reason to inherit here.
                // @caridy: we have to, otherwise this.something in the model
                //          instance can be polluted.
                var modelInstance = Y.mojito.util.heir(model);

                if (Y.Lang.isFunction(modelInstance.init)) {
                    // NOTE that we use the same config here that we use to
                    // config the controller
                    modelInstance.init(config);
                }
                this[modelName] = modelInstance;
            }
        }, this);
    }


    Addon.prototype = {

        namespace: 'models'

    };

    Y.namespace('mojito.addons.ac').models = Addon;

}, '0.1.0', {requires: [
    'mojito'
]});
