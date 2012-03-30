/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('Parent', function(Y) {

    Y.mojito.controller = {

        index: function(ac) {
            ac.composite.done({template: {time: new Date().toString()}});
        }

    };

}, '0.0.1', {requires: ['mojito']});
