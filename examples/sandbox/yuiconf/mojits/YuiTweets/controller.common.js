/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('YuiTweets', function(Y, NAME) {

/**
 * The YuiTweets module.
 *
 * @module YuiTweets
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
        index: function(ac) {
// DOING
            ac.models.get('yuiTweets').getTweets(function(err, yuiTweets) {
                ac.done({tweets: yuiTweets});
            });
        }

    };

}, '0.0.1', {requires: [
    'mojito',
    'mojito-models-addon'
]});
