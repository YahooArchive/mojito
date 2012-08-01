/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true, stupid:true*/
/*global YUI*/


/**
 * @Module ViewEngines
 */
YUI.add('mojito-mu', function(Y, NAME) {

    Y.namespace('mojito.addons.viewEngines').mu = Y.mojito.addons.viewEngines.hb;

}, '0.1.0', {requires: [
    'mojito-hb'
]});
