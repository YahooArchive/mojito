/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('myMojit', function(Y) {

    Y.mojito.controller = {

        index: function(ac) {

            ac.models.message.get(function(data){

                data.title = ac.intl.lang('TITLE');

                ac.done(data);
            });
        }
    };
}, '0.0.1', {requires: ['mojito-intl-addon']});
