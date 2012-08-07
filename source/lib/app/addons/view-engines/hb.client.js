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
         * @param {boolean} more Whether there will be more content later.
         */
        render: function (data, mojitType, tmpl, adapter, meta, more) {
            var handler = function (err, obj) {
                if (err) {
                    adapter.error(err);
                    return;
                }

                if (obj) {
                    adapter.flush(obj.template(data), meta);
                    Y.log('render complete for view "' +
                        tmpl + '"',
                        'mojito', 'qeperf');
                }
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
         *  @param {Error|null} callback.err If an error occurred, this parameter will
         *    contain the error. If the operation succeeded, _err_ will be
         *    `null`.
         *  @param {Object} callback.obj An object containing the raw template and a
         *    compiled version of the template.
         * @return {object} literal object with the "raw" and "template" references.
         */
        _getTemplateObj: function (tmpl, bypassCache, callback) {
            var handler = function (templateStr) {
                if (templateStr) {
                    // applying a very simple local cache to avoid reading from requesting template file again
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
