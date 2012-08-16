/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp:true, nomen:true, stupid:true*/


var libpath = require('path'),
    libfs = require('fs'),
    existsSync = libfs.existsSync || libpath.existsSync,
    libutils = require(libpath.join(__dirname, '../../management/utils')),

    // private compilation function container
    compile = {},
    // private messages, to be printed upon completion
    msgs = [],

    compileType,

    // private functions
    mkdirP,
    rmdirR,
    getContentFromUrl,
    removeFile,
    clean,
    everything,

    // private class
    YuiModuleCacheWriter,

    // public exports
    usage,
    options,
    run,
    YuiModuleCacher,
    Y = require('yui').YUI({useSync: true}).use('json-parse', 'json-stringify', 'async-queue');

Y.applyConfig({useSync: false});


usage = 'mojito compile {options} {type}\n' +
    '\nOPTIONS: \n' +
    '\t --remove     :  remove all compiled files, instead of creating them\n' +
    '\t  -r          :  short for --remove\n' +
    '\t --app        :  perform the action for the app-level items ' +
    '(if applicable)\n' +
    '\t  -a          :  short for --app\n' +
    '\t --everything :  compile everything possible\n' +
    '\t  -e          :  short for --everything\n' +
    '\t --clean      :  clean up all compiled modules\n' +
    '\t  -c          :  short for --clean\n' +
    '\t --core       :  compile only mojito core (only applies to rollups)\n' +
    '\t  -o          :  short for --core\n' +
    '\t --verbose    :  for verbose output\n' +
    '\t  -v          :  short for --verbose\n' +
    '\t --port       :  if a server is started, specify the port\n' +
    '\t  -p          :  short for --port\n\n' +
    '\nTYPES: \n' +
    '\tall        performs all the other types\n' +
    '\tinlinecss  creates files for inlining the css into the page\n' +
    '\tjson       reads specs, definitions, and defaults and compiles ' +
    'them into JS\n' +
    '\tviews      precompiles the views to speed rendering\n' +
    '\trollups    creates rollup files to reduce the number of scripts\n';


options = [
    {
        shortName: 'r',
        longName: 'remove',
        hasValue: false
    },
    {
        shortName: 'c',
        longName: 'clean',
        hasValue: false
    },
    {
        shortName: 'o',
        longName: 'core',
        hasValue: false
    },
    {
        shortName: 'e',
        longName: 'everything',
        hasValue: false
    },
    {
        shortName: 'v',
        longName: 'verbose',
        hasValue: false
    },
    {
        shortName: 'p',
        longName: 'port',
        hasValue: true
    },
    {
        shortName: 'a',
        longName: 'app',
        hasValue: false
    }
];


/**
 * Returns details on how to make inline CSS for mojits.
 *
 * This example comes from (a modified) GSG5.
 * [ {
 *      mojitName: 'FlickrDetail',
 *      yuiModuleName: 'inlinecss/FlickrDetail',
 *      dest: '/blah/mojits/FlickrDetail/autoload/compiled' +
 *          '/css.iphone.client.js',
 *      srcs: {
 *          '/static/FlickrDetail/assets/index.css': true,
 *          '/static/FlickrDetail/assets/message.css': true
 *   }
 * ]
 *
 * @method getInlineCssMojits
 * @param store {string} resource store
 * @param env {string} "client" or "server"
 * @param context {object} runtime context
 * @return {array} object describing where to put the inline CSS file and what it should contain
 */
