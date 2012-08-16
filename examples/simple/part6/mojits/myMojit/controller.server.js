/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('myMojit', function(Y, NAME) {

    Y.namespace('mojito.controllers')[NAME] = {

        index: function(ac) {

            ac.models.message.get(function(data){
                ac.done(data);
            });
            
        }

    };

});
