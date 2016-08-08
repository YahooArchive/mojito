/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var path = require('path'),
    utils = require('mojito/lib/management/utils'),
    start = require('mojito/lib/management/commands/start'),
    ResourceStore = require('mojito/lib/store.server'),
    Shaker = null;

try {
    Shaker = require('shaker').Shaker;
}
catch (exception){
    try{
         var shaker_path = path.join(process.cwd(),'node_modules','shaker');
         Shaker = require(shaker_path).Shaker;

    }catch(exception){
        utils.error('Please install the shaker package from the npm registry.');
    }
}

/**
 * Convert a CSV string into a context object.
 * @param {string} s A string of the form: 'key1:value1,key2:value2'.
 * @return {Object} The context object after conversion.
 */
function contextCsvToObject(s) {
    var ctx = {},
        pairs = s.split(','),
        pair,
        i;

    for (i = 0; i < pairs.length; i += 1) {
        pair = pairs[i].split(':');
        if (pair[0]) {
            if (!pair[1]) {
                utils.warn('Missing value for context key: ' + pair[0]);
            } else {
                ctx[pair[0]] = pair[1];
            }
        }
    }

    return ctx;
}

/**
 * Standard usage string export.
 */
exports.usage = '\nmojito shaker\n' +
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
    },
    {
        longName: 'run',
        shortName: null,
        hasVlue:false
    }
];

/**
 * Standard run method hook export.
 * @param {Array} params An array of optional parameters.
 * @param {object} opts Options/flags for the command.
 * @param {function} callback An optional callback to invoke on completion.
 */
exports.run = function(params, options, callback) {
    options = options || {};
    var root = process.cwd(),
        context = {};

    if (options.context) {
        context = contextCsvToObject(options.context);
    }

    var store = new ResourceStore(root);
    store.preload(context);

    new Shaker(store).run(function(metadata) {
        if(options.run){
            delete options.run;
            start.run(params,options,callback);
        }
    });
};
