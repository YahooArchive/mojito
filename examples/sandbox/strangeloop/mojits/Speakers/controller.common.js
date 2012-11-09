/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('Speakers', function(Y, NAME) {

/**
 * The Speakers module.
 *
 * @module Speakers
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
// DOING
            ac.models.get('strangeloop').getSpeakerData(function(err, speakerData) {
                ac.done({speakers: speakerData});
            });
        }

    };

}, '0.0.1', {requires: [
    'mojito',
    'mojito-models-addon',
    'DOING'
]});
