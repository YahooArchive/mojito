/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/

var utils = require('./utils'),
    libpath = require('path');

/*
 * A command is expected to export the following:
 *   run     - The function that executes the command. The signature is:
 *               run(params, options, callback);
 *   usage   - Help information for this command, as a string.
 *   options - Option info for supported options. Optional.
 *
 * Option info must be provided as an array of option objects, each with the
 * following keys:
 *   shortName - Short (1-char) option name, without leading dash (e.g. 'v').
 *   longName  - Long option name, without leading dashes (e.g. 'verbose').
 *   hasValue  - True is this option requires a value. Optional; default false.
 */


/*
 * Creates a map keyed by both short and long option names, to simplify lookup
 * of option info from command line args.
 */
function makeOptionMap(optionInfo) {
    var optionMap = {};

    if (optionInfo) {
        optionInfo.forEach(function(info) {
            if (info.shortName) {
                optionMap['-' + info.shortName] = info;
            }
            if (info.longName) {
                optionMap['--' + info.longName] = info;
            }
        });
    }

    return optionMap;
}


/*
 * Parses command line args based on the provided option info. Returns a map
 * with three keys:
 *   params  - an array of the specified parameters
 *   options - a map of options, keyed by long name
 *   errors  - an array of error strings for reporting
 */
function parseArgs(args, optionInfo) {
    var optionMap = makeOptionMap(optionInfo),
        params = [],
        options = {},
        errors = [],
        option,
        arg,
        value;

    while (args.length > 0) {
        arg = args.shift();
        if (arg.charAt(0) === '-') {
            option = optionMap[arg];
            if (option) {
                if (option.hasValue) {
                    if (args.length === 0) {
                        errors.push('Missing value for option: ' + arg);
                    } else {
                        options[option.longName] = args.shift();
                    }
                } else {
                    options[option.longName] = true;
                }
            } else {
                errors.push('Invalid option: ' + arg);
            }
        } else {
            params.push(arg);
        }
    }

    return { params: params, options: options, errors: errors };
}

// ---------- Start of mainline code ----------

function main() {
    var args = process.argv.slice(2),
        commandName = (args.length === 0 ? 'help' : args.shift()),
        command,
        argInfo;

    try {
        command = require('mojito-cli-cmd-' + commandName);
    } catch (e) {
        try {
            command = require(libpath.join(__dirname, '../app/commands/', commandName));
        } catch (e) {
            utils.error('Invalid command: ' + command,
                        'mojito <command> [<params>] [<options>]');
            return;
        }
    }

    if (args.length === 0) {
        argInfo = { command: 'help', params: [] };
    } else {
        argInfo = parseArgs(args, command.options);
    }

    if (argInfo.errors && argInfo.errors.length > 0) {
        argInfo.errors.forEach(function(e) {
            utils.log(e);
        });
        utils.error('Invalid command line.', "Try 'mojito help <command>'.");
        return;
    }

    command.run(argInfo.params, argInfo.options, function(err) {
        if (err) {
            utils.error(err);
        } else {
            utils.success('mojito done.');
        }
    });
}

// Execute the main() function. Note that this occurs as part of the
// require/import process so simply importing/require()ing the cli.js will cause
// the main() operation to be invoked.
main();
