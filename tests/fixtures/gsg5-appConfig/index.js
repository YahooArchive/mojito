/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
// this file provides Manhattan integration

process.chdir(__dirname);

/**
 * @token given by manhattan and used to emit that the app is ready
 */
module.exports = function(config, token) {
    var app = require('./server.js');

    // send the application to Manhattan along with the token
    process.emit("application-ready", token, app);
};
