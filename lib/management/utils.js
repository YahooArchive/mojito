/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/


var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    existsSync = fs.existsSync || path.existsSync,
    hb = require('yui/handlebars').Handlebars,
    http = require('http'),
    tty = require('tty'),
    mojito = require('../index.js'),
    archetypes_dir = path.join(__dirname, '../app/archetypes'),
    isatty = tty.isatty(1) && tty.isatty(2);


if (!isatty) {
    // fake out the getters that the "color" library would have added
    (['bold', 'underline', 'italic', 'inverse', 'grey', 'yellow', 'red',
        'green', 'blue', 'white', 'cyan', 'magenta']).forEach(function(style) {
            try {
                Object.defineProperty(String.prototype, style, {
                    get: function() {
                        return this;
                    }
                });
            } catch (e) {
                // just ignore
            }
    });
} else {
    require('colors');
}


function log(message) {
    console.log(message.cyan);
}


function error(message, usage, die) {
    if (message instanceof Error) {
        console.log(('✖ ' + message.message).red.bold);
        if (message.stack) {
            console.log(('\t' + message.stack).red.bold);
        }
    } else {
        console.log(('✖ ' + message).red.bold);
    }
    if (usage) {
        console.log('usage:\n' + usage.grey);
    }
    if (die) {
        process.exit(-1);
    }
}


function success(message) {
    console.log(('✔ ' + message).green.bold);
}


function warn(message) {
    console.log(('⚠ ' + message).yellow);
}


function heir(o) {
    function F() {}
    F.prototype = o;
    return new F();
}


/**
 * Decodes XML entities in the string.
 * Only decodes a subset of named entities.
 * @method decodeHTMLEntities
 * @param {string} txt String to decode
 * @return {string} input string with with XML entities decoded
 */
// TODO:  find a node module that can do this well
function decodeHTMLEntities(txt) {
    txt = txt.replace(/(&[^;]+;)/g, function(all, ent) {
        if ('&#x' === ent.substr(0, 3)) {
            return String.fromCharCode(parseInt(ent.substring(3, ent.length - 1), 16));
        }
        return ent;
    });
    txt = txt.replace(/&lt;/g, '<');
    txt = txt.replace(/&gt;/g, '>');
    txt = txt.replace(/&quot;/g, '"');
    txt = txt.replace(/&apos;/g, "'");
    txt = txt.replace(/&amp;/g, '&');
    return txt;
}


function process_template(archetype_path, file, mojit_dir, template) {

    var archetype_file = path.join(archetype_path, file),
        new_file = path.join(mojit_dir, file.substring(0, file.length - 3)),
        buffer = '',
        stat,
        tmpl,
        compiled,
        output;

    /* going to check for file size and use compileText to avoid
       possible problems with any handlebars templateRoot settings
     */
    stat = fs.statSync(archetype_file);
    if (stat.size > 0) {
        tmpl = fs.readFileSync(archetype_file, 'utf8');
        compiled = hb.compile(tmpl);
        output = compiled(template);
        fs.writeFileSync(new_file, output);
    } else {
        fs.writeFileSync(new_file, '');
    }
}


function process_file(archetype_path, file, mojit_dir, template) {
    if (/\.hb$/.test(file)) {
        // Process as a HB template
        process_template(archetype_path, file, mojit_dir, template);
    } else {
        // Just copy the file over
        util.pump(
            fs.createReadStream(path.join(archetype_path, file)),
            fs.createWriteStream(path.join(mojit_dir, file)),
            function(err) {
                if (err) {
                    warn('Failed to copy file: ' + file);
                }
            }
        );
    }
}


