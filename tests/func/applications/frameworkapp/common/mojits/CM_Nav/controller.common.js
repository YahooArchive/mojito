/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('CM_Nav', function(Y, NAME) {

/**
 * The CM_Nav module.
 *
 * @module CM_Nav
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
			ac.done({title:'Navigation'});
        }

    };

}, '0.0.1', {requires: ['mojito']});
