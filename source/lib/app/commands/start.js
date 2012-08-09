/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, nomen:true, sloppy:true, stupid:true*/


var path = require('path'),
    utils = require(path.join(__dirname, '../../management/utils')),
    fs = require('fs'),
    Y = require('yui').YUI({useSync: true}).use('json-parse', 'json-stringify');

Y.applyConfig({useSync: false});


/**
 * Standard usage string export.
 */
exports.usage = '\nmojito start [port]\n' +
    '\t- port: (optional)\n' +
    '\t  The port number specified here is an override. If a port is not\n' +
    '\t  specified, the port number is obtained through the application\'s\n' +
    '\t  configuration mechanism. If one is not found there, port 8666 is' +
    ' used.\n' +
    '\nOptions\n' +
    '\t--context  A comma-separated list of key:value pairs that define the' +
    ' base\n' +
    '\t           context used to read configuration files\n';


/**
 * Standard options list export.
 */
exports.options = [
    {
        longName: 'context',
        shortName: null,
        hasValue: true
    }
];


/**
 * Standard run method hook export.
 * @param {Array} params An array of optional parameters.
 * @param {object} opts Options/flags for the command.
 * @param {function} callback An optional callback to invoke on completion.
 */
exports.run = function(params, opts, callback) {
    var root = process.cwd(),
        appConfig,
        pack,
        inputOptions = opts || {},
        options = {},
        app;

    try {
        // Are we in a Mojito App? Read the application.json config to find out.
        appConfig = Y.JSON.parse(fs.readFileSync(path.join(root,
            'application.json'), 'utf8'));
        appConfig = appConfig[0];
    } catch (err) {
        appConfig = {};
    }

    try { // Read the package.json config
        pack = Y.JSON.parse(fs.readFileSync(path.join(root, 'package.json'),
            'utf8'));
    } catch (err2) {
        pack = {};
    }

    options.port = params[0] || appConfig.appPort || 8666;
    if (inputOptions.context) {
        options.context = utils.contextCsvToObject(inputOptions.context);
    }

    app = new utils.App(options);
    app.start(function(err) {
        if (err) {
            utils.error('There was an error starting the application:\n');
            utils.error(err);
            console.log('\n');
            utils.error('Mojito was not started!\n', null, true);
            return;
        }
        console.log('\n');
        utils.success('\tMojito started' +
            (pack.name ? ' \'' + pack.name + '\'' : '') +
            ' on http://localhost:' + options.port + '/\n');
    });
};
