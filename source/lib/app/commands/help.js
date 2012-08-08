/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, stupid:true*/


var fs = require('fs'),
    usage = 'mojito help [command]';


/**
 * Show top-level help, which is simply a list of available commands. Command
 * names are taken from the names of the JavaScript files in the same location
 * as the help command itself.
 */
function helpTop() {
    var files = fs.readdirSync(__dirname),
        commands = [],
        i;

    for (i = 0; i < files.length; i += 1) {
        if (/\.js$/.test(files[i])) {
            commands.push(files[i].split('.')[0]);
        }
    }
    console.log('Available commands: ' + commands.join(', '));
}


/**
 * Show help for the specified command. The help is obtained by loading the
 * corresponding module and accessing the 'help' or 'usage' value. If the
 * command does not exist, an error is reported and top level help is shown.
 * @param {string} command The name of the command to provide help for.
 */
function helpCommand(command) {
    var module;

    function help(ref) {
        module = require(ref);
        console.log(module.help || module.usage ||
                ('No help available for command: ' + command));
    }

    try {
        help('mojito-cli-cmd-' + command);
    } catch (e) {
        try {
            help('./' + command);
        } catch (ee) {
            console.log('No such command: ' + command);
            helpTop();
        }
    }
}


function run(params, options, callback) {
    if (params[0]) {
        helpCommand(params[0]);
    } else {
        helpTop();
    }
}


/**
 * Standard usage string export.
 */
exports.usage = usage;


/**
 * Standard run method hook export.
 */
exports.run = run;
