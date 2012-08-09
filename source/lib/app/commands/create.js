/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp:true, nomen:true, stupid:true*/


var path = require('path'),
    fs = require('fs'),
    utils = require(path.join(__dirname, '../../management/utils')),
    archetypePath = path.join(__dirname, '../archetypes'),
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
    usage,
    Y = require('yui').YUI({useSync: true}).use('json-parse', 'json-stringify');

Y.applyConfig({useSync: false});

usage = 'mojito create {type} [archetype] {name} [options]\n' +
    "\t- type: 'app', 'mojit', or 'project'\n" +
    '\t- archetype: (optional) template to use for creation\n' +
    '\t- name: given name for creation\n\n' +
    'Example Usage: mojito create app foo\n' +
    "\t(creates directory 'foo' containing new Mojito application)\n" +
    'Example Usage: mojito create mojit Bar\n' +
    "\t(creates directory 'Bar' containing new Mojit)\n\n" +
    'OPTIONS: \n' +
    '\t --port [number]: ' +
    'Provides a default port for your Mojito app to run within.\n' +
    '\t     -p [number]: Short for --port\n' +
    '\t--force: Forced mojit creation even outside a Mojito app.\n' +
    '\t     -f: Short for --force\n';


var createApp = function(archetype, destdir, inputs, force, callback) {

    var type = 'app',
        name = inputs.name,
        data = {
            name: name,
            port: inputs.port
        };

    utils.process_directory(path.join(archetypePath, type, archetype), '/',
        destdir, data, force);

    utils.success(type + ': ' + name + ' created!');

};


var createMojit = function(archetype, destdir, inputs, force, callback) {

    var type = 'mojit',
        name = inputs.name,
        data = {
            name: name
        };

    if (force) {
        destdir = name;
    } else {
        destdir = path.join(process.cwd(), 'mojits', name);
    }

    utils.process_directory(path.join(archetypePath, type, archetype), '/',
        destdir, data, force);

    utils.success(type + ': ' + name + ' created!');

    callback();
};


var createProject = function(archetype, destdir, inputs, force, callback) {

    var type = 'project',
        name = inputs.name,
        data = {
            name: name
        },
        config;

    // Are we in a Mojito App? (We need the application.json file to make this
    // work)
    try {
        config = Y.JSON.parse(String(fs.readFileSync(path.join(process.cwd(),
            'application.json'))));
        config = config[0];
    } catch (err) {
        // there is no application.json
        return utils.error('You need to be in a Mojito application directory' +
            ' that has an \'application.json\' file.');
    }

    utils.makeDir(path.join(process.cwd(), 'artifacts/projects/', archetype));
    destdir = path.join('artifacts/projects/', archetype, destdir);

    utils.process_directory(path.join(archetypePath, type, archetype), '/',
        destdir, data, force);

    utils.success(type + ': ' + name + ' created!');

    callback();
};


function run(params, options, callback) {

    var type = params[0],
        archetype = params[1],
        name = params[2],
        port = options.port || 8666,
        force = options.force || false,
        inputs = {},
        destdir = name,
        create,
        key;

    switch (type.toUpperCase()) {
    case 'APP':
        type = 'app';
        create = createApp;
        break;
    case 'MOJIT':
        type = 'mojit';
        create = createMojit;
        break;
    case 'PROJECT':
        type = 'project';
        create = createProject;
        break;
    default:
        type = null;
    }

    // If we have no "type" then fail
    if (!type) {
        return utils.error('Incorrect type provided', usage);
    }

    // If we have no name then the "archetype" may be it
    if (!name) {
        name = archetype;
        destdir = name;
        archetype = 'default';
    }

    // If we have a name, check its a good one!
    if (name) {
        name = destdir =
            name.replace(/[^a-z0-9]/ig, '_').replace(/(_)\1+/g, '_');

        for (key in reservedWords) {
            if (reservedWords[key] === name) {
                utils.error('Name cannot be one of:\n\n' +
                    reservedWords.join(', ') + '\n', usage);
            }
        }
    }

    // If we have no "name" then fail
    if (!name) {
        return utils.error('Cannot create ' + type + ' without a name!', usage);
    }

    utils.log('creating ' + type + " called '" + name + "'");
    utils.log('(using \"' + archetype + '\" archetype)');

    if (!utils.validate_archetype(type, archetype)) {
        return utils.error('Invalid archetype: \"' + type + '/' + archetype +
            '\"', usage);
    }

    // Define the inputs
    inputs.name = name;
    inputs.port = port;

    create(archetype, destdir, inputs, force, callback);

}


/**
 * Standard usage string export.
 */
exports.usage = usage;


/**
 * Standard options list export.
 */
exports.options = [{
    shortName: 'p',
    longName: 'port',
    hasValue: true
}, {
    shortName: 'f',
    longName: 'force',
    hasValue: false
}];


/**
 * Standard run method hook export.
 */
exports.run = run;
