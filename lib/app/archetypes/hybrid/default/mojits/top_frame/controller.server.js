/*
 * Copyright (c) 2012 Yahoo! Inc. All rights reserved.
 */
YUI.add('top_frame', function(Y) {

/**
 * The top_frame module.
 *
 * @module top_frame
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.mojito.controller = {
        init: function(config) {
          this.config = config;
        },

        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The ActionContext that provides access
         *        to the Mojito API.
         */
        index: function(ac) {
            ac.done({});
        }

    };

}, '0.0.1', {requires: ['mojito']});
