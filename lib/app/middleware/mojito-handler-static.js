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
 * This was modified to allow load all files from the
 * Mojito development environment instead of one static
 * directory.
 ********************************************************
 */


/*jslint node:true, nomen:true, continue: true */

'use strict';

/*
 * Module dependencies.
 */
var libfs = require('fs'),
    libpath = require('path'),
    libmime = require('mime'),
    YUI = require(libpath.join(__dirname, '..', '..', 'yui-sandbox.js')).getYUI(),
    parseUrl = require('url').parse,
    logger,
    NAME = 'StaticHandler';

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
 * Return an ETag in the form of size-mtime.
 *
 * @method etag
 * @param {Object} data buffer with the content to be flushed
 * @param {Object} stat filesystem stat for the static file.
 * @return {String}
 * @api private
 */
function etag(data, stat) {
    // using data.length instead of stat.size to support compilation
    var t;
    if (stat && stat.mtime) {
        t = Number(stat.mtime);
    } else {
        t = (new Date());
    }

    return data.length + '-' + t;
}

/*
 * Respond with 304 "Not Modified".
 *
 * @method notModified
 * @param {ServerResponse} res
 * @param {Object} headers
 * @api private
 */
function notModified(res, originalHeaders) {
    var headers = {},
        field;
    // skip Content-* headers
    // making a copy of the original to avoid currupting the cache
    for (field in originalHeaders) {
        if (originalHeaders.hasOwnProperty(field) && (0 !== field.indexOf('Content'))) {
            headers[field] = originalHeaders[field];
        }
    }
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
 * Respond with 404 "Not Found".
 *
 * @method notFound
 * @param {ServerResponse} res
 * @api private
 */
function notFound(res) {
    var body = 'Not Found';
    res.writeHead(404, {
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

/*
 * Make the appropiated content type based on a resource.
 *
 * @method makeContentTypeHeader
 * @param {object} resource Resource from RS.
 * @return {string} content-type
 * @api private
 */
function makeContentTypeHeader(resource) {
    return resource.mime.type + (resource.mime.charset ? '; charset=' +
        resource.mime.charset : '');
}

/*
 * Aggregate all yui modules from the app that are compatible with
 * client runtime using the name of the yui module as the hash.
 *
 * @method getAppModuleResources
 * @param {object} store Resource Store instance
 * @return {object} yui modules resources
 * @api private
 */
function getAppModuleResources(store) {
    var ress,
        m,
        mojit,
        mojits,
        moduleRess = {};

    function processRess(ress) {
        var r,
            res;
        for (r = 0; r < ress.length; r += 1) {
            res = ress[r];
            if ('common' !== res.affinity.affinity) {
                continue;
            }
            if (res.yui && res.yui.name) {
                moduleRess[res.yui.name] = res;
            }
        }
        for (r = 0; r < ress.length; r += 1) {
            res = ress[r];
            if ('client' !== res.affinity.affinity) {
                continue;
            }
            if (res.yui && res.yui.name) {
                if (moduleRess[res.yui.name]) {
                    logger.log('YUI Modules should have unique name per affinity. ' +
                               'Module [' + res.yui.name + '] has both common and ' +
                               'client affinity.', 'warn', NAME);
                }
                moduleRess[res.yui.name] = res;
            }
        }
    }

    ress = store.getResourceVersions({});
    processRess(ress);

    mojits = store.listAllMojits();
    mojits.push('shared');
    for (m = 0; m < mojits.length; m += 1) {
        mojit = mojits[m];
        ress = store.getResourceVersions({mojit: mojit});
        processRess(ress);
    }

    return moduleRess;
}

/*
 * Aggregate all yui core modules
 * using the name of the yui module as the hash.
 *
 * @method getYUIModuleResources
 * @param {object} appConfig Static application config
 * @return {object} yui core modules resources
 * @api private
 */
function getYUIModuleResources(appConfig) {
    var Y,
        name,
        modules,
        mimetype,
        charset,
        fullpath;

    Y = YUI({
        fetchCSS: true,
        combine: true,
        base: "/static/combo?",
        comboBase: "/static/combo?",
        root: ""
    }, ((appConfig.yui && appConfig.yui.config) || {}));

    // used to find the the modules in YUI itself
    Y.use('loader');
    modules = (new Y.Loader(Y.config)).moduleInfo;

    for (name in modules) {
        if (modules.hasOwnProperty(name)) {
            // faking a RS object for the sake of simplicity
            fullpath = libpath.join(__dirname,
                '../../../node_modules/yui', modules[name].path);
            mimetype = libmime.lookup(fullpath);
            charset  = libmime.charsets.lookup(mimetype);
            modules[name] = {
                source: {
                    fs: {
                        isFile: true,
                        fullPath: fullpath
                    }
                },
                mime: {
                    type: mimetype,
                    charset: charset
                }
            };
        }
    }
    return modules;
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

    var appConfig = store.getStaticAppConfig(),
        options = appConfig.staticHandling || {},
        cache = options.cache,
        maxAge = options.maxAge,
        staticRess,
        moduleRess,
        yuiRess;

    logger = globalLogger;

    moduleRess = getAppModuleResources(store);
    yuiRess = getYUIModuleResources(appConfig);
    staticRess = store.getAllURLResources();

    if (cache && !maxAge) {
        maxAge = cache;
    }
    maxAge = maxAge || 0;

    function done(req, res, hit) {
        if (!options.forceUpdate && !modified(req, hit.headers)) {
            logger.log(hit.path + ' was not modified', 'debug', NAME);
            notModified(res, hit.headers);
        } else {
            res.writeHead(200, hit.headers);
            res.end(req.method === 'HEAD' ? undefined : hit.body);
        }
    }

    return function (req, res, next) {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            next();
            return;
        }

        var url = parseUrl(req.url),
            path = url.pathname,
            files = [],
            file,
            result = [],
            failures = 0,
            counter = 0,
            module,
            resource,
            i;


        function tryToFlush() {
            var headers,
                content = '',
                j;

            if (counter < files.length) {
                return;
            }
            if (counter === files.length) {
                if (failures) {
                    notFound();
                    return;
                }
            }

            for (j = 0; j < counter; j += 1) {
                content += result[j].content;
            }
            // Serve the content of the file using buffers
            // Response headers
            headers = {
                'Content-Type': makeContentTypeHeader(result[0].res),
                'Content-Length': content.length,
                'Last-Modified': (options.forceUpdate || !result[0].stat) ?
                        new Date().toUTCString() : result[0].stat.ctime.toUTCString(),
                'Cache-Control': 'public max-age=' + (maxAge / 1000),
                // Return an ETag in the form of size-mtime.
                'ETag': etag(content, result[0].stat)
            };

            done(req, res, {
                path: path,
                headers: headers,
                body: content
            });
            // adding guard in case tryToFlush is called twice.
            counter = 0;

        }


        function readHandler(index, path) {
            // using the clousure to preserve the binding between
            // the index, path and the actual result
            return function (err, data, stat) {

                counter += 1;
                if (err) {
                    logger.log('failed to read ' + path + ' because: ' + err.message, 'error', NAME);
                    notFound();
                } else {
                    logger.log(path + ' was read from disk', 'debug', NAME);
                    result[index].content = data;
                    result[index].stat = stat;
                    // Cache support
                    if (cache) {
                        _cache[path] = result[index];
                    }
                    // in case we have everything ready
                    tryToFlush();
                }

            };
        }


        // TODO: [Issue 87] we should be able to just remove this, because
        // Mojito closes all bad URLs down.
        // Potentially malicious path
        if (path.indexOf('..') !== -1) {
            forbidden(res);
            return;
        }


        // combo urls are allow as well
        if (libpath.basename(url.pathname) === 'combo' && url.query) {
            // YIV might be messing around with the querystring params
            // trying to formalize them by adding = and transforming /
            // so we need to revert back to / and remove the =
            // TODO: this might not work in Windows
            files = url.query.replace(/[=]/g, '').replace(/%2F/g, '/').split('&');
        } else {
            if (/^\//.test(path) && path.indexOf('/static') == -1) {
                files = [path.substring(1)];
            } else {
                files = [path];
            }
        }

        for (i = 0; i < files.length; i += 1) {

            file = files[i];

            // Cache hit
            if (cache && _cache[file]) {
                logger.log(file + ' was read from cache', 'debug', NAME);
                result[i] = _cache[file];
                continue;
            }
            // something like:
            // - foo/bar-min.js becomes "bar"
            // - foo/lang/bar_en-US.js becomes "lang/bar_en-US"
            module = (file.indexOf('/lang/') >= 0 ? 'lang/' : '') +
                libpath.basename(file, libpath.extname(file)).
                replace(/\-(min|debug)$/, '');

            if (staticRess[file]) {

                // geting an static file
                result[i] = {
                    path: file,
                    res: staticRess[file]
                };

            // TODO:  these adjustments should really be done by addons/rs/url
            } else if (file === '/favicon.ico') {

                // geting an static favicon
                result[i] = {
                    path: file,
                    res: store.getResources('client', {}, {mojit: 'shared', id: 'asset-ico-favicon'})[0]
                };

            } else if (file === '/robots.txt') {

                // geting an static robot
                result[i] = {
                    path: file,
                    res: store.getResources('client', {}, {mojit: 'shared', id: 'asset-txt-robots'})[0]
                };

            } else if (file === '/crossdomain.xml') {

                // geting an static crossdomain
                result[i] = {
                    path: file,
                    res: store.getResources('client', {}, {mojit: 'shared', id: 'asset-xml-crossdomain'})[0]
                };

            // other kind of static files
            } else if (moduleRess[module]) {

                // geting an app module
                result[i] = {
                    path: file,
                    res: moduleRess[module]
                };

            } else if (yuiRess[module]) {

                // getting a yui module
                result[i] = {
                    path: file,
                    res: yuiRess[module]
                };

            }

        }

        // async queue implementation
        if (result.length > 0) {

            logger.log('serving ' + (result.length > 1 ? 'combo' : 'static') + ' path: ' +
                    path, 'debug', 'static-handler');

            for (i = 0; i < result.length; i += 1) {
                if (!result[i].content) {
                    store.getResourceContent(result[i].res, readHandler(i, result[i].path));
                } else {
                    counter += 1;
                }
            }

            // in case we get everything from cache
            tryToFlush();

        } else {

            next();
            return;

        }

    };
}


/**
 * Export function to create the static handler.
 * @param {Object} config The configuration data for the handler.
 * @return {Object} A static handler.
 */
module.exports = function (config) {
    return staticProvider(config.store, config.logger, config.Y);
};
