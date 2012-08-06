/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/

YUI.add('mojito-hb', function(Y, NAME) {

    'use strict';

    var HB = Y.Handlebars,
        cache = Y.namespace('Env.Handlebars');

    /**
     * Class text.
     * @class HandleBarsAdapterServer
     * @private
     */
    function HandleBarsAdapter() {}

    HandleBarsAdapter.prototype = {

        /**
         * Renders the handlebars template using the data provided.
         * @param {object} data The data to render.
         * @param {string} mojitType The name of the mojit type.
         * @param {string} tmpl The name of the template to render.
         * @param {object} adapter The output adapter to use.
         * @param {object} meta Optional metadata.
         * @param {boolean} more Whether there will be more content later.
         */
        render: function (data, mojitType, tmpl, adapter, meta, more) {
            var handler = function (obj) {
                if (obj) {
                    adapter.flush(obj.template(data), meta);
                    Y.log('render complete for view "' +
                        tmpl + '"',
                        'mojito', 'qeperf');
                }
                // TODO: what should we do when the template fails to load?
                //       should we just flush an empty string? the error message
                //       was already reported by the getTemplateObj method for sure.
                adapter.done('', meta);
            };

            this._getTemplateObj(tmpl, !meta.view.cacheTemplates, handler);
        },

        /**
         * Cache the reference to a compiled handlebar template, plus
         * a raw string representation of the template.
         * @private
         * @param {string} tmpl The name of the template to render.
         * @param {boolean} bypassCache Whether or not we should rely on the cached content.
         * @param {function} callback The function that is called with the compiled template
         * @return {object} literal object with the "raw" and "template" references.
         */
        _getTemplateObj: function (tmpl, bypassCache, callback) {
            var handler = function (templateStr) {
                if (templateStr) {
                    // applying a very simple local cache to avoid reading from disk over and over again.
                    // in general, caching a reference to the compiled function is also a good performance boost.
                    cache[tmpl] = {
                        raw: templateStr,
                        template: HB.compile(templateStr)
                    };
                }
                callback(cache[tmpl]);
            };
            if (!cache[tmpl] || bypassCache) {
                this._loadTemplate(tmpl, handler);
            } else {
                callback(cache[tmpl]);
            }
        },

        /**
         * Loads a template from a remote location
         * @param tmpl The location of the template
         * @param cb The callback to call with the template response
         * @private
         */
        _loadTemplate: function (tmpl, cb) {
            Y.log('Loading template from server: ' + tmpl, 'mojito', 'qeperf');
            Y.io(tmpl, {
                on: {
                    complete: function (id, resp) {
                        cb(resp.responseText);
                    }
                }
            });
        }
    };

    Y.namespace('mojito.addons.viewEngines').hb = HandleBarsAdapter;

}, '0.1.0', {requires: [
    'io-base',
    'handlebars'
]});