function getInlineCssMojits(store, env, context) {
    var m,
        mojit,
        mojits,
        mojitRes,
        r,
        res,
        ress,
        selector,
        dest,
        srcs,
        inlines = [];

    mojits = store.listAllMojits();
    for (m = 0; m < mojits.length; m += 1) {
        mojit = mojits[m];

        mojitRes = store.getResources('client', context, {type: 'mojit', name: mojit});
        mojitRes = mojitRes[0];
        if ('mojito' === mojitRes.source.pkg.name) {
            // don't write framework-provided inlinecss into the framework directory
            continue;
        }

        // TODO:  This isn't quite right, since multiple contexts might map to
        // posls with the same lead selector.
        selector = store.selector.getPOSLFromContext(context)[0];

        srcs = [];
        ress = store.getResources(env, context, {mojit: mojit});
        for (r = 0; r < ress.length; r += 1) {
            res = ress[r];
            if (mojit !== res.mojit) {
                continue;
            }
            if ((res.type === 'asset') && (res.subtype === 'css')) {
                srcs[res.url] = true;
            }
        }
        dest = 'autoload/compiled/inlinecss' + ('*' === selector ? '' : '.' +
            selector) + '.common.js';
        dest = libpath.join(mojitRes.source.fs.fullPath, dest);
        if (Object.keys(srcs).length) {
            inlines.push({
                mojitName: mojit,
                yuiModuleName: 'inlinecss/' + mojit,
                dest: dest,
                srcs: srcs
            });
        }
    } // for each mojit

    return inlines;
}


/**
 * Creates the Resource Store object.
 * @private
 * @method MakeStore
 * @param {Object} cfg Configuration for the resource store.
 * @return {ResourceStore} the new resource store object
 */
function makeStore(cfg) {
    var store;
    Y.applyConfig({
        useSync: true,
        modules: {
            'mojito-resource-store': {
                fullpath: libpath.join(__dirname, '../../store.server.js')
            }
        }
    });
    Y.use('mojito-resource-store');
    store = new Y.mojito.ResourceStore(cfg);
    Y.applyConfig({useSync: true});
    return store;
}


run = function(params, options, callback) {
    var cwd = process.cwd(),
        displayResults,
        type,
        context = {};

    // TODO: don't assign to a parameter.
    options = options || {};

    libutils.isMojitoApp(cwd, exports.usage, true);

    if (options.context) {
        // TODO: parseURL.
        context = options.context;
    }

    displayResults = function(err) {
        libutils.log('');
        msgs.forEach(function(msg) {
            libutils.log(msg);
        });
        libutils.log('');
        callback(err);
    };

    if (options.clean) {
        return clean(context, options, displayResults);
    }

    if (options.everything) {
        compileType = 'all';
        return everything(context, options, displayResults);
    }

    compileType = type = params.shift();

    if (!type) {
        libutils.error('Please provide the type of compilation you want.',
            exports.usage, true);
    }
    if (!compile[type]) {
        libutils.error("Unknown type '" + type + "'", exports.usage, true);
    }

    compile[type](context, options, displayResults);
};


/**
 * Compiles all assets.
 * @param {object} context The context.
 * @param {object} options Command options.
 * @param {function} callback Function to invoke upon completion.
 */
compile.all = function(context, options, callback) {
    var actions = [
        'inlinecss',
        'views',
        'json',
        // compile the rollups last, so that the other parts are included
        'rollups'
    ];

    if (options.remove) {
        actions = [
            // remove the rollups FIRST, so that we see rollups from
            // mojits that JUST have compiled inlinecss or views
            'rollups',
            'json',
            'inlinecss',
            'views'
        ];
    }

    function runOne() {
        var action = actions.shift();

        if (!action) {
            return callback();
        }
        if (options.verbose) {
            libutils.log('executing -- ' + action.toUpperCase() + ' --');
        }
        compile[action](context, options, function(err) {
            if (err) {
                return callback(err);
            }
            if (options.verbose) {
                libutils.log('done -- ' + action.toUpperCase() + ' --\n\n');
            }
            runOne();
        });
    }
    runOne();
};


/**
 * Compiles css assets.
 * @param {object} context The context.
 * @param {object} options Command options.
 * @param {function} callback Function to invoke upon completion.
 * @return {object} The return value from any optional callback function.
 */
