/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*global require, module*/
/*jslint sloppy:true, nomen:true*/


var liburl = require('url'),
    RE_REPEATING_SLASH = /\/{2,}/g;

function trimSlash(str) {
    if (str.charAt(0) === '/') {
        str = str.substring(1, str.length);
    }
    if (str.charAt(str.length - 1) === '/') {
        str = str.substring(0, str.length - 1);
    }
    return str;
}


/**
 * Export a function which can create the handler.
 * @param {Object} config Data to configure the handler.
 * @return {Object} The newly constructed handler.
 */
module.exports = function (config) {
    var that      = this,
        appConfig = config.store.getAppConfig({}) || {},
        staticPrefix,
        tunnelPrefix;

    staticPrefix = appConfig.staticHandling && appConfig.staticHandling.prefix;
    tunnelPrefix = appConfig.tunnelPrefix;

    if (staticPrefix) {
        staticPrefix = '/' + trimSlash(staticPrefix);
    }
    if (tunnelPrefix) {
        tunnelPrefix = '/' + trimSlash(tunnelPrefix);
    }

    this.staticPrefix = staticPrefix || '/static';
    this.tunnelPrefix = tunnelPrefix || '/tunnel';

    return function (req, res, next) {
        var hasTunnelPrefix = req.url.indexOf(that.tunnelPrefix) === 0,
            hasTunnelHeader = req.headers['x-mojito-header'] === 'tunnel',
            name,
            type,
            url,
            parts;

        // If we are not tunneling get out of here fast!
        if (!hasTunnelPrefix && !hasTunnelHeader) {
            return next();
        }

        req._tunnel = {};

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

        url = req.url.split('?')[0];

        // Normalization step to handle `/{tunnelPrefix}`, `/{staticPrefix}`,
        // and `/{tunnelPrefix}/{staticPrefix}` URLs.
        url = url.replace(that.staticPrefix, '')
                 .replace(that.tunnelPrefix, '')
                 .replace(RE_REPEATING_SLASH, '/');

        parts = url.split('/');

        if (parts.length) {
            name = parts[parts.length - 1];
            type = parts[1];

            // Spec tunnel
            if (parts[parts.length - 2] === 'specs') {
                req._tunnel.specsReq = {
                    type: type,
                    name: name
                };
                return next();
            }
            // Type tunnel
            if (name === 'definition.json') {
                req._tunnel.typeReq = {
                    type: type
                };
                return next();
            }
        }

        // RPC tunnel
        if (req.url === that.tunnelPrefix && req.method === 'POST') {
            req._tunnel.rpcReq = {};
            return next();
        }

        return next();
    };
};