function process_directory(archetype_path, dir, mojit_dir, template, force) {
    //    console.log('process_directory(' + archetype_path + ', ' + dir +
    //        ', ' + mojit_dir + ', ' + template + ',' + force + ')');
    var new_dir = path.join(mojit_dir, dir),
        files;

    try {
        fs.mkdirSync(new_dir, parseInt('755', 8));
    } catch (err) {
        if (err.message.match(/EEXIST/)) {
            warn('Overwriting existing directory: ' + new_dir);
        } else if (err.message.match(/ENOENT/) &&
                   mojit_dir.indexOf('mojits') === 0) {
            if (!force) {
                error('Please cd into a Mojito application before creating' +
                    ' a Mojit.\nTo force Mojit creation, use --force.');
            }
        } else {
            error('Unexpected error: ' + err.message);
        }
    }

    // log('created dir: ' + new_dir);
    // console.log('reading dir: ' + path.join(archetype_path, dir));

    files = fs.readdirSync(path.join(archetype_path, dir));
    files.forEach(function(f) {
        var s = fs.statSync(path.join(archetype_path, '/', dir, '/', f));

        if (f.charAt(0) === '.') {
            return;
        }
        if (s.isDirectory()) {
            process_directory(path.join(archetype_path, '/', dir), f,
                path.join(mojit_dir, '/', dir), template, force);
        } else {
            process_file(path.join(archetype_path, '/', dir), f,
                new_dir, template);
        }
    });
}


function validate_archetype(archetype_type, archetype_name) {
    var found = false,
        files,
        curdir;

    try {
        curdir = path.join(archetypes_dir, archetype_type);
        files = fs.readdirSync(curdir);
        files.forEach(function(archetype) {
            var s = fs.statSync(path.join(curdir, archetype));

            if (s.isDirectory()) {
                if (archetype === archetype_name) {
                    // console.log('found archetype'.blue);
                    found = true;
                }
            }
        });
    } catch (er) {
        warn(er.message);
        return false;
    }
    return found;
}


/**
 * returns a function that determines whether a name is excluded from a list
 * using a set of firewall style rules.
 *
 * Each rule looks like this:
 *  { pattern: /matchPattern/, include: true|false, type: file|dir|any }
 *
 *  If a file matches a rule, it is included or excluded based on the value of
 *  the include flag If rule is a regexp, it is taken to be { pattern: regexp,
 *  include: false, type: 'any' } - i.e. it is an exclusion rule.
 *  The first rule that matches, wins.
 *  The defaultIsExclude value specifies the behavior when none of the rules
 *  match (if not specified, the file is included)
 *
 * @param {Array} rules set of rules to determine what files and directories are
 *     copied.
 * @param {boolean} defaultIsExclude determines what to do when none of the
 *     rules match.
 * @return {function} A match function.
 */
function getExclusionMatcher(rules, defaultIsExclude) {

    return function isExcluded(name, ofType) {
        var index,
            include,
            pattern,
            rule,
            type,
            matchedRule,
            ret = null;

        if (!(ofType === 'file' || ofType === 'dir')) {
            throw new Error(
                'Internal error: file type was not provided, was [' +
                    ofType + ']'
            );
        }

        /* check if there are any rules */

        if (rules.length < 1) {
            throw new Error('No rules specified');
        }

        // console.log('checking ' + name + '...');
        for (index in rules) {
            // console.log('\t against ' + excludes[regex] + ': ' +
            //     name.search(excludes[regex]));
            if (rules.hasOwnProperty(index)) {

                rule = rules[index];

                if (rule instanceof RegExp) {
                    pattern = rule;
                    include = false;
                    type = 'any';
                } else {
                    pattern = rule.pattern;
                    include = !!rule.include;
                    type = rule.type || 'any';
                }

                if (!(type === 'file' || type === 'dir' || type === 'any')) {
                    throw new Error('Invalid type for match [' + type + ']');
                }

                if (!(pattern instanceof RegExp)) {
                    console.log(rule);
                    throw new Error('Pattern was not a regexp for rule');
                }

                if (name.search(pattern) !== -1 &&
                        (type === 'any' || type === ofType)) {
                    matchedRule = rule;
                    ret = !include;
                    break;
                }
            }
        }

        ret = ret === null ? !!defaultIsExclude : ret;
        //console.log('Match [' + name + '], Exclude= [' + ret + ']');
        //console.log('Used rule');
        //console.log(matchedRule);
        return ret;
    };
}


