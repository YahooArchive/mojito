/*
 * Copyright (c) 2012 Yahoo! Inc. All rights reserved.
 */
YUI.add('top_frameModelFoo', function(Y) {

/**
 * The top_frameModelFoo module.
 *
 * @module top_frame
 */

    /**
     * Constructor for the top_frameModelFoo class.
     *
     * @class top_frameModelFoo
     * @constructor
     */
    Y.mojito.models.top_frameModelFoo = {

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
