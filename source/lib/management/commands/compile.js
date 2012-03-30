/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp:true, nomen:true*/


var path = require('path'),
    utils = require('../utils'),
    fs = require('fs'),

    // Mojito Resource Store
    ResourceStore = require(path.join(__dirname, '../..',
        'store.server.js')),

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
    YuiModuleCacher;


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


run = function(params, options, callback) {
    var store = new ResourceStore(process.cwd()),
        displayResults,
        type,
        context = {};

    // TODO: don't assign to a parameter.
    options = options || {};

    utils.isMojitoApp(store._root, exports.usage, true);

    if (options.context) {
        // TODO: parseURL.
        context = options.context;
    }

    displayResults = function(err) {
        utils.log('');
        msgs.forEach(function(msg) {
            utils.log(msg);
        });
        utils.log('');
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
        utils.error('Please provide the type of compilation you want.',
            exports.usage, true);
    }
    if (!compile[type]) {
        utils.error("Unknown type '" + type + "'", exports.usage, true);
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
            utils.log('executing -- ' + action.toUpperCase() + ' --');
        }
        compile[action](context, options, function(err) {
            if (err) {
                return callback(err);
            }
            if (options.verbose) {
                utils.log('done -- ' + action.toUpperCase() + ' --\n\n');
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
    var app = new utils.App({
        port: options.port || 11111,
        verbose: options.verbose
    }),
        action = options.remove ? 'Removed' : 'Created',
        processed = 0,
        cwd = process.cwd(),
        urlMatcher = /url\(([^)]+)\)/g,
        inlines,
        inlineNext;

    if (options.app) {
        utils.warn('Creating app-level inline css not supported\n');
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
        for (url in store._staticURLs) {
            if (store._staticURLs.hasOwnProperty(url)) {
                fs2url[store._staticURLs[url]] = url;
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
                    utils.log('Removed: ' + inline.dest);
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
                    srcDir = path.dirname(inline.srcs[srcKey]);
                    fs = path.join(srcDir, url);
                    if (!fs2url[fs]) {
                        utils.warn('couldn\'t normalize url(' + url +
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
            utils.error(err);
        } else {
            store = appInstance.store;
            inlines = store.getInlineCssMojits('client', context);

            utils.log((options.remove ? 'Removing' : 'Creating') +
                ' inline css...');

            inlineNext(store, function(err) {
                try {
                    app.close();
                } catch (err2) {
                    utils.warn('(app server was not running) ' + err2);
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
        action = options.remove ? 'Removed' : 'Created',
        processed = 0,
        store = new ResourceStore(cwd),
        rollups,
        rollup,
        mojitName;

    store.preload();

    utils.log((options.remove ? 'Removing' : 'Creating') + ' rollups...');

    function rollOneUp(rollup) {
        var i,
            src,
            rollupBody,
            shortDest;

        shortDest = rollup.dest;
        if (cwd === shortDest.substr(0, cwd.length)) {
            shortDest = shortDest.substr(cwd.length + 1);
        }

        if (options.remove) {
            if (path.existsSync(rollup.dest)) {
                try {
                    fs.unlinkSync(rollup.dest);
                } catch (err) {
                    return callback(err);
                }

                if (options.verbose) {
                    utils.log('Removed: ' + shortDest);
                }
                processed += 1;
            }
            return;
        }

        rollupBody = '';
        for (i = 0; i < rollup.srcs.length; i += 1) {
            src = rollup.srcs[i];
            rollupBody += fs.readFileSync(src, 'utf-8');
        }
        fs.writeFileSync(rollup.dest, rollupBody, 'utf-8');
        if (options.verbose) {
            utils.log('Rolled up: ' + shortDest);
        }
        processed += 1;
    }

    if (options.app) {
        rollup = store.getRollupsApp('client', context);
        rollOneUp(rollup);
        utils.log('All rollups have been ' +
            (options.remove ? 'removed' : 'created') + '\n');
        callback();
        return;
    }

    rollups = store.getRollupsMojits('client', context);

    if (options.mojit && !rollups[options.mojit]) {
        callback('Unknown "' + options.mojit + '"');
        return;
    }

    for (mojitName in rollups) {
        if (rollups.hasOwnProperty(mojitName)) {

            // TODO: verify the logic inversion here.
            //if (options['mojit'] && mojitName != options['mojit']) {continue};
            if (!options.mojit || (mojitName === options.mojit)) {
                rollup = rollups[mojitName];
                rollOneUp(rollup);
            }
        }
    }

    msgs.push(action + ' compiled rollup YUI modules for ' + processed +
        ' mojits.');
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
    var store = new ResourceStore(process.cwd()),
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
        YUI = require('yui3').YUI;

    // there are no views in the app, so no need to do this
    if (options.app) {
        utils.warn('Compiling app-level views not supported\n');
        return callback();
    }

    store.preload();

    utils.log((options.remove ? 'Removing compiled' : 'Compiling') +
        ' views...');

    // Get all the Mojits
    mojits = store.getAllMojits('server', context);

    if (options.mojit && !mojits[options.mojit]) {
        callback('Unknown "' + options.mojit + '"');
        return;
    }

    // loop through all mojits one at a time, only once per mojit
    Object.keys(mojits).forEach(function(mojitName) {
        var outputFilepath = store._mojitPaths[mojitName] + compiledFilename,
            mojitNs = mojitName.replace(/\./g, '_'),
            yuiModuleCacheWriter,
            viewName,
            Y;

        if (options.remove) {
            if (removeFile(outputFilepath)) {
                if (options.verbose) {
                    utils.log('Removed: ' + outputFilepath);
                }
                processed += 1;
            }
            return;
        }

        // Skip anything in the "lib/mojits" (open source) or
        // "mojit/mojits" (ynodejs_mojito) directories as it's internal
        if (outputFilepath.indexOf('lib/mojits') >= 0 ||
                outputFilepath.indexOf('mojito/mojits') >= 0) {
            return;
        }

        yuiModuleCacheWriter = new YuiModuleCacheWriter('views/' + mojitName,
            outputFilepath, options);

        mojit = mojits[mojitName];

        if (mojit.views) {
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

                        Y = YUI(yuiConfig).useSync('mojito-' + engine);
                        renderer = new (Y.mojito.addons.viewEngines[engine])();

                        if (typeof renderer.compiler === 'function') {
                            renderedView = JSON.parse(
                                renderer.compiler(source).toString()
                            );
                            yuiModuleCacheWriter.createNamespace('compiled.' +
                                mojitNs + '.views').cache(viewName,
                                renderedView);
                        }
                    }
                }
            }
        }
        if (yuiModuleCacheWriter.write()) {
            processed += 1;
        }

    });

    msgs.push(action + ' compiled view YUI modules for ' + processed +
        ' mojits.');
    callback();
};


/**
 * Compiles json resources.
 * @param {object} context The context.
 * @param {object} options Command options.
 * @param {function} callback Function to invoke upon completion.
 * @return {object} The return value from any optional callback function.
 */
compile.json = function(context, options, callback) {
    var store = new ResourceStore(process.cwd()),
        app = new utils.App({
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
        compiledFilename = '/autoload/compiled/json.common.js',
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
        utils.warn('Compiling app-level json not supported\n');
        return callback();
    }

    store.preload();

    // Get all the Mojits
    mojits = store.getAllMojits('server', context);
    mojitNames = Object.keys(mojits);
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
            utils.log('\tprocessing spec... ' + fullSpecName);
        }

        parts = fullSpecName.split(':');
        mName = parts[0];
        mojitNs = mName.replace(/\./g, '_');
        specName = parts[1] || 'default';

        if (!mojitName || mName === mojitName) {
            specUrl = '/' + mName + '/specs/' + specName + '.json';

            if (options.verbose) {
                utils.log('found spec (' + specName + ') for ' + mName);
            }
            getContentFromUrl(app, specUrl, jsonOpts, function(spec) {
                yuiModuleCacheWriter.createNamespace('compiled.' + mojitNs +
                    '.specs').cache(specName, JSON.parse(spec));
                processNextSpec(mojitName, yuiModuleCacheWriter, cb);
            });
        } else {
            processNextSpec(mojitName, yuiModuleCacheWriter, cb);
        }
    };

    processDefinitionJSON = function(mojitName, store, yuiModuleCacheWriter,
            cb) {
        var processFullDefinition = function(mojitName, ymcw, cb) {
            var url = staticPrefix + mojitName + '/definition.json';

            getContentFromUrl(app, url, jsonOpts, function(definition) {
                var defObj = JSON.parse(definition);

                ymcw.createNamespace('compiled.' +
                    mojitName.replace(/\./g, '_') + '.definitions').cache(
                    'definition',
                    defObj
                );
                cb();
            });
        },
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
                utils.log('looking for definition.json for ' + mojitName);
            }

            var specsToPreload = [],
                mojitNamesToPreload = [],
                definition = store._getMojitConfig('server', {},
                    mojitName, 'definition');

            if (Object.keys(definition).length > 0) {
                if (definition.preload) {
                    if (options.verbose) {
                        utils.log('processing preload mojits for ' + mojitName);
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
                        utils.log('processing the preload specs for ' +
                            mojitName);
                        utils.log(specsToPreload.join(', '));
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
            outputFilepath,
            theCloser,
            yuiModuleCacheWriter;

        if (!mojitName) {
            return cb();
        }

        if (options.verbose) {
            utils.log('Processing mojit... ' + mojitName);
        }
        outputFilepath = store._mojitPaths[mojitName] + compiledFilename;

        count += 1;

        if (options.remove) {
            if (removeFile(outputFilepath)) {
                processed += 1;
            }
            return processNextMojit(store, cb);
        }

        // Skip anything in the "lib/mojits" (open source) or
        // "mojit/mojits" (ynodejs_mojito) directories as it's internal
        if (outputFilepath.indexOf('lib/mojits') >= 0 ||
                outputFilepath.indexOf('mojito/mojits') >= 0) {
            if (options.verbose) {
                utils.log('skipping ' + outputFilepath);
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
        processDefinitionJSON(mojitName, store, yuiModuleCacheWriter,
            function() {
                // look for specs
                var specs = [];
                if (store._appConfigStatic.specs) {
                    specs = Object.keys(store._appConfigStatic.specs);
                }
                processSpecs(specs, mojitName, store, yuiModuleCacheWriter,
                    theCloser);
            });
    };

    // start up the server
    app.start(function(err, appInst) {
        if (err) {
            utils.error(err);
            return;
        }

        utils.log((options.remove ? 'Removing compiled' : 'Compiling') +
            ' json...');

        processNextMojit(store, function() {
            try {
                app.close();
            } catch (err2) {
                utils.info('(app server was not running) ' + err2);
            }
            msgs.push(action + ' compiled JSON YUI modules for ' + processed +
                ' mojits.');
            callback();
        });
    });
};


clean = function(context, options, cb) {
    utils.warn('Cleaning all compiled files!');
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
    var ps = path.normalize(p).split('/'),
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
        i,
        currFile;

    /* Loop through and delete everything in the sub-tree after checking it */
    for (i = 0; i < files.length; i += 1) {
        currFile = fs.statSync(path + '/' + files[i]);

        if (currFile.isDirectory()) {
            // Recursive function back to the beginning
            rmdirR(path + '/' + files[i]);
        } else if (currFile.isSymbolicLink()) {
            // Unlink symlinks
            fs.unlinkSync(path + '/' + files[i]);
        } else {
            // Assume it's a file - perhaps a try/catch belongs here?
            fs.unlinkSync(path + '/' + files[i]);
        }
    }

    /*
     * Now that we know everything in the sub-tree has been deleted,
     * we can delete the main directory. Huzzah for the shopkeep.
     */
    return fs.rmdirSync(path);
};


getContentFromUrl = function(app, url, opts, callback) {
    if (typeof opts === 'function') {
        callback = opts;
        opts = {};
    }
    app.getWebPage(url, opts, function(err, url, content) {
        if (err) {
            utils.error('FAILED to get ' + url);
            utils.error(err);
        } else {
            callback(content);
        }
    });
};


removeFile = function(file) {
    if (path.existsSync(file)) {
        try {
            fs.unlinkSync(file);
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
            JSON.stringify(namespaces[ns]._c) + ';\n';
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
YuiModuleCacheWriter.prototype = utils.heir(YuiModuleCacher.prototype);


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
            mkdirP(path.dirname(file), parseInt('755', 8));
            if (this.opts.verbose) {
                utils.log('writing file: ' + file);
            }
            fs.writeFileSync(file, output, 'utf8');
            if (this.opts.verbose) {
                utils.log('Created: ' + file);
            }
            return true;
        } catch (err) {
            utils.error('Error writing file: ' + file);
            utils.error(err);
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