compile.inlinecss = function(context, options, callback) {
    var app,
        action = options.remove ? 'Removed' : 'Created',
        processed = 0,
        cwd = process.cwd(),
        urlMatcher = /url\(([^)]+)\)/g,
        inlines,
        inlineNext;

    app = new libutils.App({
        port: options.port || 11111,
        verbose: options.verbose
    });

    if (options.app) {
        libutils.warn('Creating app-level inline css not supported\n');
        return callback();
    }

    inlineNext = function(store, cb) {
        var inline = inlines.shift(),
            mojitName,
            yuiModuleCacheWriter,
            inliner,
            shortDest,
            i,
            url,
            storeURLs,
            fs2url = {},
            srcKey,
            srcDir,
            total,
            count = 0;

        // if there are no more inlines to process, we'll end here
        if (!inline) {
            return cb();
        }

        mojitName = inline.mojitName;

        // need a reverse mapping
        storeURLs = store.getAllURLs();
        for (url in storeURLs) {
            if (storeURLs.hasOwnProperty(url)) {
                fs2url[storeURLs[url]] = url;
            }
        }

        shortDest = inline.dest;
        if (cwd === shortDest.substr(0, cwd.length)) {
            shortDest = shortDest.substr(cwd.length + 1);
        }

        // for CSS inline file removal:
        if (options.remove) {
            if (removeFile(inline.dest)) {
                if (options.verbose) {
                    libutils.log('Removed: ' + inline.dest);
                }
                processed += 1;
                // on to the next one
            }
            inlineNext(store, cb);
            return;
        }

        // for CSS inline file creation:
        total = Object.keys(inline.srcs).length;

        // start of the script body
        yuiModuleCacheWriter = new YuiModuleCacheWriter(inline.yuiModuleName,
            inline.dest, options);

        inliner = function(srcKey) {
            // go to the running application to get the live content for
            // this CSS URL
            getContentFromUrl(app, srcKey, function(content) {
                var contentString;

                // update all the content's url() blocks with proper
                // paths
                content = content.replace(urlMatcher, function(whole,
                                                               url) {
                    var fs;

                    if ('"' === url.substr(0, 1)) {
                        url = url.substr(1, url.length - 2);
                    }
                    if ("'" === url.substr(0, 1)) {
                        url = url.substr(1, url.length - 2);
                    }
                    if ('/' === url.substr(0, 1)) {
                        return whole;
                    }
                    if ('#' === url.substr(0, 1)) {
                        return whole;
                    }
                    if ('http' === url.substr(0, 4)) {
                        return whole;
                    }
                    if ('data:' === url.substr(0, 5)) {
                        return whole;
                    }
                    srcDir = libpath.dirname(inline.srcs[srcKey]);
                    fs = libpath.join(srcDir, url);
                    if (!fs2url[fs]) {
                        libutils.warn('couldn\'t normalize url(' + url +
                            ')(' + fs + ') in ' + inline.srcs[srcKey]);
                        return whole;
                    }
                    return 'url(' + fs2url[fs] + ')';
                });

                // remove newlines
                contentString = content.replace(/\n/g, '');

                // inject into the body the CSS for this inline file
                yuiModuleCacheWriter.createNamespace(
                    'compiled.css.inline'
                ).cache(srcKey, contentString);

                // when we're done with all CSS files, close off the
                // file and write it before going on to the next
                // inline
                count += 1;
                if (count === total) {
                    // end of the script body
                    if (yuiModuleCacheWriter.write()) {
                        processed += 1;
                    }
                    inlineNext(store, cb);
                }
            }); // getContentFromUrl()
        };

        // add all the contents of the script body for inline CSS
        for (srcKey in inline.srcs) {
            if (inline.srcs.hasOwnProperty(srcKey)) {
                inliner(srcKey);
            }
        }
    };  // inlineNext

    app.start(function(err, appInstance) {
        var store;

        if (err) {
            libutils.error(err);
        } else {
            store = appInstance.store;
            inlines = getInlineCssMojits(store, 'client', context);

            libutils.log((options.remove ? 'Removing' : 'Creating') +
                ' inline css...');

            inlineNext(store, function(err) {
                try {
                    app.close();
                } catch (err2) {
                    libutils.warn('(app server was not running) ' + err2);
                }

                if (err) {
                    callback(err);
                } else {
                    msgs.push(action + ' compiled inline CSS YUI modules for ' +
                        processed + ' mojits.');
                    callback();
                }
            });
        }
    });

};


