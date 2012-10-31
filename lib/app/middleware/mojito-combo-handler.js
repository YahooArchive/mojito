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


/*jslint anon:true, sloppy:true, nomen:true, stupid:true, node: true*/

'use strict';

/*
DECLAIMER: this is VERY experimental, and the purpose of this
middleware is to provide an easy way to load yui modules by their
names rather than the real static path.
    from: @caridy
*/


/*
 * Module dependencies.
 */
var libfs = require('fs'),
    mime = require('mime'),
    libpath = require('path'),
    YUI = require(libpath.join(__dirname, '..', '..', 'yui-sandbox.js')).getYUI(),
    parseUrl = require('url').parse,
    logger,
    NAME = 'ComboHandler',

    MODULE_META_ENTRIES          = ['requires', 'use', 'optional', 'skinnable', 'after', 'condition'],
    // TODO: revisit this list with @davglass
    MODULE_META_PRIVATE_ENTRIES  = ['after', 'expanded', 'supersedes', 'ext', '_parsed', '_inspected',
                                    'skinCache', 'langCache'],

    REGEX_LANG_TOKEN = /\"\{langToken\}\"/g,
    REGEX_LANG_PATH  = /\{langPath\}/g,
    REGEX_LOCALE     = /\_([a-z]{2}(-[A-Z]{2})?)$/,

    DEFAULT_HEADERS = {
        '.js': {
            'Content-Type': 'application/javascript; charset=utf-8'
        },
        '.css': {
            'Content-Type': 'text/css; charset=utf-8'
        }
    },

    MODULE_TEMPLATES = {
        'loader-app-base':
            'YUI.add("loader-app-base",function(Y){' +
                'Y.applyConfig({groups:{app:{' +
                    'combine:true,' +
                    'maxURLLength:1024,' +
                    'base:"/static/",' +
                    'comboBase:"/static/combo?",' +
                    'root:"",' +
                    'modules:{app-base}' +
                '}}});' +
            '},"",{requires:["loader-base"]});',
        'loader-app-full':
            'YUI.add("loader-app-full",function(Y){' +
                'Y.applyConfig({groups:{app:{' +
                    'combine:true,' +
                    'maxURLLength:1024,' +
                    'base:"/static/",' +
                    'comboBase:"/static/combo?",' +
                    'root:"",' +
                    'modules:{app-full}' +
                '}}});' +
            '},"",{requires:["loader-base"]});',

        'loader':
            'YUI.add("loader",function(Y){' +
            '},"",{requires:["loader-base","loader-yui3","loader-app-base"]});',

        'loader-lock':
            'YUI.add("loader",function(Y){' +
                // TODO: we should use YUI.applyConfig() instead of the internal
                //       YUI.Env API, but that's pending due a bug in YUI:
                //       http://yuilibrary.com/projects/yui3/ticket/2532854
                'YUI.Env[Y.version].modules=YUI.Env[Y.version].modules||' +
                '{yui-base};' +
            '},"",{requires:["loader-base","loader-app-base"]});',

        'loader-full':
            'YUI.add("loader",function(Y){' +
                // TODO: we should use YUI.applyConfig() instead of the internal
                //       YUI.Env API, but that's pending due a bug in YUI:
                //       http://yuilibrary.com/projects/yui3/ticket/2532854
                'YUI.Env[Y.version].modules=YUI.Env[Y.version].modules||' +
                '{yui-full};' +
            '},"",{requires:["loader-base","loader-app-full"]});'
    };


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


