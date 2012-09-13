/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('GreenChild', function(Y, NAME) {

/**
 * The GreenChild module.
 *
 * @module GreenChild
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.namespace('mojito.controllers')[NAME] = {

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
            Y.log(this.spec);
            ac.done({id: ac.config.get('id')});
        }

    };

}, '0.0.1', {requires: ['mojito']});
