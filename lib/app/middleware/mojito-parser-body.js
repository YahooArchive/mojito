/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/


var express = require('express');

/**
 * Export a function which can create a body parser.
 * @return {Object} The newly constructed body parser.
 */
module.exports = function() {
    return express.bodyParser();
};

