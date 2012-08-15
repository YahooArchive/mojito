/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('BlueChild', function(Y) {

/**
 * The BlueChild module.
 *
 * @module BlueChild
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.mojito.controller = {

        init: function(spec) {
            this.spec = spec;
        },

        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The action context that provides access
         *        to the Mojito API.
         */
        index: function(ac) {
            ac.done({id: ac.config.get('id')});
        }

    };

}, '0.0.1', {requires: []});
