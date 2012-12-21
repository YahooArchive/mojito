/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('ContainerModelFoo', function(Y) {

/**
 * The ContainerModelFoo module.
 *
 * @module Container
 */

    /**
     * Constructor for the ContainerModelFoo class.
     *
     * @class ContainerModelFoo
     * @constructor
     */
    Y.mojito.models.ContainerModelFoo = {

        init: function(config) {
            this.config = config;
        },

        /**
         * Method that will be invoked by the mojit controller to obtain data.
         *
         * @param callback {Function} The callback function to call when the
         *        data has been retrieved.
         */
        getData: function(callback) {
            callback({some:'data'});
        }

    };

}, '0.0.1', {requires: []});
