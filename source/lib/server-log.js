/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/


// TODO: [Issue 70] SIMPLIFY.

// TODO: [Issue 97] allow options to be on config.json at the framework
// level.
var tty = require('tty'),
    LOG_LEVEL = 'debug',
    YUI_LOGS = true,
    isatty = tty.isatty(1) && tty.isatty(2),
    tests = {
        INFO: /INFO$/,
        DEBUG: /DEBUG$/,
        WARN: /WARN$/,
        ERROR: /ERROR$/
    },
    writer,
    colored,
    bland,
    formatter,
    options,
    Y = require('yui').YUI({useSync: true}).use('json-parse', 'json-stringify');

Y.applyConfig({useSync: false});

writer = function(data) {
    var i;

    if (typeof data === 'object' && data.length) {
        // this is a flush of many logs
        for (i = 0; i < data.length; i += 1) {
            console.log(data[i]);
        }
    } else {
        console.log.apply(console, arguments);
    }
};


colored = function(msg, lvl, source, timestamp, opts) {
    var ts = opts.timestamp ? ('(' + timestamp + ') ').grey : '',
        code = '',
        stack = '';

    if (msg === undefined) {
        msg = 'undefined';
    } else if (msg === null) {
        msg = 'null';
    } else if (msg instanceof Error) {
        if (msg.code) {
            code = ' ' + msg.code;
        }
        if (msg.stack) {
            stack = '\n' + msg.stack;
        }
        msg = ('Error' + code + ': ' + msg.message + stack);
    } else if (typeof msg === 'object') {
        msg = Y.JSON.stringify(msg, null, 2);
    } else {
        msg = msg ? msg.toString() : '';
    }
    source = source ? (source + ': ').blue : '';
    lvl = lvl || 'INFO';
    lvl = lvl.toUpperCase();
    if (tests.ERROR.test(lvl)) {
        lvl = ('[' + lvl + '] ').red.bold;
        msg = msg.red.bold;
    } else if (tests.WARN.test(lvl)) {
        lvl = ('[' + lvl + ']  ').yellow.bold;
        msg = msg.yellow.bold;
    } else if (tests.INFO.test(lvl)) {
        lvl = ('[' + lvl + ']  ').white;
        msg = msg.green;
    } else if (tests.DEBUG.test(lvl)) {
        lvl = ('[' + lvl + '] ').cyan;
        msg = msg.cyan;
    } else {
        lvl = ('[' + lvl + '] ').magenta;
        msg = msg.magenta;
    }
    return lvl + ts + source + msg;
};


bland = function(msg, lvl, source, timestamp, opts) {
    var ts = opts.timestamp ? ('(' + timestamp + ') ') : '',
        code = '',
        stack = '';

    if (msg instanceof Error) {
        if (msg.code) {
            code = ' ' + msg.code;
        }
        if (msg.stack) {
            stack = '\n' + msg.stack;
        }
        msg = ('Error' + code + ': ' + msg.message + stack);
    } else if (typeof msg === 'object') {
        msg = Y.JSON.stringify(msg, null, 2);
    } else {
        msg = msg ? msg.toString() : '';
    }
    source = source ? (source + ': ') : '';
    lvl = lvl || 'INFO';
    lvl = lvl.toUpperCase();
    lvl = ('[' + lvl + '] ');
    return lvl + ts + source + msg;
};


formatter = function(msg, lvl, source, timestamp, opts) {
    var myFormatter = (isatty && ''.red) ? colored : bland;

    return myFormatter(msg, lvl, source, timestamp, opts);
};


options = {
    writer: writer,
    formatter: formatter,
    timestamp: true,
    level: LOG_LEVEL,
    defaultLevel: 'debug',
    yui: YUI_LOGS,
    order: [
        'DEBUG', 'MOJITO', 'INFO', 'WARN', 'ERROR', 'NONE'
    ],
    filter: {
        DEBUG: true,
        MOJITO: true,
        INFO: true,
        WARN: true,
        ERROR: true,
        NONE: true
    }
};

/**
 */
module.exports = {
    options: options
};
