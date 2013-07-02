/**
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint nomen:true, node:true*/

/**
Submodule used by mojito to configure tunnel middleware.

Usage:

    app.post('/tunnel', mojito.tunnelMiddleware());

Typically, applications will do this in their `app.js`. 

This is a **required** step in order for Mojito to accept tunnel requests
from the client runtime.

@module mojito
@submodule tunnelMiddleware
**/

'use strict';

var debug = require('debug')('mojito:tunnel'),
    dispatcher = require('./dispatcher');

/**
 * Simply returns the dispatcher handler to process tunnel requests.
 */
function registerTunnelRpc() {
    debug('installing tunnel handler');
    return dispatcher.handleRequest;
}

module.exports = {
    tunnelMiddleware: registerTunnelRpc
};
