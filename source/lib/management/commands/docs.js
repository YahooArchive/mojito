/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp:true, nomen:true*/


var utils = require('../utils'),
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    copyExclude = require('../utils').copyExclude,
    usage,
    dir_mojito = path.join(__dirname, '../../'),
    dir_yuidoc = path.join(dir_mojito, 'libs/yuidoc'),
    dir_template = path.join(dir_yuidoc, 'template'),
    cmd_yuidoc = path.join(dir_yuidoc, '/bin/yuidoc.py');


usage = '\nmojito docs [type] [name]\n' +
    '\t- type: \'mojito\', \'app\' or \'mojit\'\n' +
    '\t- name(required for type mojit): given name for creating' +
    ' documentation\n\n' +
    'Example Usage: mojito docs app foo\n' +
    '\t(creates directory \'artifacts/docs/app/foo\' containing that ' +
    'application\'s documentation)\n' +
    'Example Usage: mojito docs mojit Bar\n' +
    '\t(creates directory \'artifacts/docs/mojits/Bar\' containing that' +
    ' mojit\'s documentation)\n';


var cmdLog = function(cmd, error, stdout, stderr, verbose) {

    if (!verbose) {
        return;
    }

    if (stdout) {
        console.log('stdout: ' + stdout);
    }
    if (stderr) {
        console.log('stderr: ' + stderr);
    }
    if (error !== null) {
        console.log('FAILED ' + cmd + '\n' + 'error: ' + error);
    }
};


// TODO: [Issue 64] don't make unecessary calls to the shell.
var makeDocs = function(name, source, destination, excludes, verbose) {

    var cmd = '',
        fail = false;

    destination = path.join(destination,
        name.replace(/[^a-z0-9]/ig, '_').replace(/(_)\1+/g, '_'));

    cmd = 'rm -rf ' + destination + '&& mkdir -p ' + destination;

    excludes = excludes.concat([/\/\.svn$/, /\/\.git$/, /\/CVS$/]);

    exec(cmd, function(error, stdout, stderr) {

        cmdLog(cmd, error, stdout, stderr, verbose);

        if (error) {
            fail = true;
        }

        copyExclude(source, destination + '-yuidoc-src', excludes);

        cmd = cmd_yuidoc + ' ' +
            destination + '-yuidoc-src' +
            ' --parseroutdir=' + destination + '-yuidoc-src-parsed' +
            ' --outputdir=' + destination +
            ' --template=' + dir_template +
            ' --project=' + name +
            ' --version=' + '0.1.0' +
            ' --yuiversion=3';

        exec(cmd, function(error, stdout, stderr) {

            cmdLog(cmd, error, stdout, stderr, verbose);

            if (error) {
                fail = true;
            }

            cmd = 'rm -rf ' + destination + '-yuidoc-src' +
                '&& rm -rf ' + destination + '-yuidoc-src-parsed' +
                '&& rm -rf ' + destination + '/.svn*' +
                '&& rm -rf ' + destination + '/assets/.svn*';

            exec(cmd, function(error, stdout, stderr) {

                cmdLog(cmd, error, stdout, stderr, verbose);

                if (error) {
                    fail = true;
                }

                if (fail) {
                    if (verbose) {
                        utils.error('There was an error.');
                    } else {
                        utils.error('There was an error. Run with --verbose' +
                            ' option for more information.');
                    }
                } else {
                    console.log('open ' + destination + '/index.html');
                }
            });
        });
    });
};


var makeMojitoDocs = function(name, verbose) {

    var source = dir_mojito,
        destination = path.join(process.cwd(), 'artifacts/docs'),
        excludes = [
            /\/archetypes$/,
            /\/artifacts$/,
            /\/libs$/,
            /\/management$/,
            /\/middleware$/,
            /\/node_modules$/,
            /\/tests$/
        ];

    makeDocs(name, source, destination, excludes, verbose);
};


var makeAppDocs = function(name, verbose) {

    var source = process.cwd(),
        destination = path.join(process.cwd(), 'artifacts/docs/'),
        excludes = [
            /\/lang$/,
            /\/lib$/,
            /\/assets$/,
            /\/tests$/,
            /\/artifacts$/,
            /\/index\.js$/,
            /\/node_modules$/,
            /\/server\.js$/,
            /\/start\.js$/
        ];

    utils.isMojitoApp(process.cwd(), exports.usage);

    if (!name) {
        name = 'Mojito Application';
    }

    makeDocs(name, source, destination, excludes, verbose);
};


var makeMojitDocs = function(name, verbose) {

    var source = path.join(process.cwd(), 'mojits', name),
        destination = path.join(process.cwd(), 'artifacts/docs/mojits'),
        excludes = [
            /\/lang$/,
            /\/lib$/,
            /\/assets$/,
            /\/node_modules$/,
            /\/tests$/,
            /\/artifacts$/
        ];

    utils.isMojitoApp(process.cwd(), exports.usage);

    if (!name) {
        utils.error('Please specify mojit name', exports.usage);
        return;
    }

    makeDocs(name, source, destination, excludes, verbose);
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
        makeMojitoDocs('mojito', options.verbose);
        break;
    case 'APP':
        makeAppDocs(name, options.verbose);
        break;
    case 'MOJIT':
        makeMojitDocs(name, options.verbose);
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
    shortName: 'v',
    longName: 'verbose',
    hasValue: false
}];


/**
 * Standard run method hook export.
 */
exports.run = run;
