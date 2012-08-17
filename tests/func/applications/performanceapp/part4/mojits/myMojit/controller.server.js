/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
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