/**
 * Compiles rollups.
 * @param {object} context The context.
 * @param {object} options Command options.
 * @param {function} callback Function to invoke upon completion.
 */
compile.rollups = function(context, options, callback) {
    var cwd = process.cwd(),
        store = makeStore({root: cwd, appConfig: { assumeRollups: true}}),
        rollups = {},
        processed = 0,
        r,
        res,
        ress,
        m,
        mojit,
        mojits,
        mojitRes,
        dest,
        s,
        src,
        srcs,
        shortDest,
        rollupBody;

    store.preload();

    libutils.log((options.remove ? 'Removing' : 'Creating') + ' rollups...');

    if (options.app || options.core) {
        // FUTURE:  rollup true-app-level resources somewhere?
        mojits = [ 'shared' ];
    } else {
        mojits = store.listAllMojits();
    }
    if (options.mojit) {
        mojits = [ options.mojit ];
    }

    for (m = 0; m < mojits.length; m += 1) {
        mojit = mojits[m];

        if ('shared' !== mojit) {
            mojitRes = store.getResources('client', context, {type: 'mojit', name: mojit});
            if (!mojitRes || !mojitRes.length) {
                callback('Unknown "' + mojit + '"');
                return;
            }
            mojitRes = mojitRes[0];
            if ('mojito' === mojitRes.source.pkg.name) {
                // don't write framework-provided rollups into the framework directory
                continue;
            }
        }

        ress = store.getResources('client', context, {mojit: mojit});
        for (r = 0; r < ress.length; r += 1) {
            res = ress[r];
            if (res.mojit !== mojit) {
                continue;
            }
            if (options.core && 'mojito' !== res.source.pkg.name) {
                continue;
            }
            dest = res.source.fs.rollupPath;
            if (dest) {
                if (!rollups[dest]) {
                    rollups[dest] = [];
                }
                rollups[dest].push(res.source.fs.fullPath);
                continue;
            }
        }
    }

    for (dest in rollups) {
        if (rollups.hasOwnProperty(dest)) {
            srcs = rollups[dest];

            shortDest = dest;
            if (cwd === shortDest.substr(0, cwd.length)) {
                shortDest = shortDest.substr(cwd.length + 1);
            }

            if (options.remove) {
                if (existsSync(dest)) {
                    try {
                        libfs.unlinkSync(dest);
                    } catch (err) {
                        return callback(err);
                    }
                    if (options.verbose) {
                        libutils.log('Removed: ' + shortDest);
                    }
                    processed += 1;
                }
                continue;
            }

            if (!srcs.length) {
                continue;
            }
            rollupBody = '';
            for (s = 0; s < srcs.length; s += 1) {
                src = srcs[s];
                rollupBody += libfs.readFileSync(src, 'utf-8');
            }
            libfs.writeFileSync(dest, rollupBody, 'utf-8');
            if (options.verbose) {
                libutils.log('Rolled up: ' + shortDest);
            }
            processed += 1;
        }
    }

    msgs.push((options.remove ? 'Removed' : 'Created') +
              ' compiled rollup YUI modules for ' + processed + ' mojits.');
    callback();
};


/**
 * Compiles views for the application.
 * @param {object} context The context.
 * @param {object} options Command options.
 * @param {function} callback Function to invoke upon completion.
 * @return {object} The return value from any optional callback function.
 */
