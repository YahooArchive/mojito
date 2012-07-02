/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, nomen:true, sloppy:true*/


// TODO:
//  color-code or shape-code module types (from yui, mojito fw, app-level,
//  mojits) use store.getAppLevelYuiModules() to de-stress (or not draw)
//  modules that aren't used by the app.

var run,
    usage,
    options,

    libpath = require('path'),
    libfs = require('fs'),
    libutils = require(libpath.join(__dirname, '../../management/utils')),
    YUI = require('yui').YUI,

    MODE_ALL = parseInt('777', 8),

    artifactsDir = 'artifacts',
    resultsDir = 'artifacts/gv';


function parseReqs(dest, ress, options) {
    var r,
        res,
        src;
    for (r = 0; r < ress.length; r += 1) {
        res = ress[r];
        if (!res.yui || !res.yui.name) {
            continue;
        }
        if (('mojito' === res.source.pkg.name) && (!options.framework)) {
            continue;
        }
        src = 'package ' + res.source.pkg.name;
        if (res.mojit && 'shared' !== res.mojit) {
            src = 'mojit ' + res.mojit;
        }
        if (!dest[src]) {
            dest[src] = {};
        }
        dest[src][res.yui.name] = res.yui.meta.requires || [];
    }
}


function makeDepGraph(reqs, destFile) {
    var graph,
        src,
        mod,
        i,
        req,
        cluster = 0,
        edges = '',
        graphAttrs;

    graph = 'digraph yui {\n';
    graph += '    rankdir="LR";\n';
    graph += '    fontsize=11;\n';
    graph += '    node [shape=Mrecord,fontsize=11];\n';
    graph += '    edge [color=grey33,arrowsize=0.5,fontsize=8];\n';
    graph += '\n';

    for (src in reqs) {
        if (reqs.hasOwnProperty(src)) {
            cluster += 1;
            graph += '    subgraph cluster' + cluster + ' {\n';
            graph += '        label="' + src + '";\n';
            graph += '        style="filled";\n';
            graph += '        color="lightgrey";\n';
            graph += '        node [style="filled",color="white"];\n';
            for (mod in reqs[src]) {
                if (reqs[src].hasOwnProperty(mod)) {
                    graph += '        "' + mod + '";\n';
                }
            }
            graph += '    };\n';

            for (mod in reqs[src]) {
                if (reqs[src].hasOwnProperty(mod)) {
                    for (i = 0; i < reqs[src][mod].length; i += 1) {
                        req = reqs[src][mod][i];
                        edges += '    "' + mod + '" -> "' + req + '";\n';
                    }
                }
            }
        }
    }

    graph += '\n';
    graph += edges;
    graph += '\n';

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
        Y,
        ress,
        m, mojit, mojits,
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

    Y = YUI();
    Y.applyConfig({
        useSync: true,
        modules: {
            'mojito-resource-store': {
                fullpath: libpath.join(__dirname, '../../store.server.js')
            }
        }
    });
    Y.use('mojito-resource-store');

    // load details
    store = new Y.mojito.ResourceStore({
        root: process.cwd(),
        context: {}
    });
    store.preload();

    ress = store.getResources(env, {}, {});
    parseReqs(reqs, ress, options);

    mojits = store.listAllMojits();
    mojits.push('shared');
    for (m = 0; m < mojits.length; m += 1) {
        mojit = mojits[m];
        ress = store.getResources(env, {}, { mojit: mojit });
        parseReqs(reqs, ress, options);
    }

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
