/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, node:true, nomen:true */

(function() {

    'use strict';

/**
 * @fileoverview Mojito command loader/execution harness. The cli parses the
 * command line, identifies a command name, and tries to load a file of that
 * name from the command directory (app/commands by default).
 *
 * A command module is expected to export the following:
 *   run     - The function that executes the command. The signature is:
 *             run(params, options, callback);
 *   options - Option info for supported options. Optional.
 *
 * Option info must be provided as an array of option objects, each with the
 * following keys:
 *   shortName - Short (1-char) option name, without leading dash (e.g. 'v').
 *   longName  - Long option name, without leading dashes (e.g. 'verbose').
 *   hasValue  - True is this option requires a value. Optional; default false.
 */


//  ----------------------------------------------------------------------------
//  Prerequisites
//  ----------------------------------------------------------------------------

    var utils = require('./utils'),
        libpath = require('path');

//  ----------------------------------------------------------------------------
//  CLI Root Object
//  ----------------------------------------------------------------------------

    /**
     * The Command Line Interpreter object. All testable methods and attributes
     * are properties of this object.
     */
    function CLI() {
    }

//  ----------------------------------------------------------------------------
//  Internal Helper Functions
//  ----------------------------------------------------------------------------

    /*
     * Creates a map keyed by both short and long option names, to simplify
     * lookup of option info from command line args.
     * @param {Object} optionInfo Option information in the form of an array of
     *     objects containing option descriptions with the following keys:
     *     shortName - Short (1-char) option name, without leading dash ('v').
     *     longName  - Long option name, without leading dashes ('verbose').
     *     hasValue  - True if option requires a value. Optional; default false.
     * @return {Object} The option map, an object whose keys are the expanded
     *     option values such as {'-v': {...}, '--verbose': {...}} and whose
     *     values are the option info.
     */
    CLI._makeOptionMap = function(optionInfo) {
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
    };


    /*
     * Parses command line args based on the provided option info. 
     * @param {Array} args A command line argument string split by whitespace.
     * @param {Object} optionInfo Option information in the form of an array of
     *     objects containing option descriptions with the following keys:
     *     shortName - Short (1-char) option name, without leading dash ('v').
     *     longName  - Long option name, without leading dashes ('verbose').
     *     hasValue  - True if option requires a value. Optional; default false.
     * @return {Object} A map with three keys:
     *     params  - an array of the specified parameters
     *     options - a map of options, keyed by long name
     *     errors  - an array of error strings for reporting
     */
    CLI._parseArgs = function(args, optionInfo) {
        var optionMap = CLI._makeOptionMap(optionInfo),
            params = [],
            options = {},
            errors = [],
            option,
            arg;

        if (!args) {
            return { params: params, options: options, errors: errors };
        }

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
    };

//  ----------------------------------------------------------------------------
//  Public Functions
//  ----------------------------------------------------------------------------

    /**
     * Executes command line processing. If a valid command is parsed and loaded
     * the command module's run method will be invoked. The command module's
     * exported options are used to assist in parsing the command line.
     */
    CLI.run = function(args) {
        var commandName = args.shift() || 'help',
            command,
            argInfo;

        try {
            command = require('mojito-cli-cmd-' + commandName);
        } catch (e) {
            try {
                command = require(libpath.join('../app/commands/', commandName));
            } catch (e2) {
                utils.error('Error loading command: ' + command + ' ' + e2.message,
                    'mojito <command> [<params>] [<options>]');
                return;
            }
        }

        if (args.length === 0) {
            argInfo = { command: 'help', params: [], options: {} };
        } else {
            argInfo = CLI._parseArgs(args, command.options);
        }

        if (argInfo.errors && argInfo.errors.length > 0) {
            argInfo.errors.forEach(function(e) {
                utils.log(e);
            });
            utils.error('Invalid command line.', "Try 'mojito help <command>'.");
            return;
        }

        command.run(argInfo.params, argInfo.options, function(err, usg, die) {
            if (err) {
                utils.error(err, usg, die);
            } else {
                utils.success('mojito done.');
            }
        });
    };

//  ----------------------------------------------------------------------------
//  EXPORT(S)
//  ----------------------------------------------------------------------------

    /**
     * Export the CLI object, which includes all testable functions.
     * @type {Function}
     */
    module.exports = CLI;

}());
