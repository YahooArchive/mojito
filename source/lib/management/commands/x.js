/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/


var 
    libpath = require('path'),
    libfs = require('fs'),
    libqs = require('querystring'),
    libutils = require('../utils'),
    libycb = require('../../libs/ycb'),
    ResourceStore = require('../../store.server.js'),
    
    SKIP_RUNTIME = false;



// deep copies an object
function _cloneObj(o) {
    var newO,
        i;

    if (typeof o !== 'object') {
        return o;
    }
    if (!o) {
        return o;
    }

    if ('[object Array]' === Object.prototype.toString.apply(o)) {
        newO = [];
        for (i = 0; i < o.length; i += 1) {
            newO[i] = _cloneObj(o[i]);
        }
        return newO;
    }

    newO = {};
    for (i in o) {
        if (o.hasOwnProperty(i)) {
            newO[i] = _cloneObj(o[i]);
        }
    }
    return newO;
}


function list_keys(obj) {
    var k, keys = [];
    for (k in obj) {
        if (obj.hasOwnProperty(k)) {
            keys.push(k);
            if ('object' === typeof obj[k]) {
                keys = keys.concat(list_keys(obj[k]));
            }
        }
    }
    return keys;
}


function flatten_dims(dims) {
    var d, dim;
    var names, out = {};
    for (d = 0; d < dims.length; d++) {
        dim = dims[d];
        name = Object.keys(dim)[0];
        out[name] =  list_keys(dim[name]);
    }
    return out;
}


// there is no doubt a better way of doing this
function list_all_ctxs(dims) {
    var nctxs, c, ctxs = [],
        dn, dname, dnames,
        dv, dval, dvals,
        e, each, mod;

    dims = flatten_dims(dims);
    dnames = Object.keys(dims);

    nctxs = 1;
    for (dn = 0; dn < dnames.length; dn++) {
        dname = dnames[dn];
        if (SKIP_RUNTIME && dname === 'runtime') {
            continue;
        }
        dvals = dims[dname];
        if (dname !== 'runtime') {
            // we never have indeterminant runtime
            dvals.push('*');
        }
        nctxs *= dvals.length;
    }

    for (c = 0; c < nctxs; c++) {
        ctxs[c] = {};
    }
    mod = 1;
    for (dn = 0; dn < dnames.length; dn++) {
        dname = dnames[dn];
        if (SKIP_RUNTIME && dname === 'runtime') {
            continue;
        }
        dvals = dims[dname];
        mod *= dvals.length;
        each = nctxs / mod;

        e = each;
        dv = 0;
        for (c = 0; c < nctxs; --e, c++) {
            if (0 === e) {
                e = each;
                dv++;
                dv = dv % dvals.length;
            }
            dval = dvals[dv];
            if ('*' !== dval) {
                ctxs[c][dname] = dval;
            }
        }
    }
    return ctxs;
}


function list_selectors(ycb, ctx) {
    var sels = [ '*' ];
    var p, part, parts;
    parts = libycb.readNoMerge(_cloneObj(ycb), ctx);
    for (p = 0; p < parts.length; p++) {
        part = parts[p];
        if (part.selector) {
            sels.unshift(part.selector);
        }
    }
    return sels;
}


function run(params, options) {
    var store = new ResourceStore(process.cwd());
    var dims = store._readYcbDimensions();
    var ycb = store._readConfigJSON('application.json');
    ycb = dims.concat(ycb);

    dims = dims[0].dimensions;

    var ctx;
    var sels;
    var posls = {};
    var ctxs = list_all_ctxs(dims);
    for (var c = 0; c < ctxs.length; c++) {
        ctx = ctxs[c];
        sels = list_selectors(ycb, ctx);
        console.log('-- context ' + libycb._getLookupPath(dims, ctx) + ' -- selectors ' + JSON.stringify(sels));
        posls[JSON.stringify(sels)] = sels;
    }
    for (var poslKey in posls) {
        if (posls.hasOwnProperty(poslKey)) {
            var posl = posls[poslKey];
            console.log('-- posl ' + posl.join(','));
        }
    }
};


exports.usage = 'mojito x   // experiments\n';
exports.options = [];
exports.run = run;


