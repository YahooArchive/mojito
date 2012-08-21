/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('SimpleRoute2', function(Y) {

/**
 * The SimpleRoute2 module.
 *
 * @module SimpleRoute2
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
        index: function(actionContext) {
            var config = actionContext.config.get();
            var type = actionContext.type;
            var id = config.id;
            //actionContext.http.setHeader('content-type', 'text/html');
            actionContext.done({displaytext: 'This is another simple mojit for testing routing - ' + type + " (" + id + ")"});
        }

    };

}, '0.0.1', {requires: ['mojito-http-addon']});
