/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*global module*/
/*jslint sloppy:true, nomen:true*/


function sendData(res, data, code) {
    res.writeHead((code || 200), {
        'content-type': 'application/json; charset="utf-8"'
    });
    res.end(JSON.stringify(data, null, 4));
}

function sendError(res, msg, code) {
    sendData(res, {error: msg}, (code || 500));
}


/**
 * Exports a middleware factory that can handle type tunnel requests.
 *
 * @param {Object} config The configuration.
 * @return {Function} The handler.
 */
module.exports = function (config) {
    return function (req, res, next) {
        var typeReq = req._tunnel && req._tunnel.typeReq;

        if (!typeReq) {
            return next();
        }

        if (!typeReq.type) {
            return sendError(res, 'Not found: ' + req.url, 404);
        }

        config.store.expandInstanceForEnv('client', {
            type: typeReq.type
        }, req.context, function (err, data) {
            if (err) {
                return sendError(
                    res,
                    'Error opening: ' + req.url + '\n' + err,
                    500
                );
            }
            return sendData(res, data);
        });
    };
};