compile.views = function(context, options, callback) {
    var self = this,
        cwd = process.cwd(),
        store = makeStore({root: cwd}),
        compiledFilename = '/autoload/compiled/views.common.js',
        mojits,
        yuiConfig,
        renderer,
        renderedView,
        action = options.remove ? 'Removed' : 'Created',
        processed = 0,
        mojit,
        view,
        source,
        engine,
        mojitViews = {},
        YUI = require('yui').YUI,
        compilerQueue = new Y.AsyncQueue();

    // there are no views in the app, so no need to do this
    if (options.app) {
        libutils.warn('Compiling app-level views not supported\n');
        return callback();
    }

    store.preload();

    libutils.log((options.remove ? 'Removing compiled' : 'Compiling') +
        ' views...');

    if (options.mojit) {
        mojits = [ options.mojit ];
    } else {
        mojits = store.listAllMojits();
    }

    Y.Array.each(mojits, function(mojitName) {
        var mojitRes,
            outputFilepath,
            mojitNs = mojitName.replace(/\./g, '_'),
            yuiModuleCacheWriter,
            viewName,
            MojY,
            compileFunction;

        mojitRes = store.getResources('server', context, {type: 'mojit', name: mojitName});
        if (!mojitRes || !mojitRes.length) {
            callback('Unknown mojit "' + options.mojit + '"');
        }
        mojitRes = mojitRes[0];

        outputFilepath = libpath.join(mojitRes.source.fs.fullPath, 'autoload/compiled/views.common.js');

        if ('mojito' === mojitRes.source.pkg.name) {
            // don't write framework-provided views into the framework directory
            return;
        }

        if (options.remove) {
            if (removeFile(outputFilepath)) {
                if (options.verbose) {
                    libutils.log('Removed: ' + outputFilepath);
                }
                processed += 1;
            }
            return;
        }

        yuiModuleCacheWriter = new YuiModuleCacheWriter('views/' + mojitName,
            outputFilepath, options);

        mojit = store.getMojitTypeDetails('server', context, mojitName);

        if (mojit.views) {
            compileFunction = function (renderer, source, mojitNs, viewName) {
                renderer.compiler(source, function (err, templateObj) {
                    renderedView = Y.JSON.parse(templateObj.toString());
                    yuiModuleCacheWriter.createNamespace('compiled.' +
                        mojitNs + '.views').cache(viewName,
                        renderedView);
                });
            };
            // Check each view for a template and engine
            for (viewName in mojit.views) {
                if (mojit.views.hasOwnProperty(viewName)) {
                    view = mojit.views[viewName];
                    // Check if there is a view to build
                    if (view['content-path'] && view.engine) {
                        if (!mojitViews[mojitName]) {
                            mojitViews[mojitName] = {};
                        }
                        // We have a view to compile
                        source = view['content-path'];
                        engine = view.engine;
                        yuiConfig = mojit.yui.config;
                        yuiConfig.useSync = true;

                        MojY = YUI(yuiConfig).use('mojito-' + engine);
                        renderer = new (MojY.mojito.addons.viewEngines[engine])();

                        if (typeof renderer.compiler === 'function') {
                            compilerQueue.add(Y.bind(compileFunction, self, renderer, source, mojitNs, viewName));
                        }
                    }
                }
            }
        }
        compilerQueue.add(function () {
            if (yuiModuleCacheWriter.write()) {
                processed += 1;
            }
        });

    });
    compilerQueue.add(function () {
        msgs.push(action + ' compiled view YUI modules for ' + processed +
            ' mojits.');
        callback();
    });
    compilerQueue.run();
};


/**
 * Compiles json resources.
 * @param {object} context The context.
 * @param {object} options Command options.
 * @param {function} callback Function to invoke upon completion.
 * @return {object} The return value from any optional callback function.
 */
