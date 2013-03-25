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
    var parser = require('./mojito-handler-tunnel-parser')(config),
        rpc    = require('./mojito-handler-tunnel-rpc')(config),
        specs  = require('./mojito-handler-tunnel-specs')(config),
        type   = require('./mojito-handler-tunnel-type')(config);

    return function (req, res, next) {
        var middleware = [
            parser,
            rpc,
            specs,
            type
        ];

        function run() {
            var m = middleware.shift();

            if (!m) {
                req._tunnel = null;
                return next();
            }

            m(req, res, function (err) {
                if (err) {
                    return next(err);
                }
                run();
            });
        }

        run();
    };
};
