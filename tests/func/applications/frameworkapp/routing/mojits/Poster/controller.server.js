/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('Poster', function(Y) {

/**
 * The Poster module.
 *
 * @module Poster
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
        	//ac.http.setHeader('content-type', 'text/html');
            ac.done();
        }

    };

}, '0.0.1', {requires: ['mojito-http-addon']});
