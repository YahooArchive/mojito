YUI.add('MainBinderIndex', function(Y, NAME) {

/**
 * The MainBinderIndex module.
 *
 * @module MainBinderIndex
 */

    /**
     * Constructor for the MainBinderIndex class.
     *
     * @class MainBinderIndex
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
            var self = this;
            self.node = node;
            self.node.one('#lazyloadrpcButton').on('click', function() {
                self.mojitProxy.invoke('lazyloadrpc', {rpc: true}, 
                    function(err, result) {
                        if (err || result.indexOf('Error') >= 0) {
                            Y.Node.one('#LazyLoadRPCResult').set('innerHTML', 'lazy load failed:' + err);
                        } else {
                            Y.Node.one('#LazyLoadRPCResult').set('innerHTML', 'lazy load succeeded: ' + self.mojitProxy.data.get('mydata'));
                        }
                });
            }, this);
        }

    };

}, '0.0.1', {requires: ['event-mouseenter', 'mojito-client']});
