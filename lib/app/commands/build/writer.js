/*jslint node:true, stupid:true */
'use strict';

var fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    copydir = require('wrench').copyDirSyncRecursive; // http://git.io/KYvKWw


function read(from) {
    return fs.readFileSync(from, 'utf-8');
}

function write(filepath, str) {
    mkdirp.sync(path.dirname(filepath));
    fs.writeFileSync(filepath, str, 'utf-8');
}

function writeJson(filepath, obj) {
    write(filepath, JSON.stringify(obj, null, 4));
}

function copy(from, to) {
    write(to, fs.readFileSync(from), false);
}

function rmrf(dir, cb) {
    rimraf(dir, cb);
}

module.exports = {
    read: read,
    write: write,
    writeJson: writeJson,
    copy: copy,
    copydir: copydir,
    rmrf: rmrf
};
