/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, stupid:true*/


var fs = require('fs'),
    vm = require('vm'),
    pa = require('path'),
    utils = require('./utils'),
    walkDir,
    updateModulesWithFile,
    isExcluded,
    // creating a vm context to execute all files
    // we want to reuse it because it is 200x faster
    // than creating a new one per file.
    contextForRunInContext = vm.createContext({
        console: {
            log: function() {}
        },
        window: {},
        document: {},
        YUI: null
    }),
    Y = require('yui').YUI({useSync: true}).use('json-parse', 'json-stringify');

Y.applyConfig({useSync: false});

walkDir = function(dir, modules, excludes) {
    // console.log("Walking " + dir);
    var files = fs.readdirSync(dir),
        filepath,
        meta,
        i = 0,
        fstat;

    // console.log(files);
    // console.log(excludes);

    for (i = 0; i < files.length; i += 1) {
        filepath = dir + '/' + files[i];
        if (!isExcluded(filepath, excludes)) {
            fstat = fs.statSync(filepath);
            if (fstat.isDirectory()) {
                walkDir(filepath, modules, excludes);
            } else if (fstat.isFile()) {
                updateModulesWithFile(modules, meta, filepath, excludes);
            }
        }
    }
};


updateModulesWithFile = function(modules, meta, fullpath, excludes) {
    var file,
        ctx,
        mod,
        fn;

    if (pa.extname(fullpath) === '.js') {
        // console.log('Configuring ' + fullpath);

        file = fs.readFileSync(fullpath, 'utf8');
        // setting up the fake YUI before executing the file
        contextForRunInContext.YUI = {
            add: function(name, fn, version, meta) {
                if (!meta) {
                    meta = {};
                }
                modules[name] = {
                    fullpath: fullpath,
                    requires: meta.requires || []
                };
            }
        };
        try {
            vm.runInContext(file, contextForRunInContext, fullpath);
        } catch (e) {
            utils.error(e.message + ' in file: ' + fullpath, null, true);
        }
    }
};


isExcluded = function(path, ex) {
    var i,
        exclude;

    for (i = 0; i < ex.length; i += 1) {
        exclude = ex[i];
        // console.log('### does ' + path + ' match ' + exclude + ' ??');
        if (path.match(exclude)) {
            // console.log("SKIPPING " + path + " !!!");
            return true;
        }
    }
    // console.log("\t"+path+" is good.");
    return false;
};


/**
 * Configures modules in a directory, ignoring any excluded by the exclusions
 * provided.
 * @param {string} dir The directory name to walk/configure.
 * @param {Array} excludes A list of exclusions.
 * @return {Object} A map of modules.
 */
module.exports = function(dir, excludes) {

    var modules = {},
        i;

    if (!excludes) {
        excludes = [];
    }

    if (dir === undefined) {
        return modules;
    }

    if (!Y.Lang.isArray(dir)) {
        dir = [dir];
    }

    for (i = 0; i < dir.length; i += 1) {
        walkDir(dir[i], modules, excludes);
    }

    // console.log(Y.JSON.stringify(modules));
    return modules;
};