compile.json = function(context, options, callback) {
    var cwd = process.cwd(),
        store = makeStore({root: cwd}),
        app = new libutils.App({
            port: options.port || 11111,
            verbose: options.verbose,
            appConfig: {
                // assume files will roll up when part of larger command
                assumeRollups: compileType === 'all'
            }
        }),
        staticPrefix = '/',
        count = 0,
        processed = 0,
        total = 0,
        action = options.remove ? 'Removed' : 'Created',
        compiledFilename = 'autoload/compiled/json.common.js',
        processNextMojit,
        processSpecs,
        processNextSpec,
        processDefinitionJSON,
        specs,
        jsonOpts = {
            headers: { 'x-mojito-header': 'tunnel' },
            method: 'POST'
        },
        mojits,
        mojitNames;

    // there are no json configs in the app, so no need to do this
    if (options.app) {
        libutils.warn('Compiling app-level json not supported\n');
        return callback();
    }

    store.preload();

    if (options.mojit) {
        mojitNames = [ options.mojit ];
    } else {
        mojitNames = store.listAllMojits();
    }
    total = mojitNames.length;

    processSpecs = function(newSpecs, mojitName, store, yuiModuleCacheWriter,
            cb) {
        // look for mojit specs
        specs = newSpecs;
        processNextSpec(mojitName, yuiModuleCacheWriter, cb);
    };

    processNextSpec = function(mojitName, yuiModuleCacheWriter, cb) {
        var fullSpecName = specs.shift(),
            parts,
            mName,
            mojitNs,
            specName,
            specUrl;

        if (!fullSpecName) {
            return cb();
        }

        if (options.verbose) {
            libutils.log('\tprocessing spec... ' + fullSpecName);
        }

        parts = fullSpecName.split(':');
        mName = parts[0];
        mojitNs = mName.replace(/\./g, '_');
        specName = parts[1] || 'default';

        if (!mojitName || mName === mojitName) {
            /* NOTE_1:  During the resource store redesign, it was noticed
             * that this branch is never called, which STRONGLY suggests that
             * this feature was never used.
             */
            specUrl = '/' + mName + '/specs/' + specName + '.json';

            if (options.verbose) {
                libutils.log('found spec (' + specName + ') for ' + mName);
            }
            getContentFromUrl(app, specUrl, jsonOpts, function(spec) {
                yuiModuleCacheWriter.createNamespace('compiled.' + mojitNs +
                    '.specs').cache(specName, Y.JSON.parse(spec));
                processNextSpec(mojitName, yuiModuleCacheWriter, cb);
            });
        } else {
            processNextSpec(mojitName, yuiModuleCacheWriter, cb);
        }
    };

    processDefinitionJSON = function(mojitRes, store, yuiModuleCacheWriter,
            cb) {
        var mojitName = mojitRes.name,
            processFullDefinition,
            processPreloadDefinitions;

        processFullDefinition = function(mojitName, ymcw, cb) {
            // TODO:  probably want to use mojitRes.url instead
            var url = staticPrefix + mojitName + '/definition.json';

            getContentFromUrl(app, url, jsonOpts, function(definition) {
                var defObj = Y.JSON.parse(definition);
                ymcw.createNamespace('compiled.' +
                    mojitName.replace(/\./g, '_') + '.definitions').cache(
                    'definition',
                    defObj
                );
                cb();
            });
        };
        processPreloadDefinitions = function(mojitNames, ymcw, cb) {
            var continuation = function() {
                if (mojitNames.length) {
                    processFullDefinition(mojitNames.shift(), ymcw,
                        continuation);
                } else {
                    cb();
                }
            };

            processFullDefinition(mojitNames.shift(), ymcw,
                continuation);
        };

        /*
         * The resource store doesn't respond well if you call
         * store._getMojitConfig() a bunch of times in a row synchronously.
         * Setting it inside of a setTimeout seems to keep it happy.
         */
        setTimeout(function() {
            if (options.verbose) {
                libutils.log('looking for definition.json for ' + mojitName);
            }

            var specsToPreload = [],
                mojitNamesToPreload = [],
                path,
                definition;

            path = libpath.join(mojitRes.source.fs.fullPath, 'definition.json');

            // TODO:  use commandline context instead?
            definition = store.config.readConfigYCB(path, {});

            if (Object.keys(definition).length > 0) {
                if (definition.preload) {
                    if (options.verbose) {
                        libutils.log('processing preload mojits for ' + mojitName);
                    }

                    definition.preload.forEach(function(toPreload) {
                        Object.keys(store._appConfigStatic.specs).forEach(
                            function(fullSpecName) {
                                var mName = fullSpecName.split(':').shift();
                                if (mName === toPreload) {
                                    specsToPreload.push(fullSpecName);
                                }
                            }
                        );
                    });

                    if (options.verbose) {
                        libutils.log('processing the preload specs for ' +
                            mojitName);
                        libutils.log(specsToPreload.join(', '));
                    }

                    specsToPreload.forEach(function(stp) {
                        mojitNamesToPreload.push(stp.split(':')[0]);
                    });

                    processSpecs(specsToPreload, null, store,
                        yuiModuleCacheWriter, function() {
                            processPreloadDefinitions(mojitNamesToPreload,
                                yuiModuleCacheWriter,
                                function() {
                                    processFullDefinition(mojitName,
                                        yuiModuleCacheWriter,
                                        cb);
                                });
                        });
                } else {
                    processFullDefinition(mojitName, yuiModuleCacheWriter, cb);
                }
            } else {
                cb();
            }
        }, 10);
    };

    processNextMojit = function(store, cb) {
        var mojitName = mojitNames.shift(),
            mojitRes,
            outputFilepath,
            theCloser,
            yuiModuleCacheWriter;

        if (!mojitName) {
            return cb();
        }

        if (options.verbose) {
            libutils.log('Processing mojit... ' + mojitName);
        }

        count += 1;

        mojitRes = store.getResources('server', context, {type: 'mojit', name: mojitName});
        if (!mojitRes || !mojitRes.length) {
            return processNextMojit(store, cb);
        }
        mojitRes = mojitRes[0];

        if ('mojito' === mojitRes.source.pkg.name) {
            // don't write framework-provided json into the framework directory
            return processNextMojit(store, cb);
        }

        outputFilepath = libpath.join(mojitRes.source.fs.fullPath, compiledFilename);

        if (options.remove) {
            if (removeFile(outputFilepath)) {
                processed += 1;
            }
            return processNextMojit(store, cb);
        }

        yuiModuleCacheWriter = new YuiModuleCacheWriter('json/' + mojitName,
            outputFilepath, options);

        theCloser = function() {
            if (yuiModuleCacheWriter.write()) {
                processed += 1;
            }
            processNextMojit(store, cb);
        };

        // look for definitions
        // TODO:  really only need to do this after all the mojits are processed
        processDefinitionJSON(mojitRes, store, yuiModuleCacheWriter,
            function() {
                // look for specs
                var appConfig = store.getStaticAppConfig(),
                    specs = [];
                if (appConfig.specs) {
                    specs = Object.keys(store._appConfigStatic.specs);
                }
                processSpecs(specs, mojitRes.name, store, yuiModuleCacheWriter,
                    theCloser);
            });
    };

    // start up the server
    app.start(function(err, appInst) {
        if (err) {
            libutils.error(err);
            return;
        }

        libutils.log((options.remove ? 'Removing compiled' : 'Compiling') +
            ' json...');

        processNextMojit(store, function() {
            try {
                app.close();
            } catch (err2) {
                libutils.info('(app server was not running) ' + err2);
            }
            msgs.push(action + ' compiled JSON YUI modules for ' + processed +
                ' mojits.');
            callback();
        });
    });
};


