/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('M', function(Y) {

/**
 * The M module.
 *
 * @module M
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

            ac.models.MModelFoo.getMessage(function(err, message) {

                if (err) {
                    // handle it!
                }

                ac.done({
                    title: 'Congrats!',
                    message: message + '.'
                });

            });
        
        }

    };

}, '0.0.1', {requires: ['mojito', 'MModelFoo', 'MModelNot', 'MAutoloadNot']});
