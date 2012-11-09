/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('myMojit', function(Y, NAME) {

    Y.namespace('mojito.controllers')[NAME] = {

        index: function(ac) {

// DOING
            ac.models.get('message').get(function(data){

                data.title = ac.intl.lang('TITLE');

                ac.done(data);
            });
        }
    };
}, '0.0.1', {requires: [
    'mojito',
    'mojito-models-addon',
    'mojito-intl-addon',
    'myMojitModel'
]});
