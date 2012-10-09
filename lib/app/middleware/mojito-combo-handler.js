/*
 * Ext JS Connect
 * Copyright(c) 2010 Sencha Inc.
 * MIT Licensed
 *
 * Modified by Yahoo!
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Yahoo! Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*
 * Connect staticProvider middleware adapted for Mojito *
 ********************************************************
 * This was modified to allow load all combo urls from the
 * Mojito development environment instead of one static
 * directory.
 ********************************************************
 */


/*jslint anon:true, sloppy:true, nomen:true, stupid:true*/

/*
DECLAIMER: this is VERY experimental, and the purpose of this
middleware is to provide an easy way to load yui modules by their
names rather than the real static path. Why? because we can then
leverage the YUI Loader on the client side to take care of the
dependencies computations efficiently.
    from: @caridy
*/


/*
 * Module dependencies.
 */
var libfs = require('fs'),
    mime = require('mime'),
    libpath = require('path'),
    existsSync = libfs.existsSync || libpath.existsSync,
    parseUrl = require('url').parse,
    logger,
    NAME = 'ComboHandler',

    MODULE_META_ENTRIES          = ['requires', 'use', 'optional', 'skinnable', 'after', 'condition'],
    MODULE_META_PRIVATE_ENTRIES  = ['after', 'expanded', 'supersedes', 'ext', '_parsed', '_inspected',
                                    'skinCache', 'langCache'];

/*
 * File buffer cache.
 */
var _cache = {};

/*
 * Check if `req` and response `headers`.
 *
 * @param {IncomingMessage} req
 * @param {Object} headers
 * @return {Boolean}
 * @api private
 */
function modified(req, headers) {
    var modifiedSince = req.headers['if-modified-since'],
        lastModified = headers['Last-Modified'],
        noneMatch = req.headers['if-none-match'],
        etag = headers.ETag;

    // Check If-None-Match
    if (noneMatch && etag && noneMatch === etag) {
        return false;
    }

    // Check If-Modified-Since
    if (modifiedSince && lastModified) {
        modifiedSince = new Date(modifiedSince);
        lastModified = new Date(lastModified);
        // Ignore invalid dates
        if (!isNaN(modifiedSince.getTime())) {
            if (lastModified <= modifiedSince) {
                return false;
            }
        }
    }

    return true;
}

/*
 * Check if `req` is a conditional GET request.
 *
 * @method conditionalGET
 * @param {IncomingMessage} req
 * @return {Boolean}
 * @api private
 */
function conditionalGET(req) {
    return req.headers['if-modified-since'] ||
        req.headers['if-none-match'];
}

/*
 * Return an ETag in the form of size-mtime.
 *
 * @method etag
 * @param {Object} stat
 * @return {String}
 * @api private
 */
function etag(stat) {
    return stat.size + '-' + Number(stat.mtime);
}

/*
 * Respond with 304 "Not Modified".
 *
 * @method notModified
 * @param {ServerResponse} res
 * @param {Object} headers
 * @api private
 */
function notModified(res, headers) {
    // Strip Content-* headers
    Object.keys(headers).forEach(function(field) {
        if (0 === field.indexOf('Content')) {
            delete headers[field];
        }
    });
    res.writeHead(304, headers);
    res.end();
}

/*
 * Respond with 403 "Forbidden".
 *
 * @method forbidden
 * @param {ServerResponse} res
 * @api private
 */
function forbidden(res) {
    var body = 'Forbidden';
    res.writeHead(403, {
        'Content-Type': 'text/plain',
        'Content-Length': body.length
    });
    res.end(body);
}

/*
 * Clear the memory cache for `key` or the entire cache.
 *
 * @method clearCache
 * @param {String} key
 * @api public
 */
function clearCache(key) {
    if (key) {
        delete _cache[key];
    } else {
        _cache = {};
    }
}

function processMeta(resolvedMods, modules, expanded_modules, conditions) {
    var m,
        i,
        module;

    for (m in resolvedMods) {
        if (resolvedMods.hasOwnProperty(m)) {
            module = resolvedMods[m];

            if (module.condition && module.condition.test) {
                conditions[module.name] = module.condition.test.toString();
                module.condition.test = "{" + module.name + "}";
            }

            modules[module.name] = {};
            if (module.type === 'css') {
                modules[module.name] = 'css';
            }
            for (i = 0; i < MODULE_META_ENTRIES.length; i += 1) {
                if (module[MODULE_META_ENTRIES[i]]) {
                    modules[module.name][MODULE_META_ENTRIES[i]] =
                        module[MODULE_META_ENTRIES[i]];
                }
            }

            expanded_modules[module.name] = module;
            for (i = 0; i < MODULE_META_PRIVATE_ENTRIES.length; i += 1) {
                delete module[MODULE_META_PRIVATE_ENTRIES[i]];
            }
        }
    }
}


