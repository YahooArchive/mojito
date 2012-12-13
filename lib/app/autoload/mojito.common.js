/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/
/*global YUI*/


YUI.add('mojito', function(Y, NAME) {

    Y.namespace('mojito.trans');
    Y.namespace('mojito.actions');
    Y.namespace('mojito.binders');
    Y.namespace('mojito.controllers');
    Y.namespace('mojito.models');
    Y.namespace('mojito.addons');
    Y.namespace('mojito.addons.ac');
    Y.namespace('mojito.addons.viewEngines');

    // this is a facade for the real implementation from mojito-perf module
    // that will have to be plugged manually to get the metrics in the
    // console or a log file.
    Y.mojito.perf = {
        timeline: function () {
            return {
                done: function () {}
            };
        },
        mark: function () {}
    };

    // internal mojito framework cache (this is probably legacy)
    YUI.namespace('_mojito._cache');

    // setting the stage for all data-scopes implementation
    YUI.namespace('Env.mojito');

}, '0.1.0', {requires: []});
