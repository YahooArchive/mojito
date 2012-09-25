/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('myMojit', function(Y, NAME) {

    Y.namespace('mojito.controllers')[NAME] = {

        index: function(ac) {

            ac.models.get('message').get(function(data) {
                ac.done(data);
            });
            
        }

    };

}, '0.0.1', { requires: [
    'mojito-models-addon',
    'myMojitModel'
]});
