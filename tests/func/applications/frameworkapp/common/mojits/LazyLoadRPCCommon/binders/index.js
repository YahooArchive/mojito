YUI.add('LazyLoadRPCCommonBinderIndex', function(Y, NAME) {

/**
 * The LazyLoadRPCCommonBinderIndex module.
 *
 * @module LazyLoadRPCCommonBinderIndex
 */

    /**
     * Constructor for the LazyLoadRPCCommonBinderIndex class.
     *
     * @class LazyLoadRPCCommonBinderIndex
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
            var self = this,
                count = 0;
            self.node = node;
            self.node.one('#lazyloadrpccommonButton').on('click', function() {
                self.mojitProxy.data.on('change', function(){
                     count++;
                });
                self.mojitProxy.data.set('fooc', "fooc-value set by binder");
                self.mojitProxy.invoke('lazyloadrpccommon', {}, 
                    function(err, result) {
                        if (err || result.indexOf('Error') >= 0) {
                            Y.Node.one('#LazyLoadRPCCommonResult').set('innerHTML', '<div id="LazyLoadRPCCommonTitle">Lazy load failed:' + err + "/div>");
                        } else {
                            Y.Node.one('#LazyLoadRPCCommonResult').set('innerHTML', '<div id="LazyLoadRPCCommontitle">Lazy load succeeded:</div>' 
                               + '<div id="LazyLoadRPCCommonfoo">'+ self.mojitProxy.data.get('fooc') + '</div>'
                               + '<div id="LazyLoadRPCCommonbar">'+ self.mojitProxy.data.get('barc') + '</div>'
                               + '<div id="LazyLoadRPCCommonbaz">'+ self.mojitProxy.data.get('bazc') + '</div>'
                               + '<div id="LazyLoadRPCCommoncount">'+ 'Data has changed: '+count+' times</div>');
                        }
                });
            }, this);
        }

    };

}, '0.0.1', {requires: ['event-mouseenter', 'mojito-client']});
