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
        HB = Y.Handlebars,
        cache = YUI.namespace('Env.Handlebars');

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
         * @param {boolean} more Whether there will be more content later.
         */
        render: function (data, mojitType, tmpl, adapter, meta, more) {
            var obj = this._getTemplateObj(tmpl, !meta.view.cacheTemplates);

            if (obj) {
                adapter.flush(obj.template(data), meta);
                Y.log('render complete for view "' +
                                    this.viewId + '"',
                                    'mojito', 'qeperf');
            }
            // TODO: what should we do when the template fails to load?
            //       should we just flush an empty string? the error message
            //       was already reported by the getTemplateObj method for sure.
            adapter.done('', meta);
        },

        /**
         * Stringify the handlebars template.
         * @param {string} tmpl The name of the template to render.
         * @return {string} the string representation of the template
         * that can be sent to the client side.
         */
        compiler: function (tmpl) {
            var obj = this._getTemplateObj(tmpl);
            return obj ? JSON.stringify(obj.str) : false;
        },

        /**
         * Precompiles the handlebars template as a javascript function.
         * @param {string} tmpl The name of the template to render.
         * @return {string} the precompiled template that can be sent to the client side as Javascript code.
         */
        precompile: function (tmpl) {
            var obj = this._getTemplateObj(tmpl);
            return obj ? HB.precompile(obj.str) : false;
        },

        /**
         * Cache the reference to a compiled handlebar template, plus
         * a raw string representation of the template.
         * @private
         * @param {string} tmpl The name of the template to render.
         * @param {boolean} bypassCache Whether or not we should rely on the cached content.
         * @return {object} literal object with the "raw" and "template" references.
         */
        _getTemplateObj: function (tmpl, bypassCache) {
            var str;
            if (!cache[tmpl] || bypassCache) {
                Y.log('Loading template from disk: ' + tmpl, 'mojito', 'qeperf');
                // TODO: should we try/catch this? I don't see any try/catch when reading files
                //       in the rest of the repo, is this the intention?
                str = this._loadTemplate(tmpl);
                if (str) {
                    // applying a very simple local cache to avoid reading from disk over and over again.
                    // in general, caching a reference to the compiled function is also a good performance boost.
                    cache[tmpl] = {
                        raw: str,
                        template: HB.compile(str)
                    };
                }
            }
            return cache[tmpl];
        },

        /**
         * Loads a template from the file system
         * @param tmpl The location of the template file
         * @return {string} The template string
         * @private
         */
        _loadTemplate: function (tmpl) {
            return fs.readFileSync(tmpl, 'utf8');
        }
    };

    Y.namespace('mojito.addons.viewEngines').hb = HandleBarsAdapter;

}, '0.1.0', {requires: ['handlebars']});
