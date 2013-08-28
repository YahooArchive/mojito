/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('i18n_ParentMojitBinderIndex', function(Y, NAME) {

/**
 * The i18n_ParentMojitBinderIndex module.
 *
 * @module i18n_ParentMojitBinderIndex
 */

    /**
     * Constructor for the i18n_ParentMojitBinderIndex class.
     *
     * @class i18n_ParentMojitBinderIndex
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
            /**
             * Example code for the bind method:
             *
             * node.all('dt').on('mouseenter', function(evt) {
             *   var dd = '#dd_' + evt.target.get('text');
             *   me.node.one(dd).addClass('sel');
             *
             * });
             * node.all('dt').on('mouseleave', function(evt) {
             *   
             *   var dd = '#dd_' + evt.target.get('text');
             *   me.node.one(dd).removeClass('sel');
             *
             * });
             */
        }

    };

}, '0.0.1', {requires: ['event-mouseenter', 'mojito-client']});
