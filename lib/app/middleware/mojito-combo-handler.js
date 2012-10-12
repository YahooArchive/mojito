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

    // This dummy templace will be use to produce the loader content.
    // TODO: we should use YUI.applyConfig() instead of the internal
    //       YUI.Env API, but that's pending due a bug in YUI:
    //       http://yuilibrary.com/projects/yui3/ticket/2532854
    LOADER_MODULE_TEMPLATE = 'YUI.add("loader",function(Y){' +
                                'YUI.Env[Y.version].modules=YUI.Env[Y.version].modules||{metadata};' +
                             '}, "", {requires:["loader-base"]});';

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

function processMeta(resolvedMods, modules, expanded_modules, langs, conditions) {
    var m,
        l,
        i,
        module,
        name,
        mod,
        lang,
        bundle;

    for (m in resolvedMods) {
        if (resolvedMods.hasOwnProperty(m)) {
            module = resolvedMods[m];

            mod = name = module.name;
            bundle = name.indexOf('lang/') === 0;
            lang = bundle && REGEX_LOCALE.exec(name);

            if (lang) {
                mod = mod.slice(0, lang.index); // eg. lang/foo_en-US -> lang/foo
                lang = lang[1];
                // TODO: validate lang
                langs.push(lang); // eg. en-US
            }
            mod = bundle ? mod.slice(5) : mod; // eg. lang/foo -> foo

            // language manipulation
            // TODO: this routine is very restrictive, and we might want to
            // make it optional later on.
            if (module.lang) {
                module.lang = ['{langToken}'];
            }
            if (bundle) {
                module.owner = mod;
                // applying some extra optimizations
                module.langPack = lang || '*';
                module.intl = true;
                delete module.expanded_map;
            }

            if (module.condition && module.condition.test) {
                conditions[module.name] = module.condition.test.toString();
                module.condition.test = "{" + module.name + "}";
            }

            modules[module.name] = {};
            if (module.type === 'css') {
                modules[module.name].type = 'css';
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


function produceMeta(meta, name) {
    var token = '',
        path  = '',
        lang = REGEX_LOCALE.exec(name);

    if (lang && lang[1] && meta[lang[1]]) {
        lang = lang[1]; // eg. en-US
        token = '"' + lang + '"';
        path  = '_' + lang;
        meta = meta[lang];
    } else {
        meta = meta['*']; // default in case they use invalid lang
    }
    return LOADER_MODULE_TEMPLATE
        .replace('{metadata}', meta)
        .replace(REGEX_LANG_TOKEN, token)
        .replace(REGEX_LANG_PATH,  path);
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
    var appConfig = store.getAppConfig(store.getStaticContext()),
        options = appConfig.staticHandling || {},
        cache = options.cache,
        maxAge = options.maxAge,
        urls = store.getAllModulesURLs(),
        lang,

        // collecting client side metadata
        mojits = store.yui.getConfigAllMojits('client', {}),
        shared = store.yui.getConfigShared('client', {}, false),
        modules_config,
        Y,
        loader,
        resolved,
        appMetaData = {},
        appResolvedMetaData = {},

        // other structures
        langs = ['*'],         // language wildcard
        expanded_modules = {}, // expanded meta (including fullpaths)
        modules = {},          // regular meta  (a la loader-yui3)
        conditions = {},       // hash to store conditional functions
        name,
        i;

    logger = globalLogger;

    Y = YUI({
        fetchCSS: true,
        combine: true,
        base: "/combo?",
        comboBase: "/combo?",
        root: ""
    }, ((appConfig.yui && appConfig.yui.config && appConfig.yui.config.config) || {}));

    modules_config = Y.merge((mojits.modules || {}), (shared.modules || {}));
    Y.applyConfig({
        modules: modules_config,
        useSync: true
    });
    Y.use('loader');

    // using the loader at the server side to compute the loader metadata
    // to avoid loading the whole thing on demand.
    loader = new Y.Loader({
        require: Y.Object.keys(modules_config)
    });
    resolved = loader.resolve(true);

    if (cache && !maxAge) {
        maxAge = cache;
    }
    maxAge = maxAge || 0;

    processMeta(resolved.jsMods,  modules, expanded_modules, langs, conditions);
    processMeta(resolved.cssMods, modules, expanded_modules, langs, conditions);

    for (i = 0; i < langs.length; i += 1) {
        lang = langs[i];

        appMetaData[lang] = {};
        appResolvedMetaData[lang] = {};

        for (name in expanded_modules) {
            if (expanded_modules.hasOwnProperty(name)) {
                if (expanded_modules[name].owner &&
                        !expanded_modules[expanded_modules[name].owner]) {
                    // if there is not a module corresponding with the lang pack
                    // that means the controller doesn't have client affinity,
                    // in that case, we don't need to ship it.
                    continue;
                }
                if ((lang === '*') ||
                        (expanded_modules[name].langPack === '*') ||
                        (!expanded_modules[name].langPack) ||
                        (lang === expanded_modules[name].langPack)) {

                    appMetaData[lang][name] = modules[name];
                    appResolvedMetaData[lang][name] = expanded_modules[name];

                }
            }
        }

        appMetaData[lang]         = JSON.stringify(appMetaData[lang]);
        appResolvedMetaData[lang] = JSON.stringify(appResolvedMetaData[lang]);

        for (name in conditions) {
            if (conditions.hasOwnProperty(name)) {
                appMetaData[lang] = appMetaData[lang]
                    .replace('"{' + name + '}"', conditions[name]);
                appResolvedMetaData[lang] = appResolvedMetaData[lang]
                    .replace('"{' + name + '}"', conditions[name]);
            }
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
            ext = '',
            result = [],
            counter = 0,
            i = 0,
            hit,
            head = (req.method === 'HEAD');

        // only combo requests are allow here
        if (url.pathname !== '/combo' || !url.query) {
            return next();
        }

        logger.log('serving combo url: ' + url.query, 'debug', NAME);

        // YIV might be messing around with the querystring params
        // trying to formalize them by adding = and transforming /
        // so we need to revert back to / and remove the =
        // TODO: this might not work in Windows
        files = url.query.replace(/[=]/g, '').replace(/%2F/g, '/').split('&');

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

        // validating all files before doing anything else
        // so errors can be found early on.
        for (i = 0; i < files.length; i += 1) {

            // something like:
            // - foo/bar-min.js becomes "bar"
            // - foo/lang/bar_en-US.js becomes "lang/bar_en-US"
            module = (files[i].indexOf('/lang/') >= 0 ? 'lang/' : '') +
                libpath.basename(files[i], ext).replace(/\-(min|debug)$/, '');

            if (module.indexOf('loader-app-base') === 0) {
                result[i] = {
                    fullpath: module,
                    content: produceMeta(appMetaData, module)
                };
            } else if (module.indexOf('loader-app-full') === 0) {
                result[i] = {
                    fullpath: module,
                    content: produceMeta(appResolvedMetaData, module)
                };
            } else if (urls[module]) {
                result[i] = {
                    fullpath: urls[module],
                    content: ''
                };
            } else if (loader.moduleInfo[module] && loader.moduleInfo[module].path) {
                result[i] = {
                    fullpath: libpath.join(__dirname,
                        '../../../node_modules/yui', loader.moduleInfo[module].path),
                    content: ''
                };
            } else {
                logger.log('Invalid module name: ' + module, 'warn', NAME);
                res.writeHead(400);
                res.end(undefined);
                break;
            }

        }

        // async queue implementation
        if (files.length > 0 && (result.length === files.length)) {
            for (i = 0; i < result.length; i += 1) {
                filename = result[i].fullpath;
                if (result[i].content) {
                    // if we already have content in memory, let's
                    // just use it directly.
                    readHandler(i, filename)(null, result[i].content);
                } else {
                    try {
                        libfs.readFile(filename, readHandler(i, filename));
                    } catch (err) {
                        logger.log('Error reading: ' + filename, 'error', NAME);
                        // this should never happen, if the module is in loader
                        // meta, it should be in disk as well.
                        res.writeHead(400);
                        res.end(undefined);
                        break;
                    }
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
