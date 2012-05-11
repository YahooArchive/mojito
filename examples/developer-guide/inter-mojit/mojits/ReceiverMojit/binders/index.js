/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('ReceiverMojitBinderIndex', function(Y, NAME) {

    Y.namespace('mojito.binders')[NAME] = {

        init: function(mojitProxy) {
            var self = this;
            this.mojitProxy = mojitProxy;
            this.mojitProxy.listen('broadcast-link', function(payload) {
                Y.log('Intercepted broadcast-link event: ' + payload.data.url, 'info', NAME);

                // fire an event to the mojit to reload with the correct url
                var params = {
                        url: {
                            url: payload.data.url
                        }
                    };
                mojitProxy.invoke('show', {
                    params: params
                }, function(err, markup) {
                    self.node.setContent(markup);
                });
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

}, '0.0.1', {requires: ['mojito-client','event-custom','json']});
