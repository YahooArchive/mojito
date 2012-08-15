/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('GlobalMojit', function(Y) {

/**
 * The GlobalMojit module.
 *
 * @module GlobalMojit
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
         * @param ac {Object} The action context that provides access
         *        to the Mojito API.
         */
        index: function(ac) {
            ac.done('Mojito is working.');
        }

    };

}, '0.0.1', {requires: []});
