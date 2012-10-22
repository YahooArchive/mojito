/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp:true, nomen:true, stupid:true*/


var path = require('path'),
    fs = require('fs'),
    utils = require(path.resolve(__dirname, '../../management/utils')),
    archetypePath = path.resolve(__dirname, '../archetypes'),
    // Found at http://www.crockford.com/javascript/survey.html
    reservedWords = [
        'abstract',
        'boolean', 'break', 'byte',
        'case', 'catch', 'char', 'class', 'const', 'continue',
        'debugger', 'default', 'delete', 'do', 'double',
        'else', 'enum', 'export', 'extends',
        'false', 'final', 'finally', 'float', 'for', 'function',
        'goto',
        'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface',
        'long',
        'native', 'new', 'null',
        'package', 'private', 'protected', 'public',
        'return',
        'short', 'static', 'super', 'switch', 'synchronized',
        'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof',
        'var', 'volatile', 'void',
        'while', 'with'
    ],
    Y = require('yui').YUI({useSync: true}).use('json-parse', 'json-stringify');

Y.applyConfig({useSync: false});


/**
 * Determine the path to some archtype and ensure that it exists (or die)
 * @param {String} type Is one of: app, mojit, custom
 * @param {String} subtype If type is 'custom', this is the path to the source
 *   directory of the archtype files to use. Otherwise, it's a subdirectory of
 *   the mojito framework archetype path (archetypePath).
 * @return {String} absolute filesystem path
 */
function getArchetypeSrcDir(type, subtype) {
    var stat, srcdir, errmsg;

    if (type === 'custom') {
        srcdir = path.resolve(subtype);
        errmsg = 'Custom archetype path does not exist: ' + srcdir;
    } else {
        srcdir = path.resolve(archetypePath, type, subtype);
        errmsg = 'Invalid archetype "' + type + '"';
    }

    try {
        stat = fs.statSync(srcdir);
        if (!stat.isDirectory()) {
            utils.error('Archetype path is not a directory', exports.usage, true);
        }
    } catch (err) {
        utils.error(errmsg, exports.usage, true);
    }

    return srcdir;
}

/**
 * @param {String} name
 * @return {String} name The cleaned up name of the app, mojit, etc. to create.
 */
function cleanName(name) {
    var newname = name && name.replace(/[^a-z_0-9]+/ig, '_'),
        msg;

    if (!name) {
        utils.error('Missing a target name to create', exports.usage, true);
    }

    if (-1 !== reservedWords.indexOf(newname)) {
        msg = 'Name cannot be one of: ' + reservedWords.join(', ') + '\n';
        utils.error(msg, exports.usage, true);
    }

    if (name !== newname) {
        msg = ['changing name ', name, ' to ', newname,
            ' so it is usable as a javascript identifier'].join('"');
        utils.log(msg);
    }

    return newname;
}

function run(params, options, callback) {
    var port = options.port || 8666,
        force = options.force || false,
        inputs = utils.contextCsvToObject(options.keyval || ''),
        srcdir,
        destdir,

        // params[0] must be "app", "mojit", "custom"
        type = params[0] ? params[0].toLowerCase() : '',

        // params[1] may be "default", "simple", "full", "hybrid", path, name
        subtype = params[1],

        // params[2] may be name
        name = params[2];

    // If we have no name then the "subtype" might be it
    if (!name && 'hybrid' !== subtype) {
        name = subtype;
        subtype = 'default';
    }

    // check name, convert to js compat name, or die
    name = cleanName(name);

    // Validate type, which dictates destination path/name
    switch (type) {
    case 'app':
    case 'custom':
        destdir = path.resolve(process.cwd(), name);
        break;
    case 'mojit':
        destdir = path.resolve(process.cwd(), 'mojits', name);
        break;
    default:
        return utils.error('Incorrect type "' + type +
            '", must be either "app", "mojit", or "custom".', exports.usage);
    }

    // get path to mojito's archetypes dir, or a custom one, or die
    srcdir = getArchetypeSrcDir(type, subtype);

    utils.log('creating ' + type + " type named '" + name + "'");
    utils.log('(using "' + subtype + '" archetype)');

    // Define the inputs
    inputs.name = name;
    inputs.port = port;

    utils.process_directory(srcdir, '/', destdir, inputs, force);
    utils.success(type + ': ' + name + ' created!');
    callback();
}


/**
 * Standard usage string export.
 */
exports.usage = [
    'mojito create {type} [subtype or source directory] {name} [options]',
    '  - type: "app", "mojit", or "custom".',
    '  - archetype: optional template. Possible values are default, full, simple',
    '      "app" types also have a "hybrid" archetype which creates an app and a',
    '      mojit with common configurations for use with hybrid app.',
    '      If the type is "custom" then this is the path to your own archetype',
    '      directory.',
    '  - name: name of the app or mojit to create',
    '',
    'Example: mojito create app Foo',
    "  (creates directory 'Foo' containing new Mojito application)",
    '',
    'Example: mojito create mojit Bar',
    '  (creates directory "Bar" containing new Mojit)',
    '',
    'Example: mojito create app hybrid Baz',
    '  (creates directory "Baz" containing new hybrid app and mojit)',
    '',
    'OPTIONS: ',
    '  --port [number]  Specifies default port for your Mojito app to run on.',
    '  -p [number]      Short for --port',
    '  --force          Forced mojit creation even outside a Mojito app.',
    '  -f               Short for --force',
    '  -keyval [string] key value pairs to pass to a custom archetype template',
    '                   a key/value is separated by colons, key/value pairs by',
    '                   commas: "key1:val1,key2:val2',
    '  -k [string]      Short for --keyval'].join("\n");


/**
 * Standard options list export.
 */
exports.options = [{
    shortName: 'f',
    longName: 'force',
    hasValue: false
}, {
    shortName: 'k',
    longName: 'keyval',
    hasValue: true
}, {
    shortName: 'p',
    longName: 'port',
    hasValue: true
}];


/**
 * Standard run method hook export.
 */
exports.run = run;
