/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true*/

YUI.add('simpleModel', function (Y, NAME) {

/**
 * The simpleModel module.
 *
 * @module simpleModel
 */

    /**
     * Constructor for the Model class.
     *
     * @class Model
     * @constructor
     */
     Y.namespace('mojito.models')[NAME] = {
        init: function (config) {
            this.config = config;
        },

        /**
         * Method that will be invoked by the mojit controller to obtain data.
         *
         * @param callback {Function} The callback function to call when the
         *        data has been retrieved.
         */
        getData: function (callback) {
            callback({some: 'data'});
        }

    };

}, '0.0.1', {requires: ['mojito']});
