/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/


YUI.add('mojito-template-renderer', function(Y) {

    /*
     * Mojito's template renderer abstraction. Will plugin in the specified template
     * plugin to do the rendering, depending on the 'type' specified.
     * @class TemplateRenderer
     * @namespace Y.mojit
     * @constructor
     * @param {String} type template engine addon type to use
     * @param {String} templateId
     * @param {Object} options
     */
    function Renderer(type, templateId, options) {
        type = type || 'hb';
        this._renderer = new (Y.mojito.addons.templateEngines[type])(templateId, options);
    }


    Renderer.prototype = {

        /*
         * Renders a template
         * @method render
         * @param {Object} data data to push into the template.
         * @param {string} mojitType name of the mojit type.
         * @param {Object} tmpl some type of template identifier for the template
         *     engine.
         * @param {Object} adapter The output adapter.
         * @param {Object} meta Optional metadata to use.
         * @param {boolean} more Whether there will be more data to render
         *     later. (streaming)
         */
        render: function(data, mojitType, tmpl, adapter, meta, more) {
            this._renderer.render(data, mojitType, tmpl, adapter, meta, more);
        }
    };

    Y.namespace('mojito').TemplateRenderer = Renderer;

}, '0.1.0', {requires: [
    'mojito'
]});
