/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('SenderMojit', function(Y, NAME) {

    Y.namespace('mojito.controllers')[NAME] = {
        init: function(config) {
            this.config = config;
        },
        "index": function(actionContext) {
            actionContext.done({title: 'List of images for testing'});
        }
    };
}, '0.0.1', {requires: []});
