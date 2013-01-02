/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('SpeakersBinderIndex', function(Y, NAME) {

/**
 * The SpeakersBinderIndex module.
 *
 * @module SpeakersBinderIndex
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
        init: function(mojitProxy) {
            this.mojitProxy = mojitProxy;
        },

        /**
         * The binder method, invoked to allow the mojit to attach DOM event
         * handlers.
         *
         * @param node {Node} The DOM node to which this mojit is attached.
         */
        bind: function(node) {
            var mp = this.mojitProxy,
                speakerDivs;
            this.node = node;
            speakerDivs = node.all('.speaker');

            speakerDivs.on('mouseover', function(evt) {
                var speaker = evt.currentTarget,
                    name = speaker.one('.screenName').getContent();
                speaker.addClass('highlighted');
                mp.broadcast('speaker-highlighted', {speaker: name});
            });
            speakerDivs.on('mouseout', function(evt) {
                evt.currentTarget.removeClass('highlighted');
            });
        }

    };

}, '0.0.1', {requires: ['mojito-client']});
