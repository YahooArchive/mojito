/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, regexp:true, stupid:true*/


var libpath = require('path'),
    utils = require(libpath.join(__dirname, '../../management/utils')),
    fs = require('fs'),
    libqs = require('querystring'),
    MODE_755 = parseInt('755', 8),
    getSpecURL,
    mkdirP,
    rmdirR,
    writeWebPagesToFiles,
    YUI = require('yui').YUI,
    Y = YUI({useSync: true}).use('json-parse', 'json-stringify', 'escape');

Y.applyConfig({useSync: false});

/**
 * The usage string for this command.
 */
exports.usage = 'mojito build {type} [destination]\n' +
    "\t- type: 'html5app'\n" +
    '\t- destination: (optional) the directory where the build output goes.\n' +
    "\t  By default this is the type i.e. './artifacts/builds/<type>'\n" +
    '\nOPTIONS: \n' +
    '\t --replace: Tells the build system to delete the destination' +
    ' directory and replace it.\n' +
    '\t        -r: Short for --replace\n' +
    '\t --context: Tells the build system what context to build with' +
    ' i.e. device=iphone&lang=en-GB.\n' +
    '\t        -c: Short for --context\n';

/**
 * The options list for this command.
 */
exports.options = [
    {
        shortName: 'r',
        longName: 'replace',
        hasValue: false
    },
    {
        shortName: 'm',
        longName: 'mojit',
        hasValue: true
    },
    {
        shortName: 'c',
        longName: 'context',
        hasValue: true
    }
];


/**
 * The run() method which handles processing for this command.
 * @param {Array} params Optional parameters to the command.
 * @param {Object} options Optional options for the command.
 * @param {Function} callback Function to invoke on commmand completion.
 */
exports.run = function(params, options, callback) {
    var store,
        type = 'html5app',
        cwd = process.cwd(),
        destination,
        appConfig,
        config = {};

    Y.applyConfig({
        useSync: true,
        modules: {
            'mojito-resource-store': {
                fullpath: libpath.join(__dirname, '../../store.server.js')
            }
        }
    });
    Y.use('mojito-resource-store');
    Y.applyConfig({useSync: false});
    store = new Y.mojito.ResourceStore({
        root: cwd,
        context: {}
    });

    if (!params[0]) {
        params[0] = '';
    }

    switch (params[0].toUpperCase()) {
    case 'HTML5APP':
        type = 'html5app';
        break;
    default:
        utils.error("Can only build type '" + type + "'", exports.usage);
        return;
    }

    // Set the destination for the generated files
    if (params[1] && params[1][0] === '/') {
        destination = libpath.join(params[1]);
    } else if (params[1]) {
        destination = libpath.join(cwd, params[1]);
    } else {
        destination = libpath.join(cwd, 'artifacts/builds', type);
    }

    // Are we in a Mojito App?
    utils.isMojitoApp(cwd, exports.usage, true);

    appConfig = store.getStaticAppConfig();
    // Is there a "builds" section for this "type" in the appConfig
    if (appConfig.builds && appConfig.builds[type]) {
        config = appConfig.builds[type];
    }

    if (options.replace) {
        try {
            rmdirR(destination);
            console.log('Removing all files in folder "' + destination + '"');
        } catch (err2) {    // err2 to get past JSLint
            // Dirty way to check dir
        }
    }

    exports['build' + type](options, store, config, destination, callback);
};


/**
 * The build command itself.
 * @param {Object} cmdOptions Options for the command.
 * @param {Object} store The relevant resource store reference.
 * @param {Object} config Configuration data for the context.
 * @param {string} destination A path to target with build output.
 * @param {Function} callback A function to invoke on completion.
 */
