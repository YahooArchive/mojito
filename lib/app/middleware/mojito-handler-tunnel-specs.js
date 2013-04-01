/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*global module*/
/*jslint sloppy:true, nomen:true*/

/**
 * Exports a middleware factory that can handle spec tunnel requests.
 *
 * @param {Object} config The configuration.
 * @return {Function} The handler.
 */
module.exports = function (config) {
    return function (req, res, next) {
        var specsReq = req._tunnel && req._tunnel.specsReq,
            instance,
            type,
            name;

        if (!specsReq) {
            return next();
        }

        type = specsReq.type;
        name = specsReq.name;

        if (!type || !name) {
            res.statusCode = 404;
            return next(new Error('Not found: ' + req.url));
        }

        instance = {
            base: type
        };

        if (name !== 'default') {
            instance.base += ':' + name;
        }

        config.store.expandInstanceForEnv(
            'client',
            instance,
            req.context,
            function (err, data) {
                if (err) {
                    res.statusCode = 500;
                    return next(
                        new Error('Error opening: ' + req.url + '\n' + err)
                    );
                }
                res.writeHead(200, {
                    'content-type': 'application/json'
                });
                res.end(JSON.stringify(data));
            }
        );
    };
};