/*
 * Static file server.
 *
 * Options:
 *
 *   - `root`     Root path from which to serve static files.
 *   - `maxAge`   Browser cache maxAge in milliseconds, defaults to 0
 *   - `cache`    When true cache files in memory indefinitely,
 *                until invalidated by a conditional GET request.
 *                When given, maxAge will be derived from this value.
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */
function staticProvider(store, globalLogger, Y) {
    logger = globalLogger;
    var appConfig = store.getStaticAppConfig(),
        options = appConfig.staticHandling || {},
        cache = options.cache,
        maxAge = options.maxAge,
        urls = store.getAllModulesURLs(),

        // collecting client side metadata
        mojits = store.yui.getConfigAllMojits('client', {});
        shared = store.yui.getConfigShared('client', {}, false);
        modules = Y.merge((mojits.modules || {}), (shared.modules || {}));


    if (cache && !maxAge) {
        maxAge = cache;
    }
    maxAge = maxAge || 0;

    // using the loader at the server side to compute the loader metadata
    // to avoid loading the whole thing on demand.
    var loader = new Y.Loader(Y.merge({
            ignoreRegistered: true,
            modules: modules
        }, {
            require: Y.Object.keys(modules)
        })),
        resolved = loader.resolve(true),

        appMetaData,
        appResolvedMetaData,

        // other structures
        expanded_modules = {}, // expanded meta (including fullpaths)
        modules = {},          // regular meta  (a la loader-yui3)
        conditions = {},       // hash to store conditional functions
        name;

    processMeta(resolved.jsMods, modules, expanded_modules, conditions);
    processMeta(resolved.cssMods, modules, expanded_modules, conditions);

    appMetaData         = JSON.stringify(modules);
    appResolvedMetaData = JSON.stringify(expanded_modules);

    for (name in conditions) {
        if (conditions.hasOwnProperty(name)) {
            appMetaData         = appMetaData.replace('"{' + name + '}"', conditions[name]);
            appResolvedMetaData = appResolvedMetaData.replace('"{' + name + '}"', conditions[name]);
        }
    }


    return function(req, res, next) {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return next();
        }

        var url = parseUrl(req.url),
            files = [],
            filename = '',
            module = '',
            yui = '',
            result = [],
            counter = 0,
            i = 0,
            hit,
            head = (req.method === 'HEAD');

        // only combo requests are allow here
        if (url.pathname !== '/combo') {
            return next();
        }

        logger.log('serving static path: ' + url.pathname, 'debug', 'static-handler');

        files = url.query.split('&');

        function readHandler(index, filename) {
            return function (err, data) {
                var headers,
                    content = '',
                    i;

                counter += 1;
                if (err) {
                    logger.log('NOT FOUND: ' + filename, 'warn', NAME);
                } else {
                    result[index].content = data;
                }
                if (counter === files.length) {
                    for (i = 0; i < counter; i += 1) {
                        content += result[i].content;
                    }
                    headers = {
                        'Content-Type': 'application/javascript; charset=utf-8',
                        'Content-Length': content.length,
                        'Last-Modified': new Date().toUTCString(),
                        'Cache-Control': 'public max-age=' + (maxAge / 1000)
                    };
                    res.writeHead(200, headers);
                    res.end(head ? undefined : content);

                }
            };
        }

        // validating all files before doing anything else
        // so errors can be found early on.
        for (i = 0; i < files.length; i += 1) {
            yui = libpath.join(__dirname,
                    '../../../node_modules/yui', files[i]);

            module = libpath.basename(files[i]).split('.')[0];
            module = module.replace(/\-(min|debug)$/, '');

            if (module === 'loader-app-base') {
                result[i] = {
                    fullpath: module,
                    content: "YUI.applyConfig({modules:" + appMetaData + "});"
                };
            } else if (module === 'loader-app-full') {
                result[i] = {
                    fullpath: module,
                    content: "YUI.applyConfig({modules:" + appResolvedMetaData + "});"
                };
            } else if (urls[module]) {
                result[i] = {
                    fullpath: urls[module],
                    content: ''
                };
            } else if ((module.indexOf('..') === -1) && existsSync(yui)) {
                result[i] = {
                    fullpath: yui,
                    content: ''
                };
            } else {
                logger.log('Invalid module name: ' + module, 'warn', NAME);
                res.writeHead(400);
                res.end(undefined);
            }

        }

        // async queue implementation
        if (result.length === files.length) {
            for (i = 0; i < result.length; i += 1) {
                filename = result[i].fullpath;
                if (result[i].content) {
                    // if we already have content in memory, let's
                    // just use it directly.
                    readHandler(i, filename)(null, result[i].content);
                } else {
                    libfs.readFile(filename, readHandler(i, filename));
                }
            }
        }

    };
}


/**
 * Export function to create the static handler.
 * @param {Object} config The configuration data for the handler.
 * @return {Object} A static handler.
 */
module.exports = function(config) {
    return staticProvider(config.store, config.logger, config.Y);
};