exports.buildhtml5app = function(cmdOptions, store, config, destination,
    callback) {

    var type = 'HTML5 Application',
        i,
        from,
        to,
        // files to fetch through the server
        serverFiles = { css: true, js: true, json: true },
        extension,
        manifest = 'CACHE MANIFEST\n',
        indexJs = "module.exports = require('express')." +
            "createServer(require('express')['static'](__dirname));",
        url,
        storeURLs,
        urls = {}, // from: to
        app,
        context = '',
        contextObj = libqs.parse(cmdOptions.context),
        appConfig,
        tunnelPrefix,
        dynamicURLs = {},
        mr,
        mojitRes,
        mojitRess,
        sr,
        specRes,
        specRess,
        id;

    if (typeof cmdOptions.context === 'string') {
        // Parse the context into an object
        config.context = utils.contextCsvToObject(cmdOptions.context);
        // Stringify the context object into query string
        context = '?' + libqs.stringify(config.context);
    }

    urls['/' + context] = '/index.html';

    if (config.urls && config.urls.length) {
        for (i = 0; i < config.urls.length; i += 1) {
            urls[config.urls[i] + context] = config.urls[i];
        }
    }

    store.preload();

    appConfig = store.getAppConfig(contextObj);
    tunnelPrefix = appConfig.tunnelPrefix || '/tunnel';

    console.log('Building a "' + type + '" of the Mojito application at "' +
        store._config.root + '"');

    console.log('...');

    // Set the cachable files in the manifest
    manifest += 'CACHE:\n';

    // Copy all the files into the destination directory
    storeURLs = store.getAllURLs();
    for (url in storeURLs) {
        if (storeURLs.hasOwnProperty(url)) {
            from = storeURLs[url];  // filesystem path
            to = libpath.join(destination, url);
            extension = from.split('.').pop();

            mkdirP(libpath.dirname(to), MODE_755);

            manifest += url + '\n';

            if (serverFiles[extension]) {
                urls[url + context] = url;
                mkdirP(libpath.dirname(libpath.join(destination, url)),
                    MODE_755);
            } else {
                fs.writeFileSync(to, fs.readFileSync(from), 'utf8');
            }
        }
    }

    mojitRess = store.getResources('client', contextObj, {type: 'mojit'});
    for (mr = 0; mr < mojitRess.length; mr += 1) {
        mojitRes = mojitRess[mr];
        if (!mojitRes.url) {
            continue;
        }
        url = mojitRes.url + '/definition.json';
        dynamicURLs[url] = true;

        specRess = store.getResources('client', contextObj, {type: 'spec', mojit: mojitRes.name});
        for (sr = 0; sr < specRess.length; sr += 1) {
            specRes = specRess[sr];
            dynamicURLs[specRes.url] = true;
        }
    }

    for (id in appConfig.specs) {
        if (appConfig.specs.hasOwnProperty(id)) {
            url = getSpecURL(appConfig, id);
            dynamicURLs[url] = true;
        }
    }

    // Get all the dynamic URLs we have to call via the "tunnel"
    for (url in dynamicURLs) {
        if (dynamicURLs.hasOwnProperty(url)) {
            urls[tunnelPrefix + url + context] = url;
            mkdirP(libpath.dirname(libpath.join(destination, url)), MODE_755);
        }
    }

    for (url in urls) {
        if (urls.hasOwnProperty(url)) {
            manifest += (urls[url] === '/' ? '/index.html' : urls[url]) + '\n';
        }
    }

    // Write the "cache.manifest" file
    fs.writeFileSync(libpath.join(destination, 'cache.manifest'), manifest,
        'utf8');

    // Write a "quick test" index.js file
    fs.writeFileSync(libpath.join(destination, 'index.js'), indexJs, 'utf8');

    // Now use the server to generate some of the files
    writeWebPagesToFiles(type, store, destination, urls, config, callback);
};


getSpecURL = function(appConfig, id) {
    var prefix = '/static',
        parts = id.split(':'),
        typeName = parts[0],
        specName = parts[1] || 'default',
        ns = typeName.replace(/\./g, '_'),
        url;

    if (appConfig && appConfig.staticHandling &&
            appConfig.staticHandling.hasOwnProperty('prefix')) {
        prefix = (appConfig.staticHandling.prefix ? '/' +
            appConfig.staticHandling.prefix : '');
    }
    url = prefix + '/' + typeName + '/specs/' + specName + '.json';
    return url;
};


mkdirP = function(p, mode) {
    var ps = libpath.normalize(p).split('/'),
        i;

    for (i = 0; i <= ps.length; i += 1) {
        try {
            fs.mkdirSync(ps.slice(0, i).join('/'), mode);
        } catch (err) {
            // Dirty way to check dir
        }
    }
};


rmdirR = function(path) {
    var files = fs.readdirSync(path),
        currDir = path,
        i,
        currFile;

    /* Loop through and delete everything in the sub-tree after checking it */
    for (i = 0; i < files.length; i += 1) {
        currFile = fs.statSync(currDir + '/' + files[i]);

        if (currFile.isDirectory()) {
            // Recursive function back to the beginning
            rmdirR(currDir + '/' + files[i]);
        } else if (currFile.isSymbolicLink()) {
            // Unlink symlinks
            fs.unlinkSync(currDir + '/' + files[i]);
        } else {
            // Assume it's a file - perhaps a try/catch belongs here?
            fs.unlinkSync(currDir + '/' + files[i]);
        }
    }

    /*
     * Now that we know everything in the sub-tree has been deleted,
     * we can delete the main directory.
     */
    return fs.rmdirSync(path);
};


/**
 * Calculates the filesystem path to get from source to destination.
 *
 * @private
 * @param {string} dst The destination directory.
 * @param {string} src The source directory.
 * @return {string} The path from source to destination.
 */
