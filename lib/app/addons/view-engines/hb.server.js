/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true*/
/*global YUI*/


YUI.add('mojito-hb', function(Y, NAME) {

    'use strict';

    var fs = require('fs'),
        HB = require('yui/handlebars').Handlebars,
        cache = YUI.namespace('Env.Mojito.Handlebars');

    /**
     * Class text.
     * @class HandleBarsAdapterServer
     * @private
     */
    function HandleBarsAdapter(viewId) {
        this.viewId = viewId;
    }

    HandleBarsAdapter.prototype = {

        /**
         * Renders the handlebars template using the data provided.
         * @param {object} data The data to render.
         * @param {string} mojitType The name of the mojit type.
         * @param {string} tmpl The name of the template to render.
         * @param {object} adapter The output adapter to use.
         * @param {object} meta Optional metadata.
         * @param {boolean} more
         */
        render: function (data, mojitType, tmpl, adapter, meta, more) {
            var handler = function (err, obj) {
                if (err) {
                    adapter.error(err);
                    return;
                }

                if (obj) {
                    adapter.flush(obj.compiled(data), meta);
                    Y.log('render complete for view "' +
                        tmpl + '"',
                        'mojito', 'qeperf');
                }

                if (!more || false === more) {
                    adapter.done('', meta);
                }
            };

            this._getTemplateObj(tmpl, !meta.view.cacheTemplates, handler);
        },

        /**
         * Stringify the handlebars template.
         * @param {string} tmpl The name of the template to render.
         * @return {string} the string representation of the template
         * that can be sent to the client side.
         */
        compiler: function (tmpl, callback) {
            this._getTemplateObj(tmpl, false, function (err, obj) {
                callback(err, Y.JSON.stringify(obj.raw));
            });
        },

        /**
         * Precompiles the handlebars template as a string of javascript.
         * @param {string} tmpl The name of the template to render.
         * @return {string} the precompiled template that can be sent to the client side as Javascript code.
         */
        precompile: function (tmpl, callback) {
            this._loadTemplate(tmpl, function (err, raw) {
                callback(err, HB.precompile(raw));
            });
        },

        /**
         * Cache the reference to a compiled handlebar template, plus
         * a raw string representation of the template.
         * @private
         * @param {string} tmpl The name of the template to render.
         * @param {boolean} bypassCache Whether or not we should rely on the cached content.
         * @param {function} callback The function that is called with the compiled template
         */
        _getTemplateObj: function (tmpl, bypassCache, callback) {
            if (cache[tmpl] && !bypassCache) {
                callback(null, cache[tmpl]);
                return;
            }

            this._loadTemplate(tmpl, function (err, str) {
                if (err) {
                    callback(err);
                    return;
                }
                cache[tmpl] = {
                    raw: str,
                    compiled: HB.compile(str)
                };
                callback(null, cache[tmpl]);
            });
        },

        /**
         * Loads a template from the file system
         * @param {string} tmpl The location of the template file
         * @param {function} callback The callback to call with the template contents
         * @private
         */
        _loadTemplate: function (tmpl, callback) {
            Y.log('Loading template from disk: ' + tmpl, 'mojito', 'qeperf');
            fs.readFile(tmpl, 'utf8', function (err, data) {
                callback(err, data);
            });
        }
    };

    Y.namespace('mojito.addons.viewEngines').hb = HandleBarsAdapter;

}, '0.1.0', {requires: ['json-stringify']});
