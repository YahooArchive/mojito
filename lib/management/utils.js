/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint stupid:true, todo:true, node:true*/
'use strict';

var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    existsSync = fs.existsSync || path.existsSync,
    hb = require('yui/handlebars').Handlebars,
    tty = require('tty'), // use process.stdin/err.isTTY instead
    colors = require('colors');

colors.mode = (tty.isatty(1) && tty.isatty(2)) ? 'console' : 'none';


function log(message) {
    console.log(message.cyan.toString());
}

function error(message, usage, die) {
    var msgs = [];

    if (message instanceof Error) {
        msgs.push(('✖ ' + message.message).red.bold);
        if (message.stack) {
            msgs.push('\n' + message.stack.red);
        }
    } else {
        msgs.push(('✖ ' + message).red.bold);
    }

    if (usage) {
        msgs.push('\nusage: ' + usage.grey);
    }

    console.error(msgs.join(' '));

    if (die) {
        process.exit(-1);
    }
}


function success(message) {
    console.log(('✔ ' + message).green.bold.toString());
}


function warn(message) {
    console.warn(('⚠ ' + message).yellow.toString());
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
    /*jslint regexp:true, unparam: true */
    txt = txt.replace(/(&[^;]+;)/g, function (all, ent) {
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
            function (err) {
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
    files.forEach(function (f) {
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
        isMojito = false;

    function checker(file) {
        var filepath,
            contents;

        if (isMojito) { return; }
        filepath = path.join(dir, file);
        if (existsSync(filepath)) {
            contents = fs.readFileSync(filepath, 'utf-8');
            isMojito = requiresMojito.test(contents);
        }
    }

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

/**
 * some sugar for instantiating a Y object and attaching any YUI or Mojito (or
 * any other local) modules to it, with useSync == true. So instead of:
 *
 *   var Y = YUI({useSync: true}).use('oop', ...);
 *   Y.applyConfig({useSync: true, modules:{'mymodule1: ...}});
 *   Y.use('mymodule1', ...);
 *
 * ...specify all modules and optional module configs in one go
 *
 *   var Y = yuiuse({oop: null, mymodule1: 'path/to/it', foo: {base:...}, ...}
 *
 * @method yuiuse
 * @param {Object} modules A hash of module names. If value is falsey, YUI
 *  will load it by name. If it's a string, it's the path of the module file to
 *  load, otherwise assume it's a modules config
 * @param {String} some_particular_yui optional require() param to load YUI lib
 *  from somewhere besides default modules.path
 * @param {Function} callback Optional for YUI().use(.. callback); Loading is
 *  synchronous if omitted
 * @return {Object} yui instance
 */
function yuiuse(modules, my_yui, callback) {
    var yui = require(my_yui || 'yui').YUI,
        names = Object.keys(modules || {}),
        local = {},
        y = yui({useSync: !callback});

    names.forEach(function (name) {
        var val = modules[name];
        if (val) {
            local[name] = typeof val === 'string' ? {fullpath: val} : val;
        }
    });

    y.applyConfig({modules: local});
    y.use(names);
    y.applyConfig({useSync: false});

    return callback ? callback(y) : y;
}

exports.yuiuse = yuiuse;

/**
 */
exports.process_directory = process_directory;

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
