/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*global module*/
/*jslint sloppy:true, nomen:true*/

/**
 * Exports a middleware factory that can handle type tunnel requests.
 *
 * @param {Object} config The configuration.
 * @return {Function} The handler.
 */
module.exports = function (config) {
    return function (req, res, next) {
        var typeReq = req._tunnel && req._tunnel.typeReq,
            instance;

        if (!typeReq) {
            return next();
        }

        if (!typeReq.type) {
            return req._tunnel.sendError(res, 'Not found: ' + req.url, 404);
        }

        instance = {
            type: typeReq.type
        };

        config.store.expandInstanceForEnv(
            'client',
            instance,
            req.context,
            function (err, data) {
                if (err) {
                    return req._tunnel.sendError(
                        res,
                        'Error opening: ' + req.url + '\n' + err,
                        500
                    );
                }
                return req._tunnel.sendData(res, data);
            }
        );
    };
};
