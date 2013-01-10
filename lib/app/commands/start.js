/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, nomen:true, sloppy:true, stupid:true*/

var path = require('path'),
    utils = require(path.join(__dirname, '../../management/utils')),
    Mojito = require(path.join(__dirname, '../../mojito')),
    Store = require(path.join(__dirname, '../../store')),
    mojitoVersion = require(path.join(__dirname, '../../../package.json')).version,
    fs = require('fs');


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
    '\t           context used to read configuration files\n' +
    '\t--perf     Path and filename where to output performance metrics.\n';


/**
 * Standard options list export.
 */
exports.options = [
    {
        longName: 'context',
        shortName: null,
        hasValue: true
    },
    {
        longName: 'perf',
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
        store,
        appConfig,
        pack,
        inputOptions = opts || {},
        options = {},
        app;

    if (inputOptions.context) {
        inputOptions.context = utils.contextCsvToObject(inputOptions.context);
    }

    store = Store.createStore({
        root: root,
        preload: 'initial',
        context: inputOptions.context || {}
    });
    appConfig = store.getAppConfig();
        
    pack = store.config.readConfigJSON(path.join(root, 'package.json'));

    options.port = params[0] || appConfig.appPort || process.env.PORT || 8666;
    if (inputOptions.context) {
        options.context = inputOptions.context;
    }

    if (inputOptions.perf) {
        options.perf = inputOptions.perf;
    }

    app = Mojito.createServer(options);
    app.listen(null, null, function(err) {
        if (err) {
            utils.error('There was an error starting the application:\n');
            utils.error(err);
            console.log('\n');
            utils.error('Mojito was not started!\n', null, true);
            return;
        }
        console.log('\n');
        utils.success('\tMojito(v' + mojitoVersion + ') started' +
            (pack.name ? ' \'' + pack.name + '\'' : '') +
            ' on http://127.0.0.1:' + options.port + '/\n');
    });
};