function copyFile(from, to, cb) {
    var content = fs.readFileSync(from, 'utf-8');

    fs.writeFileSync(to, content, 'utf-8');
    if (typeof cb === 'function') {
        cb();
    }
}


/**
 * recursively copies the source to destination directory based on a matcher
 * that returns whether a file is to be excluded.
 * @param {string} src source dir.
 * @param {string} dest destination dir.
 * @param {function} excludeMatcher the matcher that determines if a given file
 *     is to be excluded.
 */
function copyUsingMatcher(src, dest, excludeMatcher) {

    var filenames,
        basedir,
        i,
        name,
        file,
        newdest,
        type;

    //console.log('copying ' + src + ' to ' + dest);
    /* check if source path exists */

    if (!existsSync(src)) {
        throw new Error(src + ' does not exist');
    }

    /* check if source is a directory */

    if (!fs.statSync(src).isDirectory()) {
        throw new Error(src + ' must be a directory');
    }

    /* get the names of all files and directories under source in an array */

    filenames = fs.readdirSync(src);
    basedir = src;

    /* check if destination directory exists */

    if (!existsSync(dest)) {
        fs.mkdirSync(dest, parseInt('755', 8));
    }

    for (i = 0; i < filenames.length; i += 1) {

        name = filenames[i];
        file = basedir + '/' + name;
        type = fs.statSync(file).isDirectory() ? 'dir' : 'file';
        newdest = dest + '/' + name;

        if (!excludeMatcher(file, type)) {
            //console.log('Copy ' + file + ' as ' + newdest);
            if (type === 'dir') {
                copyUsingMatcher(file, newdest, excludeMatcher);
            } else {
                copyFile(file, newdest);
            }
        }
    }
}


function copyExclude(src, dest, excludes) {
    copyUsingMatcher(src, dest, getExclusionMatcher(excludes, false));
}


function copy(obj) {
    var temp = null,
        key = '';

    if (!obj || typeof obj !== 'object') { return obj; }
    temp = new obj.constructor();
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            temp[key] = copy(obj[key]);
        }
    }
    return temp;
}


function removeDir(src) {
    var filenames,
        basedir,
        emptydirs,
        name,
        file,
        count;

    /* check if source path exists */
    if (!existsSync(src)) {
        return;
    }

    /* check if source is a directory */
    if (!fs.statSync(src).isDirectory()) {
        throw new Error(src + ' must be a directory');
    }

    /* get the names of all files and directories under source in an array */

    filenames = fs.readdirSync(src);
    basedir = src;
    emptydirs = [];

    for (name in filenames) {
        if (filenames.hasOwnProperty(name)) {
            file = basedir + '/' + filenames[name];
            if (fs.statSync(file).isDirectory()) {
                emptydirs.push(file);
                removeDir(file);
            } else {
                fs.unlinkSync(file);
            }
        }
    }
    for (count = 0; count < emptydirs.length; count += 1) {
        fs.rmdirSync(emptydirs[count]);
    }
}


function makeDir(p, mode) {

    var ps = path.normalize(p).split('/'),
        i;

    if (!mode) {
        mode = parseInt('755', 8);
    }

    for (i = 0; i <= ps.length; i += 1) {
        try {
            fs.mkdirSync(ps.slice(0, i).join('/'), mode);
        } catch (err) {
            // Dirty way to check dir
        }
    }
}


