/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('RedChild', function(Y, NAME) {

/**
 * The RedChild module.
 *
 * @module RedChild
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.namespace('mojito.controllers')[NAME] = {

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

}, '0.0.1', {requires: ['mojito', 'mojito-config-addon']});
