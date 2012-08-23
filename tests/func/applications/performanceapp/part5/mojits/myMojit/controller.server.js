/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('myMojit', function(Y) {

    Y.mojito.controller = {

        index: function(ac) {

            ac.models.message.get(function(data){
                ac.done(data);
            });
            
        }

    };

});