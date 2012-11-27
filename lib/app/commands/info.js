/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true */
'use strict';

var path = require('path');

/**
 * Standard usage string export.
 */
exports.usage = 'mojito info';


/**
 * Run this command. The options (framework, application, or mojit check, and
 * an optional path) are processed, and the version information is reported
 * on the console.
 * @param {Array} params An array of optional parameters.
 * @param {object} options Options/flags for the command.
 * @param {function} callback An optional callback to invoke on completion.
 */
/*jslint anon:true, unparam: true */
exports.run = function(params, options, callback) {
    var pack;

    try {
        pack = require(path.resolve(process.cwd(), 'package.json'));
    } catch (err) {
        callback('Error getting info.', null, true);
    }

    console.log('');
    console.log('Name:\t\t' + (pack.name || ''));
    console.log('Description:\t' + (pack.description || ''));
    console.log('Version:\t' + (pack.version || ''));
    console.log('');
    callback();
};
