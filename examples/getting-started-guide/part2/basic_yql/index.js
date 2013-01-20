/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true*/


process.chdir(__dirname);


/**
 * @param {object} config The configuration object containing processing params.
 * @param {object} token Token used to identify the application.
 */
module.exports = function(config, token) {
    var server = require('./server.js'),
        YUI = require('mojito').YUI;

    YUI().use('mojito-server', function (Y) {
        var app = server(Y);

        // Signal the app is ready, providing the token and app references.
        process.emit("application-ready", token, app);
    });
};
