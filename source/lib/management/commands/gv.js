/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/


// TODO:
//  color-code or shape-code module types (from yui, mojito fw, app-level,
//  mojits) use store.getAppLevelYuiModules() to de-stress (or not draw)
//  modules that aren't used by the app.

var run,
    usage,
    options,

    libpath = require('path'),
    libfs = require('fs'),
    libutils = require('../utils'),

    MODE_ALL = parseInt('777', 8),

    ResourceStore = require('../../store.server.js'),

    artifactsDir = 'artifacts',
    resultsDir = 'artifacts/gv';


function parseReqs(dest, modules) {
    var module,
        info;

    for (module in modules) {
        if (modules.hasOwnProperty(module)) {
            info = modules[module];
            dest[module] = info.requires || [];
        }
    }
}


function makeDepGraph(reqs, destFile) {
    var graph,
        mod,
        i,
        req,
        graphAttrs;

    graph = 'digraph yui {\n';
    graph += '    rankdir="LR";\n';
    graph += '    fontsize=11;\n';
    graph += '    node [shape=Mrecord,fontsize=11];\n';
    graph += '    edge [color=grey33,arrowsize=0.5,fontsize=8];\n';

    for (mod in reqs) {
        if (reqs.hasOwnProperty(mod)) {
            for (i = 0; i < reqs[mod].length; i += 1) {
                req = reqs[mod][i];
                graph += '    "' + mod + '" -> "' + req + '";\n';
            }
        }
    }

    graphAttrs = [
        'remincross=true',
        //      'rankdir=LR',
        'ranksep=1.5',
        'clusterrank=local',
        'model=circuit',
        'overlap=false',
        'splines=compound',
        //      'pack=true',
        //      'packmode=clust',
        //      'concentrate=true',   // sometimes causes crash/coredump
        //      'start=self',
        'compound=true'
    ];
    graph += '    graph [' + graphAttrs.join(',') + '];\n';
    graph += '}\n';

    libfs.writeFileSync(destFile, graph, 'utf-8');
}


run = function(params, options) {
    var env, store,
        reqs = {},
        resultsFile;

    options = options || {};
    env = options.client ? 'client' : 'server';

    if (params.length) {
        libutils.error('Unknown extra parameters.');
        return;
    }

    // make results dir
    if (!libpath.existsSync(artifactsDir)) {
        libfs.mkdirSync(artifactsDir, MODE_ALL);
    }
    if (!libpath.existsSync(resultsDir)) {
        libfs.mkdirSync(resultsDir, MODE_ALL);
    }

    // load details
    store = new ResourceStore(process.cwd());
    store.preload();
    if (options.framework) {
        parseReqs(reqs, store.getYuiConfigFw(env, {}).modules);
    }
    parseReqs(reqs, store.getYuiConfigApp(env, {}).modules);
    parseReqs(reqs, store.getYuiConfigAllMojits(env, {}).modules);

    // generate graph
    resultsFile = libpath.join(resultsDir, 'yui.' + env + '.dot');
    makeDepGraph(reqs, resultsFile);

    console.log('Dotfile generated.' +
        ' To turn it into a graph, run the following:');
    console.log('$ dot -Tgif ' + resultsFile + ' > ' +
        libpath.join(resultsDir, 'yui.' + env + '.gif'));
};


usage = 'mojito gv   // generates a GraphViz[1] file' +
    ' describing the dependencies\n' +
    '            // between the YUI modules\n' +
    '\n' +
    'OPTIONS:\n' +
    '\t --client:  use modules for the client\n' +
    '\t       -c:  short for --client\n' +
    '\t --framework:  include framework (Mojito) modules\n' +
    '\t          -f:  short for --framework\n' +
    '\n' +
    '[1] http://en.wikipedia.org/wiki/Graphviz\n';


options = [
    {
        longName: 'framework',
        shortName: 'f',
        hasValue: false
    },
    {
        longName: 'client',
        shortName: 'c',
        hasValue: false
    }
];


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
