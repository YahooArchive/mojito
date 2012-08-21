/*
* Copyright (c) 2011 Yahoo! Inc. All rights reserved.
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