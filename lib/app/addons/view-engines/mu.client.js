/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/

/**
 * View engines.
 *
 * Please see the [documentation](http://developer.yahoo.com/cocktails/mojito/docs/topics/mojito_extensions.html#view-engines).
 *
 * @module ViewEngines
 */


/**
 * @Module ViewEngines
 */
YUI.add('mojito-mu', function(Y, NAME) {

    Y.mojito.addons.viewEngines.mu = Y.mojito.addons.viewEngines.hb;

}, '0.1.0', {requires: [
    'mojito-hb'
]});
