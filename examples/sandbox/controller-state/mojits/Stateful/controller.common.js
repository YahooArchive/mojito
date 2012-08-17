/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('Stateful', function(Y, NAME) {

    Y.namespace('mojito.controllers')[NAME] = {

        init: function(config) {
            this.config = config;
            this.time = new Date().getTime();
        },

        index: function(ac) {
            ac.done({id: this.config.id});
        },

        pitch: function(ac) {
            this.logit('pitch');
            this.ball = ac.params.merged('ball');
            ac.done();
        },

        'catch': function(ac) {
            var self = this;
            this.logit('catch');
            ac.models.Stateful.getData(function(err, data) {
                ac.done({
                    ball: self.ball,
                    time: self.time,
                    model: data.modelId
                }, 'json');
            });
        },


        logit: function(msg) {
            Y.log(msg + this.time, 'warn', NAME);
        }

    };

}, '0.0.1', {requires: []});
