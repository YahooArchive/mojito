/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('PagedFlickrBinderIndex', function(Y, NAME) {

    function getPage(href) {
        return href.split('/').pop().split('=').pop()
    }

    Y.namespace('mojito.binders')[NAME] = {

        init: function(mojitProxy) {
            this.mojitProxy = mojitProxy;
        },

        bind: function(node) {
            var self = this;
            this.node = node;
            var paginator = function(evt) {

                var tgt = evt.target;
                var page = getPage(tgt.get('href'));

                evt.halt();

                self.mojitProxy.refreshTemplate({
                    rpc: true,
                    params: {
                        route: {page: page}
                    }
                });
                
            };
            this.node.all('#paginate a').on('click', paginator, this);
        }
        
    };

}, '0.0.1', {requires: []});
