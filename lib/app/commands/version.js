/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, stupid:true*/


var fs = require('fs'),
    path = require('path'),
    utils = require(path.join(__dirname, '../../management/utils')),
    usage = 'mojito version [app | mojit] [<name>]',
    Y = require('yui').YUI({useSync: true}).use('json-parse', 'json-stringify');

Y.applyConfig({useSync: false});

/*
 * Report the Mojito version, as obtained from the package.json file for the
 * framework.
 */
function reportVersion(type, packagePath) {
    var packageJSON;

    try {
        packageJSON = Y.JSON.parse(String(fs.readFileSync(
            path.join(packagePath, 'package.json')
        )));
    } catch (err) {
        utils.error('Error reading ' + type + ' version: ' + err.message);
        return;
    }

    console.log('\nVersion of ' + type + ' is ' + packageJSON.version + '\n');
}


/*
 * Run this command. The options (framework, application, or mojit check, and
 * an optional path) are processed, and the version information is reported
 * on the console.
 */
function run(params, options, callback) {

    if (!params || params.length === 0) {
        // framework
        reportVersion('mojito', path.join(__dirname, '../../..'));
    } else if (params[0] === 'app') {
        // application
        reportVersion('application', path.join(process.cwd()));
    } else if (params[0] === 'mojit') {
        // mojit
        reportVersion('mojit', path.join(process.cwd(), 'mojits', params[1]));
    } else {
        utils.error('Unrecognized parameter: ' + params[0], usage);
    }

    callback();
}


/**
 * Standard usage string export.
 */
exports.usage = usage;


/**
 * Standard run method hook export.
 */
exports.run = run;
