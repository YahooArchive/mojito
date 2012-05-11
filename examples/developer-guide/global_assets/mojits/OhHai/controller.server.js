/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('OhHai', function(Y, NAME) {

    Y.mojito.controllers[NAME] = {

        index: function(ac) {
            ac.done();
        }

    };

}, '0.0.1', {requires: ['mojito']});
