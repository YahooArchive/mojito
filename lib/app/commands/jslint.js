/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, regexp:true, nomen:true, stupid:true*/


var fs = require('fs'),
    path = require('path'),
    existsSync = fs.existsSync || path.existsSync,
    utils = require(path.join(__dirname, '../../management/utils')),
    usage = 'mojito jslint [app | mojit] [<name>] {options}\n' +
            '\nOPTIONS: \n' +
            '\t  --print      :  print results to stdout \n' +
            '\t   -p          :  short for --print\n',
    options = [
        {
            shortName: 'p',
            longName: 'print',
            hasValue: false
        }
    ];


// ---------- Generic file system utilities ----------


/*
 * A version of fs.mkdirSync that ensures that all intermediate directories
 * are created.
 */
function mkdirsSync(dir, mode) {
    var modeDefault = parseInt('755', 8); // Avoid octal per JSLint

    if (existsSync(dir)) {
        return;
    }
    mode = mode || modeDefault;
    mkdirsSync(path.dirname(dir), mode);
    fs.mkdirSync(dir, mode);
}


/*
 * Deletes a directory including any contained files and directories. This is
 * roughly equivalent to the Unix "rm -rf" command.
 */
function rmSync(file) {
    var failures = [],
        files,
        stat;

    try {
        stat = fs.lstatSync(file);
    } catch (e1) {
        if (/^ENOENT/.test(e1.message)) {
            return null;
        }
        return [file];
    }

    if (stat.isFile() || stat.isSymbolicLink()) {
        try {
            fs.unlinkSync(file);
        } catch (e2) {
            failures.push(file);
        }
    } else if (stat.isDirectory()) {
        files = fs.readdirSync(file);
        files.forEach(function(f) {
            try {
                failures.concat(rmSync(path.join(file, f)));
            } catch (e3) {
                failures.push(path.join(file, f));
            }
        });
    }

    return failures;
}


/*
 * Recursively processes all of the files in a directory tree. Each file is
 * passed to a 'processor' function that can do whatever it needs to do. An
 * optional 'filter' function allows files to be skipped (i.e. not passed to
 * the processor) by returning false.
 */
function processDir(dir, processor, filter) {
    var files = fs.readdirSync(dir),
        file,
        stat;

    filter = filter || function() { return true; };

    files.forEach(function(f) {
        file = path.join(dir, f);
        stat = fs.statSync(file);
        if (filter(file, stat)) {
            if (stat.isDirectory()) {
                processDir(file, processor, filter);
            } else {
                processor(file);
            }
        }
    });
}


/*
 * A very simple class to allow writes to a file that is created only if it
 * needs to be written to, without the caller needing to check on every write.
 */
function OutputFile(filename) {
    var outstream = null;

    this.write = function(s) {
        if (!outstream) {
            mkdirsSync(path.dirname(filename));
            outstream = fs.createWriteStream(filename);
        }
        outstream.write(s);
    };
    this.done = function() {
        if (outstream) {
            outstream.end();
            outstream = null;
        }
    };
}


/*
 * A very simple class to allow writes to stdout.
 */
function OutputStdout(filename) {
    var printedName = false;

    this.write = function(s) {
        if (!printedName) {
            printedName = true;
            process.stdout.write(filename + '\n');
        }
        process.stdout.write(s);
    };
    this.done = function() {};
}


// ---------- JSLint processing ----------


/*
 * Run JSLint over a single file, writing any errors to the provided output,
 * and returning the number of errors encountered.
 */
