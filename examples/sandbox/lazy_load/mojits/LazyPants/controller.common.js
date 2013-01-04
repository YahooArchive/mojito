/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('LazyPants', function(Y, NAME) {

/**
 * The LazyPants module.
 *
 * @module LazyPants
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
         * @param ac {Object} The ActionContext that provides access
         *        to the Mojito API.
         */
        hello: function(ac) {
            ac.done({time: new Date()});
        },

        index: function(ac) {
            ac.done();
        }

    };

}, '0.0.1', {requires: ['mojito']});
