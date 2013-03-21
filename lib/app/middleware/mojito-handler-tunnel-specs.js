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
 * Exports a middleware factory that can handle spec tunnel requests.
 *
 * @param {Object} config The configuration.
 * @return {Function} The handler.
 */
module.exports = function (config) {
    return function (req, res, next) {
        var specsReq = req._tunnel && req._tunnel.specsReq,
            instance = {},
            type,
            name;

        if (!specsReq) {
            return next();
        }

        type = specsReq.type;
        name = specsReq.name;
        name = name && name.split('.').slice(0, -1).join('.');

        if (!type || !name) {
            return sendError(res, 'Not found: ' + req.url, 500);
        }

        instance.base = type;

        if (name !== 'default') {
            instance.base += ':' + name;
        }

        config.store.expandInstanceForEnv('client', instance, req.context,
            function (err, data) {
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
