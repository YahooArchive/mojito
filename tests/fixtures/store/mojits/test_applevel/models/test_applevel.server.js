/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('test_applevelModel', function(Y) {

    Y.mojito.models.test_applevel = {

        init: function(config) {
            this.config = config;
        },

        getData: function(callback) {
            callback({some:'data'});
        }

    };

}, '0.0.1', {requires: []});
