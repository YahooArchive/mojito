/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp:true, nomen:true, stupid:true*/


var path = require('path'),
    utils = require(path.join(__dirname, '../../management/utils')),
    exec = require('child_process').exec,
    wrench = require('wrench'),
    yuidocjs = require('yuidocjs'),
    usage,
    dir_mojito = path.join(__dirname, '../../');


usage = '\nmojito docs [type] [name] [--server]\n' +
    '\t- type: \'mojito\', \'app\' or \'mojit\'\n' +
    '\t- name(required for type mojit): given name for creating' +
    ' documentation\n\n' +
    'Example Usage: mojito docs app foo\n' +
    '\t(creates directory \'artifacts/docs/app/foo\' containing that ' +
    'application\'s documentation)\n' +
    'Example Usage: mojito docs mojit Bar\n' +
    '\t(creates directory \'artifacts/docs/mojits/Bar\' containing that' +
    ' mojit\'s documentation)\n' +
    '\nOptions\n' +
    '\t--server Start YUIDoc server instead of writing the documentation to disk';



/**
 * Cleanup destination folder and generate the requested docs using yuidocjs.
 * See: http://yui.github.com/yuidoc/api/
 *      https://github.com/ryanmcgrath/wrench-js
 */
var makeDocs = function(name, source, destination, excludes, options) {

    var json,
        builder,
        docOptions;

    destination = path.join(destination,
        name.replace(/[^a-z0-9]/ig, '_').replace(/(_)\1+/g, '_'));

    wrench.rmdirSyncRecursive(destination, true);
    wrench.mkdirSyncRecursive(destination, '0744');

    excludes = excludes.concat(['.svn', '.git', 'CVS', 'node_modules']);

    docOptions = {
        paths: [ source ],
        outdir: destination,
        exclude: excludes.join(),
        name: name,
        port: 3000,
        external: false
    };

    if (options.server) {
        yuidocjs.Server.start(docOptions);
    } else {
        json = (new yuidocjs.YUIDoc(docOptions)).run();
        builder = new yuidocjs.DocBuilder(docOptions, json);

        builder.compile(function() {
            console.log('open ' + destination + '/index.html');
        });
    }
};


var makeMojitoDocs = function(name, options) {

    var source = dir_mojito,
        destination = path.join(process.cwd(), 'artifacts/docs'),
        excludes = [
            'archetypes',
            'artifacts',
            'libs',
            'management',
            'middleware',
            'tests'
        ];

    makeDocs(name, source, destination, excludes, options);
};


var makeAppDocs = function(name, options) {

    var source = process.cwd(),
        destination = path.join(process.cwd(), 'artifacts/docs/'),
        excludes = [
            'lang',
            'lib',
            'assets',
            'tests',
            'artifacts',
            'index.js',
            'server.js',
            'start.js'
        ];

    utils.isMojitoApp(process.cwd(), exports.usage);

    if (!name) {
        name = 'Mojito Application';
    }

    makeDocs(name, source, destination, excludes, options);
};


var makeMojitDocs = function(name, options) {

    var source = path.join(process.cwd(), 'mojits', name),
        destination = path.join(process.cwd(), 'artifacts/docs/mojits'),
        excludes = [
            'lang',
            'lib',
            'assets',
            'tests',
            'artifacts'
        ];

    utils.isMojitoApp(process.cwd(), exports.usage);

    if (!name) {
        utils.error('Please specify mojit name', exports.usage);
        return;
    }

    makeDocs(name, source, destination, excludes, options);
};


/* Need to run the docs command in the mojito directory for mojito,
   app directory for an app,
   mojits directory for a mojit
   e.g If I want to document an app paged-yql, I run the command
   "mojito docs app paged-yql in the "~/part4" directory where the app resides
*/


function run(params, options, callback) {

    var type = params[0] || '',
        name = params[1] || '';

    switch (type.toUpperCase()) {
    case 'MOJITO':
        makeMojitoDocs('mojito', options);
        break;
    case 'APP':
        makeAppDocs(name, options);
        break;
    case 'MOJIT':
        makeMojitDocs(name, options);
        break;
    default:
        utils.error('Unknown type', exports.usage);
    }
}


/**
 * Standard usage string export.
 */
exports.usage = usage;


/**
 * Standard options list export.
 */
exports.options = [{
    shortName: 's',
    longName: 'server',
    hasValue: false
}];


/**
 * Standard run method hook export.
 */
exports.run = run;