clean = function(context, options, cb) {
    libutils.warn('Cleaning all compiled files!');
    options.remove = true;
    options.app = true;
    compile.all(context, options, function() {
        options.app = false;
        compile.all(context, options, cb);
    });
};


everything = function(context, options, cb) {
    options.app = false;
    options.remove = false;
    compile.all(context, options, function() {
        options.app = true;
        compile.all(context, options, cb);
    });
};


mkdirP = function(p, mode) {
    var ps = libpath.normalize(p).split('/'),
        i;

    for (i = 0; i <= ps.length; i += 1) {
        try {
            libfs.mkdirSync(ps.slice(0, i).join('/'), mode);
        } catch (err) {
            // Dirty way to check dir
        }
    }
};


rmdirR = function(path) {
    var files = libfs.readdirSync(path),
        i,
        currFile;

    /* Loop through and delete everything in the sub-tree after checking it */
    for (i = 0; i < files.length; i += 1) {
        currFile = libfs.statSync(path + '/' + files[i]);

        if (currFile.isDirectory()) {
            // Recursive function back to the beginning
            rmdirR(path + '/' + files[i]);
        } else if (currFile.isSymbolicLink()) {
            // Unlink symlinks
            libfs.unlinkSync(path + '/' + files[i]);
        } else {
            // Assume it's a file - perhaps a try/catch belongs here?
            libfs.unlinkSync(path + '/' + files[i]);
        }
    }

    /*
     * Now that we know everything in the sub-tree has been deleted,
     * we can delete the main directory. Huzzah for the shopkeep.
     */
    return libfs.rmdirSync(path);
};