function pathTo(dst, src) {
    var dstParts,
        srcParts,
        i,
        j,
        path = [];

    // trimming leading and trailing slashes removes nasty corner cases from the
    // algorithm
    if ('/' === dst.charAt(0)) {
        dst = dst.substring(1);
    }
    if ('/' === dst.charAt(dst.length - 1)) {
        dst = dst.substring(0, dst.length - 1);
    }
    if ('/' === src.charAt(0)) {
        src = src.substring(1);
    }
    if ('/' === src.charAt(src.length - 1)) {
        src = src.substring(0, src.length - 1);
    }

    dstParts = dst ? dst.split('/') : [];
    srcParts = src ? src.split('/') : [];
    path = [];
    for (i = 0; i < dstParts.length && i < srcParts.length; i += 1) {
        if (dstParts[i] !== srcParts[i]) {
            break;
        }
    }
    for (j = i; j < srcParts.length; j += 1) {
        path.push('..');
    }
    for (j = i; j < dstParts.length; j += 1) {
        path.push(dstParts[j]);
    }
    return libpath.join.apply(libpath, path) || '.';
}


/**
 * Adds the HTML5 cache manifest to the <html>
 *
 * @private
 * @param {string} root The directory where html5app is being built into.
 * @param {string} relativePath The file path, relative to root.
 * @param {string} content The body of the file.
 * @param {Boolean} force Whether to fixup the content, even though the path
 *     might not end in .html.
 * @return {string} The fixed up content.
 */
function attachManifest(root, relativePath, content, force) {
    var extname = libpath.extname(relativePath),
        dirname,
        pathToRoot;

    if (force || '.html' === extname) {
        dirname = libpath.dirname(relativePath);
        pathToRoot = pathTo('/', dirname);

        content = content.replace(/<html>/, '<html manifest="' + pathToRoot +
            '/cache.manifest">');
    }

    return content;
}


/**
 * Changes server-relative paths to file-relative paths.
 *
 * @private
 * @param {string} root The directory where html5app is being built into.
 * @param {string} relativePath The file path, relative to root.
 * @param {string} content The body of the file.
 * @param {Boolean} force Whether to fixup the content, even though the path
 *     might not end in .html.
 * @return {string} The fixed up content.
 */
function forceRelativePaths(root, relativePath, content, force) {
    var extname = libpath.extname(relativePath),
        dirname;

    if (force || '.html' === extname) {
        dirname = libpath.dirname(relativePath);

        content = content.replace(/(src|href)="([^"]+)"/g,
            function(all, name, val) {
                // FUTURE:  once the "/" aren't escaped, we can do this easier
                var fixed = utils.decodeHTMLEntities(val);
                if ('/' === fixed.charAt(0)) {
                    fixed = libpath.join(pathTo(libpath.dirname(fixed), dirname),
                        libpath.basename(fixed));
                }
                fixed = Y.Escape.html(fixed);
                return name + '="' + fixed + '"';
            });
    }

    return content;
}


writeWebPagesToFiles = function(type, store, destination, urls, config,
        callback) {
    var options,
        userPages = {},
        i,
        app;

    if (config.urls) {
        // If the user is using builds.html5app.attachManifest or
        // .forceRelativePaths, we explicitly want to fix those URLs which are
        // pages (the ones they've specified).
        for (i = 0; i < config.urls.length; i += 1) {
            userPages[config.urls[i]] = true;
        }
    }

    options = {
        port: 11111,
        context: config.context
    };

    app = new utils.App(options);

    app.start(function(err) {
        var got = 0,
            need;

        if (err) {
            utils.error(err);
            return;
        }
        need = Object.keys(urls).length;

        Object.keys(urls).forEach(function(u) {
            var opts = {
                    headers: {
                        'x-mojito-build': 'html5app',
                        'x-mojito-build-path-to-root': pathTo('/',
                            libpath.dirname(urls[u]))
                    }
                };
            app.getWebPage(u, opts, function(err, url, content) {
                var dest;

                got += 1;

                if (err) {
                    utils.error('FAILED to get ' + url + ' with error:\n' +
                                err, null, true);
                } else {
                    if (config.attachManifest) {
                        content = attachManifest(destination, urls[url],
                            content,
                            userPages[url]);
                    }
                    if (config.forceRelativePaths) {
                        content = forceRelativePaths(destination, urls[url],
                            content,
                            userPages[url]
                            );
                    }
                    dest = libpath.join(destination, urls[url]);
                    mkdirP(libpath.dirname(dest), MODE_755);
                    fs.writeFileSync(dest, content, 'utf8');
                }

                if (got === need) {
                    app.close();
                    callback();
                }
            });
        });
    });
};
