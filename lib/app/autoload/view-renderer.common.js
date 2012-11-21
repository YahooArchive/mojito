/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/


YUI.add('mojito-view-renderer', function(Y) {


    var cache = {};


    /*
     * Mojito's view renderer abstraction. Will plugin in the specified view
     * plugin to do the rendering, depending on the 'type' specified. This Class
     * can also be used as a factory to avoid creating renderer objects, and to
     * do so, you just need to call `Y.mojito.ViewRenderer('hb', {});` and it will
     * return the cached engine instead of creating a facade for it.
     * @class ViewRenderer
     * @namespace Y.mojito
     * @constructor
     * @param {String} type view engine addon type to use
     * @param {Object} options View engines configuration.
     */
    function Renderer(type, options) {
        type = type || 'hb';
        if (!cache[type]) {
            this._renderer = cache[type] = new (Y.mojito.addons.viewEngines[type])(options);
        } else {
            this._renderer = cache[type];
        }
        return cache[type];
    }


    Renderer.prototype = {

        /*
         * Renders a view
         * @method render
         * @param {Object} data data to push into the view.
         * @param {string} mojitType name of the mojit type.
         * @param {Object} tmpl some type of template identifier for the view
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

    Y.namespace('mojito').ViewRenderer = Renderer;

}, '0.1.0', {requires: [
    'mojito'
]});
