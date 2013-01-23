/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp:true, nomen:true, stupid:true*/

(function() {

    'use strict';

/**
 * @fileoverview Command logic for the Mojito 'jslint' command.
 */


//  ----------------------------------------------------------------------------
//  Prerequisites
//  ----------------------------------------------------------------------------

    var libfs = require('fs'),
        libpath = require('path'),
        existsSync = libfs.existsSync || libpath.existsSync,
        utils = require(libpath.join(__dirname, '../../management/utils'));

//  ----------------------------------------------------------------------------
//  Command Root Object
//  ----------------------------------------------------------------------------

    /**
     * The Command Line Interpreter object. All testable methods and attributes
     * are properties of this object.
     */
    function Command() {
    }


    /**
     * The usage string output for command help.
     * @type {string}
     */
    Command.usage = 'mojito jslint [app | mojit] [<path>] {options}\n' +
        '\t- target: app or mojit\n' +
        '\t- path (required for a mojit target): ' +
        'the path to the mojit to run jslint on\n\n' +
        'Run jslint on the app in the current directory:\n' +
        '\tmojito jslint app .\n' +
        'Run jslint on mojits/Bar:\n' +
        '\tmojito jslint mojit ./mojits/Bar\n' +
        'Run jslint on the mojito framework itself!\n' +
        '\tmojito jslint\n' +
        '\nOPTIONS: \n' +
        '\t  --print      :  print results to stdout \n' +
        '\t   -p          :  short for --print\n';


    /**
     * An array of option objects containing shortName, longName, and whether
     * the option expects a value (hasValue).
     * @type {Array}
     */
    Command.options = [
        {
            shortName: 'p',
            longName: 'print',
            hasValue: false
        }
    ];


//  ----------------------------------------------------------------------------
//  Generic File System Utilities
//  ----------------------------------------------------------------------------

    /*
     * A version of fs.mkdirSync that ensures that intermediate directories
     * are created.
     * @param {string} dir The leaf-level directory name to create.
     * @param {Number} mode The directory mode as an octal number.
     */
    Command._mkdirsSync = function(dir, mode) {
        var modeDefault = parseInt('755', 8); // Avoid octal per JSLint

        if (existsSync(dir)) {
            return;
        }
        mode = mode || modeDefault;
        Command._mkdirsSync(libpath.dirname(dir), mode);
        libfs.mkdirSync(dir, mode);
    };


    /*
     * Deletes a directory including any contained files and directories. This
     * is roughly equivalent to the Unix "rm -rf" command.
     * @param {string} file The file to remove.
     */
    Command._rmSync = function(file) {
        var failures = [],
            files,
            stat;

        try {
            stat = libfs.lstatSync(file);
        } catch (e1) {
            if (/^ENOENT/.test(e1.message)) {
                return null;
            }
            return [file];
        }

        if (stat.isFile() || stat.isSymbolicLink()) {
            try {
                libfs.unlinkSync(file);
            } catch (e2) {
                failures.push(file);
            }
        } else if (stat.isDirectory()) {
            files = libfs.readdirSync(file);
            files.forEach(function(f) {
                try {
                    failures.concat(Command._rmSync(libpath.join(file, f)));
                } catch (e3) {
                    failures.push(libpath.join(file, f));
                }
            });
        }

        return failures;
    };


    /*
     * Recursively processes all of the files in a directory tree. Each file is
     * passed to a 'processor' function that can do whatever it needs to do. An
     * optional 'filter' function allows files to be skipped (i.e. not passed to
     * the processor) by returning false.
     */
    Command._processDir = function(dir, processor, filter) {
        var files = libfs.readdirSync(dir),
            file,
            stat;

        filter = filter || function() { return true; };

        files.forEach(function(f) {
            file = libpath.join(dir, f);
            stat = libfs.statSync(file);
            if (filter(file, stat)) {
                if (stat.isDirectory()) {
                    Command._processDir(file, processor, filter);
                } else {
                    processor(file);
                }
            }
        });
    };


//  ----------------------------------------------------------------------------
//  Helper Classes 
//  ----------------------------------------------------------------------------

    /*
     * A very simple class to allow writes to a file that is created only if it
     * needs to be written to, without the caller needing to check every write.
     * @param {String} filename The name of the file to write to.
     * @constructor
     */
    Command._OutputFile = function(filename) {
        var outstream = null;

        /*
         * Writes a string to the output file.
         * @param {string} s The string to write.
         */
        this.write = function(s) {
            if (!outstream) {
                Command._mkdirsSync(libpath.dirname(filename));
                outstream = libfs.createWriteStream(filename);
            }
            outstream.write(s);
        };

        /*
         * Closes the output stream.
         */
        this.done = function() {
            if (outstream) {
                outstream.end();
                outstream = null;
            }
        };
    };


    /*
     * A very simple class to allow writes to stdout.
     * @param {String} filename The name of the file to print as a "header".
     * @constructor
     */
    Command._OutputStdout = function(filename) {
        var printedName = false;

        /*
         * Writes a string to standard output.
         * @param {string} s The string to write.
         */
        this.write = function(s) {
            if (!printedName) {
                printedName = true;
                process.stdout.write(filename + '\n');
            }
            process.stdout.write(s);
        };

        /*
         * Closes the output stream. (Note that for stdout this is a noop.)
         */
        this.done = function() {};
    };


//  ----------------------------------------------------------------------------
//  Internal Helper Functions
//  ----------------------------------------------------------------------------

    /*
     * Run JSLint over a single file, writing any errors to the provided output,
     * and returning the number of errors encountered.
     */
    Command._lintOneFile = function(infile, outfile) {
        var jslint = require('jslint'),
            OPTS = {
                'continue': true, // Tolerate continue
                node: true,
                predef: [
                    // CommonJS
                    'exports',
                    // YUI
                    'YUI', 'YUI_config', 'YAHOO', 'YAHOO_config', 'Y',
                    // Node
                    'global', 'process', 'require', '__filename', 'module',
                    // Browser
                    'document', 'navigator', 'console', 'self', 'window'
                ]
            },
            errors = 0,
            i = 0,
            e,
            input,
            len,
            success,
            pad,
            data;

        input = libfs.readFileSync(infile);
        if (!input) {
            utils.error("Failed to open file '" + infile + "'.", Command.usage);
            return 0;
        }
        input = input.toString('utf8');

        // remove shebang (lifted from node.js)
        input = input.replace(/^\#\!.*/, '');

        success = jslint(input, OPTS);
        if (!success) {
            errors = len = jslint.errors.length;
            for (i = 0; i < len; i += 1) {
                pad = String(i + 1);
                while (pad.length < 4) {
                    pad = ' ' + pad;
                }
                e = jslint.errors[i];
                if (e) {
                    outfile.write(pad + ' ' + e.line + ',' + e.character +
                        ': ' + e.reason + '\n');
                    outfile.write('     ' +
                        (e.evidence || '').replace(/^\s+|\s+$/, '') + '\n');
                }
            }
        }

        data = jslint.data();
        data.functions.forEach(function(f) {
            if (f.name.charAt(0) === '_') {
                pad = String(i + 1);
                while (pad.length < 4) {
                    pad = ' ' + pad;
                }
                outfile.write(pad + ' ' + f.line + ': ' +
                        "Unexpected leading '_' in '" + f.name + "'.\n");
                i += 1;
                errors += 1;
            }
            if (f['var']) {
                f['var'].forEach(function(v) {
                    if (v.charAt(0) === '_') {
                        pad = String(i + 1);
                        while (pad.length < 4) {
                            pad = ' ' + pad;
                        }
                        outfile.write(pad + ' ' + f.line + ': ' +
                                "Unexpected leading '_' in '" + v + "'.\n");
                        outfile.write('     ' +
                                'function ' + f.name + '\n');
                        i += 1;
                        errors += 1;
                    }
                });
            }
        });

        return errors;
    };


    /*
     * Return the location of te Mojito framework. We're currently making an
     * assumption about relative location; we really need a way to validate that.
     */
    Command._getFrameworkDir = function() {
        return libpath.normalize(__dirname + '/../../../lib');
    };


    /*
     * Return the directory for the application. If no application name is given,
     * we look to see if we are inside an application already. If a name is given,
     * we check for an app in the current directory, and then look to see if we
     * are already there.
     */
    Command._getAppDir = function(appName) {
        var cwd = process.cwd(),
            dir,
            file,
            stat,
            parts;

        // If appName was not supplied, see if we're in an app.
        if (!appName) {
            file = libpath.join(cwd, 'server.js');
            return (existsSync(file) ? cwd : null);
        }

        // Look for the app where we are.
        dir = libpath.join(cwd, appName);
        if (existsSync(dir)) {
            stat = libfs.statSync(dir);
            if (stat.isDirectory()) {
                return dir;
            }
        }

        // See if we are already in the app.
        parts = cwd.split('/');
        if (parts[parts.length - 1] === appName) {
            return cwd;
        }

        // App not found.
        return null;
    };


    /*
     * Return the directory for the mojit. Currently assumes we are in the app.
     */
    Command._getMojitDir = function(mojitPath) {
        var cwd = process.cwd();

        return libpath.join(cwd, mojitPath);
    };


    /*
     * Return the name of the mojit, extracted from the path supplied.
     */
    Command._getMojitName = function(mojitPath) {
        var parts = mojitPath.split('/');

        return parts[parts.length - 1];
    };


    /*
     * Write an HTML page that makes it easy to navigate through the results. The
     * implementation of this is very "lazy" but also very simple in terms of file
     * system interaction.
     */
    Command._writePage = function(outDir, rowdata, totalErrors) {
        var outfile = libpath.join(outDir, 'jslint.html'),
            html = '<html>' +
                '<head><title>JSLint Report</title></head>' +
                '<body><h1>JSLint Report</h1>' +
                '<p>Total of ' + totalErrors + ' errors in ' +
                rowdata.length + ' files.</p>' +
                '<table>\n';

        rowdata.forEach(function(row) {
            html += '<tr><td>' +
                row.count +
                "</td><td><a href='" +
                row.url +
                "'>" +
                row.text +
                '</a></td></tr>\n';
        });

        html += '</table></body></html>';

        libfs.writeFileSync(outfile, html);
    };


    /*
     * Process all of the files in the input directory, writing any JSLint errors
     * encountered to the output directory. Return the total count of errors.
     */
    Command._processFiles = function(inDir, outDir, excludeMatcher) {
        var totalErrors = 0,
            rowdata = [];

        inDir = libpath.normalize(inDir);
        if (outDir) {
            outDir = libpath.normalize(outDir);
        }

        Command._processDir(inDir,
            function(f) {
                var relname = f.replace(inDir, '').replace(/^\//, ''),
                    outname = relname.replace(/\.js$/, '.txt'),
                    out,
                    errors;

                if (!outDir) {
                    out = new Command._OutputStdout(relname);
                } else {
                    out = new Command._OutputFile(
                        libpath.join(outDir, outname)
                    );
                }

                errors = Command._lintOneFile(f, out);

                if (errors > 0) {
                    rowdata.push({count: errors, text: relname, url: outname});
                }
                totalErrors += errors;
                out.done();
            },
            function(f, s) {
                var p;
                if (excludeMatcher &&
                        excludeMatcher(f, s.isDirectory() ? 'dir' : 'file')) {
                    return false;
                }
                p = f.split('/');
                return (p[p.length - 1]).charAt(0) !== '.' &&
                    (s.isDirectory() || /\.js$/.test(p));
            });

        if (outDir && totalErrors > 0) {
            Command._writePage(outDir, rowdata, totalErrors);
        }

        return totalErrors;
    };


//  ----------------------------------------------------------------------------
//  Public Members
//  ----------------------------------------------------------------------------

    /*
     * Run this command. The options (framework, application, or mojit check, and
     * an optional path) are processed, and JSLint is run on each file. If there
     * are errors, a non-zero process exit is made.
     */
    Command.run = function(params, options) {
        var excludes,
            inDir,
            outDir,
            failures,
            errors,
            mojit_path,
            print = options && options.print;

        // Process params to determine input and output locations.
        if (!params || params.length === 0) {
            // framework
            inDir = Command._getFrameworkDir();
            outDir = libpath.join(process.cwd(), 'artifacts/framework/jslint');
            excludes = [
                /\/artifacts$/,
                /\/tests$/,
                /\/libs$/,
                /\/app\/libs$/,
                /\/node_modules$/,
                /\/mojito$/ // for the CI environment
            ];
        } else if (params[0] === 'app') {
            // application
            inDir = Command._getAppDir(params[1]);
            if (!inDir) {
                utils.error('Application not found.', Command.usage);
                return;
            }
            outDir = libpath.join(inDir, 'artifacts/jslint');
            excludes = [
                /\/tests$/,
                /\/artifacts$/,
                /\/node_modules$/
            ];
        } else if (params[0] === 'mojit') {
            // mojit
            mojit_path = params[1];
            if (!mojit_path) {
                utils.error('Please specify the path to mojit', Command.usage);
                return;
            }
            inDir = Command._getMojitDir(mojit_path);
            if (!existsSync(inDir)) {
                utils.error('Mojit ' + mojit_path + ' not found.',
                    Command.usage);
                return;
            }
            if (!inDir) {
                utils.error('Mojit ' + mojit_path + ' not found.',
                    Command.usage);
                return;
            }
            outDir = libpath.join(inDir, 'artifacts/jslint/mojits',
                Command._getMojitName(mojit_path));
            excludes = [
                /\/tests$/,
                /\/artifacts$/,
                /\/node_modules$/
            ];
        } else {
            utils.error('Unrecognized option: ' + params[0], Command.usage);
            return;
        }

        // Delete any files currently in the output location.
        failures = Command._rmSync(outDir);
        if (failures && failures.length) {
            console.log('Some files could not be deleted:\n');
            failures.forEach(function(f) {
                console.log('\t' + f);
            });
        }

        // Set outDir to null if we just plan on printing to stdout
        if (print) {
            outDir = null;
        }

        // Process the files with JSLint.
        errors = Command._processFiles(inDir, outDir,
            utils.getExclusionMatcher(excludes));
        if (!print && errors) {
            console.log('Lint report: ' + libpath.normalize(outDir));
        }
        process.stdout.write(errors + ' errors found.\n', 'utf8',
            function() {
                if (errors) {
                    // Make sure file streams have the opportunity to finish
                    setTimeout(function () {
                        process.exit(1);
                    });
                }
            });
    };


//  ----------------------------------------------------------------------------
//  EXPORT(S)
//  ----------------------------------------------------------------------------

    /**
     * Export the Command object, which includes all testable functions.
     * @type {Function}
     */
    module.exports = Command;

}());