function lintOneFile(infile, outfile) {
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

    input = fs.readFileSync(infile);
    if (!input) {
        utils.error("Failed to open file '" + infile + "'.", usage);
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
                outfile.write(pad + ' ' + e.line + ',' + e.character + ': ' +
                        e.reason + '\n');
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
}


// ---------- Mojito JSLint usage ----------


/*
 * Return the location of te Mojito framework. We're currently making an
 * assumption about relative location; we really need a way to validate that.
 */
function getFrameworkDir() {
    return path.normalize(__dirname + '/../../../lib');
}


/*
 * Return the directory for the application. If no application name is given,
 * we look to see if we are inside an application already. If a name is given,
 * we check for an app in the current directory, and then look to see if we
 * are already there.
 */
function getAppDir(appName) {
    var cwd = process.cwd(),
        dir,
        file,
        stat,
        parts;

    // If appName was not supplied, see if we're in an app.
    if (!appName) {
        file = path.join(cwd, 'server.js');
        return (existsSync(file) ? cwd : null);
    }

    // Look for the app where we are.
    dir = path.join(cwd, appName);
    if (existsSync(dir)) {
        stat = fs.statSync(dir);
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
}


/*
 * Return the directory for the mojit. Currently assumes we are in the app.
 */
function getMojitDir(mojitPath) {
    var cwd = process.cwd();

    return path.join(cwd, mojitPath);
}


/*
 * Return the name of the mojit, extracted from the path supplied.
 */
function getMojitName(mojitPath) {
    var parts = mojitPath.split('/');

    return parts[parts.length - 1];
}


/*
 * Write an HTML page that makes it easy to navigate through the results. The
 * implementation of this is very "lazy" but also very simple in terms of file
 * system interaction.
 */
function writePage(outDir, rowdata, totalErrors) {
    var outfile = path.join(outDir, 'jslint.html'),
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

    fs.writeFileSync(outfile, html);
}


/*
 * Process all of the files in the input directory, writing any JSLint errors
 * encountered to the output directory. Return the total count of errors.
 */
function processFiles(inDir, outDir, excludeMatcher) {
    var totalErrors = 0,
        rowdata = [];

    inDir = path.normalize(inDir);
    if (outDir) {
        outDir = path.normalize(outDir);
    }

    processDir(inDir,
        function(f) {
            var relname = f.replace(inDir, '').replace(/^\//, ''),
                outname = relname.replace(/\.js$/, '.txt'),
                out,
                errors;

            if (!outDir) {
                out = new OutputStdout(relname);
            } else {
                out = new OutputFile(path.join(outDir, outname));
            }

            errors = lintOneFile(f, out);

            if (errors > 0) {
                rowdata.push({count: errors, text: relname, url: outname});
            }
            totalErrors += errors;
            out.done();
        },
        function(f, s) {
            var p;

            if (excludeMatcher(f, s.isDirectory() ? 'dir' : 'file')) {
                return false;
            }
            p = f.split('/');
            return (p[p.length - 1]).charAt(0) !== '.' &&
                (s.isDirectory() || /\.js$/.test(p));
        });

    if (outDir && totalErrors > 0) {
        writePage(outDir, rowdata, totalErrors);
    }

    return totalErrors;
}


/*
 * Run this command. The options (framework, application, or mojit check, and
 * an optional path) are processed, and JSLint is run on each file. If there
 * are errors, a non-zero process exit is made.
 */
function run(params, options) {
    var excludes,
        inDir,
        outDir,
        failures,
        errors,
        print = options && options.print;

    // Process params to determine input and output locations.
    if (!params || params.length === 0) {
        // framework
        inDir = getFrameworkDir();
        outDir = path.join(process.cwd(), 'artifacts/framework/jslint');
        excludes = [
            /\/artifacts$/,
            /\/tests$/,
            /\/libs$/,
            /\/app\/autoload\/transport$/,
            /\/app\/autoload\/handlebars\.common\.js$/,
            /\/app\/libs$/,
            /\/management$/,
            /\/node_modules$/,
            /\/mojito$/ // for the CI environment
        ];
    } else if (params[0] === 'app') {
        // application
        inDir = getAppDir(params[1]);
        if (!inDir) {
            utils.error('Application not found.', usage);
            return;
        }
        outDir = path.join(inDir, 'artifacts/jslint');
        excludes = [
            /\/tests$/,
            /\/artifacts$/,
            /\/node_modules$/
        ];
    } else if (params[0] === 'mojit') {
        // mojit
        inDir = getMojitDir(params[1]);
        if (!inDir) {
            utils.error('Mojit not found.', usage);
            return;
        }
        outDir = path.join(inDir, 'artifacts/jslint/mojits',
            getMojitName(params[1]));
        excludes = [
            /\/tests$/,
            /\/artifacts$/,
            /\/node_modules$/
        ];
    } else {
        // TODO: [Issue 85] Maybe allow for a single file?
        utils.error('Unrecognized option: ' + params[0], usage);
        return;
    }

    // Delete any files currently in the output location.
    failures = rmSync(outDir);
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
    errors = processFiles(inDir, outDir, utils.getExclusionMatcher(excludes));
    if (!print && errors) {
        console.log('Lint report: ' + path.normalize(outDir));
    }
    process.stdout.write(errors + ' errors found.\n', 'utf8',
        function() {
            if (errors) {
                process.exit(1);
            }
        });
}


/**
 * Standard usage string export.
 */
exports.usage = usage;


/**
 * Standard options export.
 */
exports.options = options;


/**
 * Standard run method hook export.
 */
exports.run = run;
