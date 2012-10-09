/*jslint sloppy:true, stupid:true, node:true */
var fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp');

function write(filepath, str, append) {
    mkdirp.sync(path.dirname(filepath));
    fs[append ? 'appendFileSync' : 'writeFileSync'](filepath, str, 'utf-8');
}

function copy(from, to) {
    write(to, fs.readFileSync(from), false);
}

function rmrf(dir, cb) {
    rimraf(dir, cb);
}

module.exports = {
    write: write,
    copy: copy,
    rmrf: rmrf
};
