/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('myMojit', function(Y) {

    Y.mojito.controller = {

        index: function(ac) {

            var data = {
                    msg: 'Mojito is Working.'
                };
            
            ac.done(data);
        }

    };

});
