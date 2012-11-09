/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('myMojit', function(Y, NAME) {

    Y.mojito.controller = {

        index: function(ac) {

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
    'myMojitModel']});
