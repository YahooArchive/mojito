/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('LazyPantsModelFoo', function(Y) {

/**
 * The LazyPantsModelFoo module.
 *
 * @module LazyPants
 */

    /**
     * Constructor for the LazyPantsModelFoo class.
     *
     * @class LazyPantsModelFoo
     * @constructor
     */
    Y.mojito.models.LazyPantsModelFoo = {

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
