/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint nomen:true, node:true*/

/**
@module moijto-parser-body
**/

'use strict';

/**
Export a function which can create a body parser.
@return {Object} The newly constructed body parser.
**/
module.exports = require('express').bodyParser;

var express = require('express'),
    json = express.json,
    urlencoded = express.urlencoded;

module.exports = function bodyParser(options) {
    var _json = json(options),
        _urlencoded = urlencoded(options);


    return function (req, res, next) {
        _json(req, res, function (err) {
            if (err) {
                return next(err);
            }
            _urlencoded(req, res, function (err) {
                if (err) {
                    return next(err);
                }
                next();
            });
        });
    };
};