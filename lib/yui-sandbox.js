/*jslint nomen:true, sloppy: true, stupid: true, node: true*/

'use strict';

var fs = require('fs'),
    path = require('path'),
    vm = require('vm'),
    code = {
        min: fs.readFileSync(path.join(__dirname, '..',
            'node_modules', 'yui', 'yui-nodejs', 'yui-nodejs-min.js'), 'utf8'),
        raw: fs.readFileSync(path.join(__dirname, '..',
            'node_modules', 'yui', 'yui-nodejs', 'yui-nodejs.js'), 'utf8'),
        debug: fs.readFileSync(path.join(__dirname, '..',
            'node_modules', 'yui', 'yui-nodejs', 'yui-nodejs-debug.js'), 'utf8')
    };

/*
    This is a hack to get an isolated YUI object. This is EXPERIMENTAL,
    and eventually we want to have that capability as part of YUI.

    Note: since the new YUI will run in the context of the mojito NPM
    package, we need to replicate all YUI dependencies as part of
    mojito package.json, this hard-dependency can be removed once
    YUI provides a way to create a sandbox.

    How to use this?

    var YUI = require('yui-sandbox.js').getYUI();
    YUI().use('foo');

*/

exports.getYUI = function (filter) {
    var sandbox = {
        console: console,
        process: process,
        require: require,
        module: module,
        setTimeout: setTimeout,
        setInterval: setInterval,
        __filename: __filename,
        __dirname: path.join(__dirname, '..', 'node_modules', 'yui', 'yui-nodejs'),
        exports: {}
    };
    filter = (filter && code.hasOwnProperty(filter)) ? filter : 'raw';
    vm.runInNewContext(code[filter], sandbox, 'build/yui-new/yui-new.js');
    return sandbox.exports.YUI;
};