/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('i18n_ChildMojitBinderIndex', function(Y, NAME) {

/**
 * The i18n_ChildMojitBinderIndex module.
 *
 * @module i18n_ChildMojitBinderIndex
 */

    /**
     * Constructor for the i18n_ChildMojitBinderIndex class.
     *
     * @class i18n_ChildMojitBinderIndex
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
            var me = this;
            this.node = node;
        }

    };

}, '0.0.1', {requires: ['event-mouseenter', 'mojito-client']});