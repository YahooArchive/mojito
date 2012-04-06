/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('myMojitModel', function(Y) {

    Y.mojito.models.message = {

        get: function(callback) {

            var data = {
                    msg: 'Mojito is Working.'
                };
                
            callback(data);
        }
    };

});
