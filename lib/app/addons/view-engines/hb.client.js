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
        cache = Y.namespace('Env.Mojito.Handlebars');

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
         * @param {boolean} more Whether there is more to be rendered
         */
        render: function (data, mojitType, tmpl, adapter, meta, more) {
            var cacheTemplates = meta && meta.view && meta.view.cacheTemplates,
                handler = function (err, obj) {
                    var output;

                    if (err) {
                        adapter.error(err);
                        return;
                    }

                    output = obj.compiled(data);

                    if (more) {
                        adapter.flush(output, meta);
                    } else {
                        adapter.done(output, meta);
                    }
                };

            this._getTemplateObj(tmpl, !cacheTemplates, handler);
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
         * Loads a template from a remote location
         * @param tmpl The location of the template
         * @param cb The callback to call with the template response
         * @private
         */
        _loadTemplate: function (tmpl, cb) {
            Y.io(tmpl, {
                on: {
                    success: function (id, resp) {
                        cb(null, resp.responseText);
                    },
                    failure: function (id, resp) {
                        cb({
                            code: resp.status,
                            message: resp.statusText
                        });
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