function getModuleResources(store) {
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
                               'client affinity.', 'error', NAME);
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
function staticProvider(store, globalLogger) {
    var appConfig = store.getAppConfig(),
        options = appConfig.staticHandling || {},
        cache = options.cache,
        maxAge = options.maxAge,
        moduleRess,
        Y,
        loader,
        i;

    logger = globalLogger;

    moduleRess = getModuleResources(store);

    Y = YUI({
        fetchCSS: true,
        combine: true,
        base: "/static/combo?",
        comboBase: "/static/combo?",
        root: ""
    }, ((appConfig.yui && appConfig.yui.config && appConfig.yui.config.config) || {}));

    // used to find the the modules in YUI itself
    Y.use('loader');
    loader = new Y.Loader();

    if (cache && !maxAge) {
        maxAge = cache;
    }
    maxAge = maxAge || 0;

    return function(req, res, next) {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return next();
        }

        var url = parseUrl(req.url),
            files = [],
            module,
            ext,
            result = [],
            failures = 0,
            counter = 0,
            i = 0,
            head = (req.method === 'HEAD');

        // only combo requests are allow here
        if (libpath.basename(url.pathname) !== 'combo' || !url.query) {
            return next();
        }

        logger.log('serving combo url: ' + url.query, 'debug', NAME);

        // YIV might be messing around with the querystring params
        // trying to formalize them by adding = and transforming /
        // so we need to revert back to / and remove the =
        // TODO: this might not work in Windows
        files = url.query.replace(/[=]/g, '').replace(/%2F/g, '/').split('&');

        if (files.length === 0) {
            // probably an empty /combo? request
            res.writeHead(400);
            res.end(undefined);
            return;
        }

        // combo response's content-type should be
        // resolved from the first file in the list
        ext = libpath.extname(files[0]);

        if (!ext || !DEFAULT_HEADERS.hasOwnProperty(ext)) {
            // probably an invalid request
            res.writeHead(400);
            res.end(undefined);
            return;
        }

        function readHandler(index, module) {
            return function (err, data) {
                var headers,
                    content = '',
                    j;

                counter += 1;
                if (err) {
                    logger.log('NOT FOUND: ' + module, 'error', NAME);
                    failures += 1;
                } else {
                    result[index].content = data;
                }
                if (counter === files.length) {
                    if (failures) {
                        res.writeHead(400);
                        res.end(undefined);
                        return;
                    }
                    for (j = 0; j < counter; j += 1) {
                        content += result[j].content;
                    }
                    // FUTURE:  use libfs.stat for last-modified
                    headers = Y.merge({
                        'Content-Length': content.length,
                        'Last-Modified': new Date().toUTCString(),
                        'Cache-Control': 'public max-age=' + (maxAge / 1000)
                    }, (DEFAULT_HEADERS[ext] || {}));

                    res.writeHead(200, headers);
                    res.end(head ? undefined : content);
                }
            };
        }

        // validating all files before doing anything else
        // so errors can be found early on.
        for (i = 0; i < files.length; i += 1) {
            // something like:
            // - foo/bar-min.js becomes "bar"
            // - foo/lang/bar_en-US.js becomes "lang/bar_en-US"
            module = (files[i].indexOf('/lang/') >= 0 ? 'lang/' : '') +
                libpath.basename(files[i], ext).replace(/\-(min|debug)$/, '');

            if (moduleRess[module]) {
                // geting an app module
                result[i] = {
                    module: module,
                    res: moduleRess[module]
                };
            } else if (loader.moduleInfo[module] && loader.moduleInfo[module].path) {
                // getting a yui module
                result[i] = {
                    module: module,
                    fullpath: libpath.join(__dirname,
                        '../../../node_modules/yui', loader.moduleInfo[module].path)
                };
            } else {
                logger.log('Invalid module name: ' + module, 'error', NAME);
                res.writeHead(400);
                res.end(undefined);
                return;
            }
        }

        // async queue implementation
        if (files.length > 0 && (result.length === files.length)) {
            for (i = 0; i < result.length; i += 1) {
                if (result[i].content) {
                    // if we already have content in memory, let's
                    // just use it directly.
                    readHandler(i, module)(null, result[i].content);
                } else if (result[i].res) {
                    store.getResourceContent(result[i].res, readHandler(i, module));
                } else if (result[i].fullpath) {
                    try {
                        libfs.readFile(result[i].fullpath, readHandler(i, module));
                    } catch (err) {
                        logger.log('Error reading: ' + result[i].module, 'error', NAME);
                        // this should never happen, if the module is in loader
                        // meta, it should be in disk as well.
                        res.writeHead(400);
                        res.end(undefined);
                        break;
                    }
                }
                // no "else" clause since result[i] either has .res or .fullpath
            }
        }

    };  // middleware handler
}


/**
 * Export function to create the static handler.
 * @param {Object} config The configuration data for the handler.
 * @return {Object} A static handler.
 */
module.exports = function(config) {
    return staticProvider(config.store, config.logger, config.Y);
};
