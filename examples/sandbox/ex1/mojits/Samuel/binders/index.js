/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('SamuelBinderIndex', function(Y) {

/**
 * The SamuelBinder module.
 *
 * @module SamuelBinder
 */

    var binder = {

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
            this.node = node;
        }

    };

    Y.namespace('mojito.binders.Samuel');
    Y.mojito.binders.Samuel.index = binder;

}, '0.1.0', {requires: ['mojito']});
