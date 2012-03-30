/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('scrollBinder', function(Y, NAME) {

    Y.namespace('mojito.binders')[NAME] = { 
       init: function(mojitProxy){
        this.mojitProxy = mojitProxy;
       },
       bind: function(node) {
            this.node = node;
            Y.log('NODE: ' + Y.dump(this.node));
       }
    };
}, '0.0.1', {requires: []});
