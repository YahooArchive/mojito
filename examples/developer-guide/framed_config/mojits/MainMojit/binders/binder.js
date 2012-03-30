/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('MainMojitBinder', function(Y) {

/**
 * The MainMojitBinder module.
 *
 * @module MainMojitBinder
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
    function Binder(mojitProxy) {
        this.mojitProxy = mojitProxy;
    }

    Binder.prototype = {

        /**
         * Binder initialization method, invoked after all binders on the page
         * have been constructed.
         */
        init: function() {
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

    Y.mojito.registerEventBinder('MainMojit', Binder);

}, '0.0.1', {requires: ['mojito']});
