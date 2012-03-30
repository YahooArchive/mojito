/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('MyServer', function(Y) {

/**
 * The MyServer module.
 *
 * @module MyServer
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
            console.log('child req: ' + !!ac.http.getRequest());
            ac.done();
        }

    };

}, '0.0.1', {requires: ['mojito-http-addon']});
