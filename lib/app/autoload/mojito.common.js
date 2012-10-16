/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/
/*global YUI*/


YUI.add('mojito', function(Y, NAME) {

    Y.namespace('mojito').version = '0.2';
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

    // defining the process data scope bound to YUI.Env, which is
    // persistent between requests on the same process on the
    // server side and persistent per page on the client side.
    // TODO: on the client side we might want to use sessionStorage
    // TODO: abstract everything related with data into its own component
    // TODO: this structure leaks, should be well documented
    YUI.Env.mojito.DataProcess = YUI.Env.mojito.DataProcess || (function () {

        var data = {};

        function key(obj) {
            return Y.Lang.isObject(obj) ? JSON.stringify(obj) : obj;
        }

        return {

            /**
            * Adds a new entry to the cache.
            *
            * @method add
            * @param request  {Object} Request value.
            * @param response {Object} Response value.
            * @return {Object} Cached object, or null.
            */
            add: function (request, response) {
                return (data[key(request)] = response);
            },

            /**
            * Flushes cache.
            *
            * @method flush
            */
            flush: function () {
                data = {};
            },

            /**
            * Retrieves cached object for given request, if available.
            *
            * @method retrieve
            * @param request {Object} Request object.
            * @return {Object} Cached object, or null.
            */
            retrieve: function (request) {
                return data[key(request)] || null;
            }

        };
    }());

}, '0.1.0', {requires: []});
