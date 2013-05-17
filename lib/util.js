/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

'use strict';

var libpath = require('path');

/**
Produces a normalized web path by joining all the parts and normalizing the
filesystem-like path into web compatible url. This is useful when you have to
generate urls based on filesystem path where unix uses `/` and windows uses `\\`.
Node is pretty smart and it will do the heavy lifting, we just need to adjust
the separtor so it uses the `/`. This method also support relative and absolute
paths.

    util.webpath('foo/bar' ,'baz');
    // => foo/bar/baz
    util.webpath('foo\\bar', 'baz/');
    // => foo/bar/baz/
    util.webpath('./foo/bar', './baz');
    // => foo/bar/baz
    util.webpath(['foo', 'bar', 'baz']);
    // => foo/bar/baz

@method webpath
@param {Array|String*} url the list of parts to be joined and normalized
@return {String} The joined and normalized url
**/
exports.webpath = function (url) {
    var args = [].concat.apply([], arguments),
        parts = libpath.join.apply(libpath, args).split(libpath.sep);
    return parts.join('/');
};
