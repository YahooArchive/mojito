/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*global require, module*/
/*jslint sloppy:true, nomen:true*/

/**
 * Export a middleware aggregate.
 * @param {Object} The configuration.
 * @return {Object} The handler.
 */
module.exports = function (config) {
    var tunnelSubstack = [
        require('./mojito-handler-tunnel-parser')(config),
        require('./mojito-handler-tunnel-rpc')(config),
        require('./mojito-handler-tunnel-specs')(config),
        require('./mojito-handler-tunnel-type')(config)
    ];

    return function (req, res, next) {
        var len,
            i;

        // Connects the tunnel middleware substack.
        function connect(err) {
            // Exit the substack on error.
            if (err) {
                next(err);
            }
        }

        req._tunnel = {
            sendData: function (res, data, code) {
                res.writeHead((code || 200), {
                    'content-type': 'application/json; charset="utf-8"'
                });
                res.end(JSON.stringify(data, null, 4));

                // Flag the end of this request.
                req._tunnel.done = true;
            },
            sendError: function (res, msg, code) {
                this.sendData(res, {error: msg}, (code || 500));
            }
        };

        // Iterate over the tunnel middleware substack.
        for (i = 0, len = tunnelSubstack.length; i < len; i += 1) {
            tunnelSubstack[i](req, res, connect);

            // End this request if we've provided an end-point in the stack.
            if (req._tunnel.done) {
                return;
            }
        }

        next();
    };
};