getContentFromUrl = function(app, url, opts, callback) {
    if (typeof opts === 'function') {
        callback = opts;
        opts = {};
    }
    app.getWebPage(url, opts, function(err, url, content) {
        if (err) {
            libutils.error('FAILED to get ' + url);
            libutils.error(err);
        } else {
            callback(content);
        }
    });
};


removeFile = function(file) {
    if (existsSync(file)) {
        try {
            libfs.unlinkSync(file);
        } catch (err) {
            return false;
        }
        return true;
    }
    return false;
};


/*
 * Used for writing out YUI modules containing cached content
 */
YuiModuleCacher = function(name) {
    this.moduleName = name;
    this.namespaces = {};
};


/**
 * Creates and returns a namespace object with a cache() function. Call this
 * cache(key, val) to cache stuff.
 * For example:
 *     var ymc = new YuiModuleCacher('happy');
 *     ymc.createNamespace('one.two').cache('foo', {bar: 'bar'});
 *     ymc.dump();
 * Produces:
 *
 * YUI.add('happy', function(Y, NAME) {
 *     YUI.namespace("_mojito._cache.compiled.one.two");
 *     YUI._mojito._cache.compiled.one.two["foo"] = {"bar": "bar"};
 * });
 * @param {string} ns A namespace name.
 * @return {Object} The namespace.
 */
YuiModuleCacher.prototype.createNamespace = function(ns) {
    if (!this.namespaces[ns]) {
        this.namespaces[ns] = {
            _c: {},
            cache: function(k, v) {
                this._c[k] = v;
            }
        };
    }
    return this.namespaces[ns];
};


/**
 * return the YUI module text.
 * @return {string} The dump string of the namespace cache.
 */
YuiModuleCacher.prototype.dump = function() {
    var s = 'YUI.add("' + this.moduleName + '", function(Y, NAME) {\n',
        namespaces = this.namespaces;

    Object.keys(namespaces).forEach(function(ns) {
        s += '    YUI.namespace("_mojito._cache.' + ns + '");\n';
        s += '    YUI._mojito._cache.' + ns + ' = ' +
            Y.JSON.stringify(namespaces[ns]._c) + ';\n';
    });
    s += '});\n';
    return s;
};


/**
 * Extends YuiModuleCacher and adds ability to write files as well
 * @param {string} name YUI module name.
 * @param {string} file output file path.
 * @param {object} options same options given to compile command.
 */
YuiModuleCacheWriter = function(name, file, options) {
    YuiModuleCacher.call(this, name);
    this.destinationFile = file;
    this.opts = options || {};
};

/**
 * Create a clean prototype instance.
 */
YuiModuleCacheWriter.prototype = libutils.heir(YuiModuleCacher.prototype);


/**
 * Patch the constructor slot.
 */
YuiModuleCacheWriter.prototype.constructor = YuiModuleCacheWriter;


/**
 * Writes out to a file synchronously.
 * @return {Boolean} True if a file was written.
 */
YuiModuleCacheWriter.prototype.write = function() {
    var file = this.destinationFile,
        namespaces = this.namespaces,
        output = this.dump();

    // only write the file if there is something to write
    if (Object.keys(namespaces).length > 0) {
        try {
            mkdirP(libpath.dirname(file), parseInt('755', 8));
            if (this.opts.verbose) {
                libutils.log('writing file: ' + file);
            }
            libfs.writeFileSync(file, output, 'utf8');
            if (this.opts.verbose) {
                libutils.log('Created: ' + file);
            }
            return true;
        } catch (err) {
            libutils.error('Error writing file: ' + file);
            libutils.error(err);
            return false;
        }
    }
    return false;
};


/**
 * Standard usage string export.
 */
exports.usage = usage;


/**
 * Standard options list export.
 */
exports.options = options;


/**
 * Standard run method hook export.
 */
exports.run = run;


/**
 * Export the module itself so it's accessible.
 */
exports.YuiModuleCacher = YuiModuleCacher;
