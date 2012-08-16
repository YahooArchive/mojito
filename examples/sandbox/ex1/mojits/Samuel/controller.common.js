/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('Samuel', function(Y, NAME) {


    Y.namespace('mojito.controllers')[NAME] = {

        init: function(cfg) {
            Y.log('init', 'debug', NAME);
        },

        /*
         * Tests parameters.
         */
        index: function(ac) {
            var merged = ac.params.merged() || {};
            var body = ac.params.body() || {};
            var url = ac.params.url() || {};
            var route = ac.params.route() || {};
            var opts = {
                domain: 'mojito-cookie-test.edu',
                path: '/',
                expires: new Date(2035, 1, 1)
            };
            var paramString = "<ul>";
            paramString = paramString + "<li>merged: " + Y.JSON.stringify(merged) + "</li>";
            paramString = paramString + "<li>body: " + Y.JSON.stringify(body) + "</li>";
            paramString = paramString + "<li>url: " + Y.JSON.stringify(url) + "</li>";
            paramString = paramString + "<li>route: " + Y.JSON.stringify(route) + "</li>";
            paramString = paramString + "</ul>";
            ac.done({
                message: "Hi, I'm a Samuel Mojit.",
                params: paramString
            });
        },

        /*
         * Gets the default model, which is either (1) the only model within the
         * Y.mojito.models namespace, or (2) the model at Y.mojito.models.default.
         */
        datatest: function(ac) {
            ac.models['default'].getData(function(data) {
                ac.done(data);
            });
        },

        datatest2: function(ac) {
            ac.models['default'].getData(function(data) {
                ac.done(data, {view: {name: 'datatest'}});
            });
        },

        jsonReturn: function(ac) {
            ac.http.setHeader('content-type', 'text/html');
            ac.done('test ' + ac.config.get('ima', 'NO DEFAULT IMA VALUE FOUND'));
        }

    };

}, '0.1.0', {requires: ['mojito']});
