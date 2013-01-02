/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('Layout', function(Y, NAME) {

/**
 * The Layout module.
 *
 * @module Layout
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
            console.log('parent req: ' + !!ac.http.getRequest());
            ac.composite.done();
        },

        redirect: function(ac) {
            ac.http.redirect('/layout2/index');
        }

    };

}, '0.0.1', {requires: []});
