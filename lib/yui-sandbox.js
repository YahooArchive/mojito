/*jslint nomen:true, sloppy: true, stupid: true, node: true*/

'use strict';

var libfs   = require('fs'),
    libpath = require('path'),
    libvm   = require('vm'),
    appRoot = process.cwd(),
    // trying to use the yui version installed at the app level
    // since thats the only way to customize it per app.
    yuiRoot = libpath.join(appRoot, 'node_modules', 'yui'),
    code;

if (!(libfs.existsSync || libpath.existsSync)(yuiRoot)) {
    // using the yui bundle with mojito by default if the yui
    // is not installed as part of the app.
    yuiRoot = libpath.join(__dirname, '..', 'node_modules', 'yui');
} else {
    console.warn('This application is using a custom version of YUI [' +
        yuiRoot + '] instead of the official version bundled with mojito.');
}

code = {
    min: libfs.readFileSync(libpath.join(yuiRoot,
        'yui-nodejs', 'yui-nodejs-min.js'), 'utf8'),
    raw: libfs.readFileSync(libpath.join(yuiRoot,
        'yui-nodejs', 'yui-nodejs.js'), 'utf8'),
    debug: libfs.readFileSync(libpath.join(yuiRoot,
        'yui-nodejs', 'yui-nodejs-debug.js'), 'utf8')
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
        clearTimeout: clearTimeout,
        clearInterval: clearInterval,
        JSON: JSON,
        __filename: __filename,
        __dirname: libpath.join(yuiRoot, 'yui-nodejs'),
        exports: {}
    };
    filter = (filter && code.hasOwnProperty(filter)) ? filter : 'raw';
    libvm.runInNewContext(code[filter], sandbox, 'build/yui-new/yui-new.js');
    return sandbox.exports.YUI;
};