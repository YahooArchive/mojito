/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('ContainerBinderIndex', function(Y, NAME) {

/**
 * The ContainerBinderIndex module.
 *
 * @module ContainerBinderIndex
 */

    /**
     * Constructor for the Binder class.
     *
     * @param mojitProxy {Object} The proxy to allow the binder to interact
     *        with its owning mojit.
     *
     * @class Binder
     * @constructor
     */
    Y.namespace('mojito.binders')[NAME] = {

        /**
         * Binder initialization method, invoked after all binders on the page
         * have been constructed.
         */
        init: function(mp) {
            mp.listen('speaker-highlighted', function(evt) {
                mp.broadcast('show-tweets', {
                    screenName: evt.data.speaker
                });
            });
        }

    };

}, '0.0.1', {requires: ['mojito-client']});
