/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, node:true*/
YUI.add('PagedFlickrBinderIndex', function(Y, NAME) {

    function getPage(href) {
        return href.split('/').pop().split('=').pop();
    }

    Y.namespace('mojito.binders')[NAME] = {

        init: function(mojitProxy) {
            this.mojitProxy = mojitProxy;
        },

        bind: function(node) {
            var self = this,
                paginator;
            this.node = node;
            paginator = function(evt) {

                var tgt = evt.target,
                    page = getPage(tgt.get('href'));

                evt.halt();

                self.mojitProxy.refreshView({
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
