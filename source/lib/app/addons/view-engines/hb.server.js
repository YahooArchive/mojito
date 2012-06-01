/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true*/
/*global YUI*/


YUI.add('mojito-hb', function(Y, NAME) {

    var fs = require('fs'),
        HB = require('yui/handlebars').Handlebars,
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
        render: function(data, mojitType, tmpl, adapter, meta, more) {
            var str, precompiled, template, result;

            // apply a very dummy cache
            if (!cache[tmpl] || !meta.view.cacheTemplates) {
                str = fs.readFileSync(tmpl, 'utf8');
                cache[tmpl] = {
                    raw: str,
                    template: HB.compile(str)
                };
            }
            adapter.flush(cache[tmpl].template(data), meta);
            Y.log('render complete for view "' +
                                this.viewId + '"',
                                'mojito', 'qeperf');
            adapter.done('', meta);
        },

        /**
         * Stringify the handlebars template.
         * @param {string} tmpl The name of the template to render.
         * @return {string} the string representation of the template
         * that can be sent to the client side.
         */
        compiler: function(tmpl) {
            return JSON.stringify(fs.readFileSync(tmpl, 'utf8'));
        },

        /**
         * Precompiles the handlebars template.
         * @param {string} tmpl The name of the template to render.
         * @return {string} the precompiled template that can be sent to the client side.
         */
        precompile: function(tmpl) {
            return HB.precompile(fs.readFileSync(tmpl, 'utf8'));
        }
    };

    Y.namespace('mojito.addons.viewEngines').hb = HandleBarsAdapter;

}, '0.1.0', {requires: []});