function isMojitoApp(dir, usage, die) {
    // Mojito apps must have:
    // - either server.js OR index.js
    // - the file above must require('mojito')

    var requiresMojito = /require\s*\(\s*'mojito'\s*\)/,
        isMojito = false,
        checker;

    checker = function(file) {
        var filepath,
            contents;

        if (isMojito) { return; }
        filepath = path.join(dir, file);
        if (existsSync(filepath)) {
            contents = fs.readFileSync(filepath, 'utf-8');
            isMojito = requiresMojito.test(contents);
        }
    };

    ['server.js', 'index.js'].forEach(checker);

    // if command usage is provided, it is assumed that we exit on error
    if (!isMojito && usage) {
        error("The directory '" + dir + "' is not a Mojito Application",
            usage, die);
    }

    return isMojito;
}

/**
 * Convert a CSV string into a context object.
 * @param {string} s A string of the form: 'key1:value1,key2:value2'.
 * @return {Object} The context object after conversion.
 */
function contextCsvToObject(s) {
    var ctx = {},
        pairs = s.split(','),
        pair,
        i;

    for (i = 0; i < pairs.length; i += 1) {
        pair = pairs[i].split(':');
        if (pair[0]) {
            if (!pair[1]) {
                warn('Missing value for context key: ' + pair[0]);
            } else {
                ctx[pair[0]] = pair[1];
            }
        }
    }

    return ctx;
}


// utility class for starting and querying the server (used by a few different
// commands)
function App(options) {
    this._options = options || {};
    this._options.port = this._options.port || 8666;
}


App.prototype = {

    start: function(cb) {
        var app;

        if (this._options.verbose) {
            exports.warn('Starting Mojito App');
        }

        try {
            this._app = app = new mojito.constructor().createServer(
                this._options
            );
            app.listen(this._options.port, null, function(err) {
                // give away the app instance to the start callback
                cb(err, app);
            });
        } catch (err) {
            cb(err);
        }
    },

    // url: what to fetch from the running application
    // cb: function(err, url, content) called with the contents of the URL
    getWebPage: function(url, opts, cb) {
        var app = this,
            buffer = '',
            options = {
                host: '127.0.0.1',
                port: app._options.port,
                path: url,
                method: 'get'
            };

        if (typeof opts === 'function') {
            cb = opts;
        } else {
            Object.keys(opts).forEach(function(k) {
                options[k] = opts[k];
            });
        }

        http.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                buffer += chunk;
            });
            res.on('end', function() {
                if (res.statusCode !== 200) {
                    return cb('Could not get web page: status code: ' +
                        res.statusCode + '\n' + buffer, url);
                } else {
                    cb(null, url, buffer);
                }
            });
        }).on('error', function(err) {
            cb(err, url);
        }).end();
    },

    // urls:  list of urls to fetch
    // cb:  function(err, url, content) called once for each URL
    getWebPages: function(urls, cb) {
        var app = this,
            initOne;

        // need a copy, since we'll be mutating it
        urls = urls.slice();

        initOne = function() {
            if (urls.length) {
                app.getWebPage(urls.shift(), function(err, url, data) {
                    cb(err, url, data);
                    initOne();
                });
            }
        };

        initOne();
    },

    close: function() {
        if (this._options.verbose) {
            exports.warn('Closing Mojito App');
        }
        this._app.close();
    }
};


/**
 */
exports.process_directory = process_directory;

/**
 */
exports.validate_archetype = validate_archetype;

/**
 */
exports.copyExclude = copyExclude;

/**
 */
exports.copyFile = copyFile;

/**
 */
exports.copy = copy;

/**
 */
exports.isMojitoApp = isMojitoApp;

/**
 */
exports.removeDir = removeDir;

/**
 */
exports.makeDir = makeDir;

/**
 */
exports.error = error;

/**
 */
exports.warn = warn;

/**
 */
exports.log = log;

/**
 */
exports.success = success;

/**
 */
exports.App = App;

/**
 */
exports.getExclusionMatcher = getExclusionMatcher;

/**
 */
exports.copyUsingMatcher = copyUsingMatcher;

/**
 */
exports.heir = heir;

/**
 */
exports.contextCsvToObject = contextCsvToObject;

exports.decodeHTMLEntities = decodeHTMLEntities;

