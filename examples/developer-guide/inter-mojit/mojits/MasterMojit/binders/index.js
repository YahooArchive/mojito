/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('MasterMojitBinderIndex', function(Y, NAME) {

    Y.namespace("mojito.binders")[NAME]= { 

        init: function(mojitProxy) {
            var mp = this.mp = this.mojitProxy = mojitProxy;
            Y.log("Entering MasterMojitBinderIndex");
            this.mojitProxy.listen('fire-link', function(payload) {
                var c = mp.getChildren();
                var receiverID = c["receiver"].templateId;
                Y.log('intercepted fire-link event: ' + payload.data.url, 'info', NAME);
                mojitProxy.broadcast('broadcast-link',
                                     {url: payload.data.url},{ target: {templateId:receiverID }});
                Y.log('broadcasted event to child mojit: ' + payload.data.url, 'info', NAME);
            });
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
}, '0.0.1', {requires: ['mojito-client']});
