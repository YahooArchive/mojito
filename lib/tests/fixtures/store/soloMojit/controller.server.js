/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('soloMojit', function(Y) {

    Y.mojito.controller = {

        init: function(config) {
            this.config = config;
        },

        index: function(ac) {
            ac.done('Mojito is working.');
        }

    };

}, '0.0.1', {requires: []});
