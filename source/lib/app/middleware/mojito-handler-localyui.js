/*
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/


// ********************************************************************
// TEMPORARY -- as part of the YUI App Framework integrated environment
// ********************************************************************


var libpath = require('path'),
    libcombo = require('combohandler');

// This is just a wrapper around combohandler, which doesn't behave quite
// like we'd like.
module.exports = function(config) {
    var combo,
        mojitoRoot;
    mojitoRoot = config.store.localyui.mojitoRoot;
    combo = libcombo.combine({rootPath: libpath.join(mojitoRoot, '../node_modules/yui')});
    return function(req, res, next) {
        return combo(req, res, function(err) {
            // swallow errors, and also handle res.body
            if (res.body) {
                res.end(res.body);
                return;
            }
            next();
        });
    };
};


