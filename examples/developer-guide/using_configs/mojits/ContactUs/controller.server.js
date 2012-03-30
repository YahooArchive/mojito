/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('ContactUs', function(Y) {

    Y.mojito.controller = {

        init: function(config) {
            this.config = config;
        },

        index: function(ac) {
            var vudata = {
                'company': ac.config.get("company"),
                'copyright': this.config.copyright,
                'depts': ac.config.getDefinition(this.config.key)
            }

            ac.done(vudata);
        }
    };

}, '0.0.1', {requires: ['mojito']});
