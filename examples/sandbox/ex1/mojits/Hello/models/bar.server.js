/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('HelloModelBar', function(Y, NAME) {

    Y.mojito.models.bar = {

        init: function(cfg) {
            Y.log('init', 'debug', NAME);
        },

        /**
         * Method that will be invoked by the mojit controller to obtain data.
         *
         * @param callback {Function} The callback function to call when the
         *        data has been retrieved.
         */
        getOneBar: function(callback) {
            callback({some:'data'});
        },

        getMessage: function(cb) {
            cb('Hello, from the bar model.');
        }

    };

}, '0.1.0', {requires: ['mojito']});
