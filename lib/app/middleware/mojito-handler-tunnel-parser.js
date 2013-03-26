/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*global require, module*/
/*jslint sloppy:true, nomen:true, white:true*/

var RE_TRAILING_SLASHES = /\/+$/;

/**
 * Export a function which can parse tunnel requests.
 * @param {Object} config The configuration.
 * @return {Object} The parser.
 */
module.exports = function (config) {
    var liburl      = require('url'),
        libpath     = require('path'),
        appConfig   = config.store.getAppConfig({}) || {},
        staticPrefix,
        tunnelPrefix;

    staticPrefix = appConfig.staticHandling && appConfig.staticHandling.prefix;
    tunnelPrefix = appConfig.tunnelPrefix;

    // normalize() will squash multiple slashes into one slash.
    if (staticPrefix) {
        staticPrefix = staticPrefix.replace(RE_TRAILING_SLASHES, '');
        staticPrefix = libpath.normalize('/' + staticPrefix);
    }
    if (tunnelPrefix) {
        tunnelPrefix = tunnelPrefix.replace(RE_TRAILING_SLASHES, '');
        tunnelPrefix = libpath.normalize('/' + tunnelPrefix);
    }

    staticPrefix = staticPrefix || '/static';
    tunnelPrefix = tunnelPrefix || '/tunnel';

    return function (req, res, next) {
        var hasTunnelPrefix = req.url.indexOf(tunnelPrefix) === 0,
            hasTunnelHeader = req.headers['x-mojito-header'] === 'tunnel',
            name,
            type,
            path,
            parts;

        // If we are not tunneling get out of here fast!
        if (!hasTunnelPrefix && !hasTunnelHeader) {
            return next();
        }

        /**
        Tunnel examples

        RPC tunnel:
        /tunnel (or it could just have the tunnel header)

        Type tunnel:
        /static/{type}/definition.json
        /{tunnelPrefix}/{type}/definition.json // custom prefix
        /tunnel/static/{type}/definition.json  // according to a UT

        Spec tunnel:
        /static/{type}/specs/default.json
        /{staticPrefix}/{type}/specs/default.json  // custom prefix
        /tunnel/static/{type}/specs/default.json   // according to a UT
        **/

        path = liburl.parse(req.url).pathname;

        // Normalization step to handle `/{tunnelPrefix}`, `/{staticPrefix}`,
        // and `/{tunnelPrefix}/{staticPrefix}` URLs.
        path = path.replace(staticPrefix, '')
                   .replace(tunnelPrefix, '');

        req._tunnel = {};

        if (path) {
            // Get the basename without the .json extension.
            name = libpath.basename(path, '.json');

            // Time to get dirty.
            parts = path.split('/');

            // Get the mojit type.
            type = parts[1];

            // "Spec" tunnel request
            if (parts[parts.length - 2] === 'specs') {
                req._tunnel.specsReq = {
                    type: type,
                    name: name
                };
            }
            // "Type" tunnel request
            else if (name === 'definition') {
                req._tunnel.typeReq = {
                    type: type
                };
            }
        }
        // "RPC" tunnel request
        else if (req.url === tunnelPrefix && req.method === 'POST') {
            req._tunnel.rpcReq = {};
        }

        return next();
    };
};
