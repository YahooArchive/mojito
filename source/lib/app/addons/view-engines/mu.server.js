/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true*/
/*global YUI*/


YUI.add('mojito-mu', function(Y, NAME) {

    var mu = YUI.require('mu2'),
        fs = require('fs');


    /**
     * Class text.
     * @class MuAdapterServer
     * @private
     */
    function MuAdapter(viewId) {
        this.viewId = viewId;
    }


    MuAdapter.prototype = {

        /**
         * Renders the mustache template using the data provided.
         * @param {object} data The data to render.
         * @param {string} mojitType The name of the mojit type.
         * @param {string} tmpl The name of the template to render.
         * @param {object} adapter The output adapter to use.
         * @param {object} meta Optional metadata.
         * @param {boolean} more Whether there will be more content later.
         */
        render: function(data, mojitType, tmpl, adapter, meta, more) {
            var me = this;

            /*
             * We can't use pre-compiled Mu templates on the server :(
             */

            // If we don't have a compliled template, make one.
            Y.log('Rendering template "' + tmpl + '"', 'mojito', NAME);
            mu.compileAndRender(tmpl, data).on('data', function (c) {
                adapter.flush(c, meta);
            }).on('end', function () {
                if (!more) {
                    Y.log('render complete for view "' +
                        me.viewId + '"',
                        'mojito', 'qeperf');
                    adapter.done('', meta);
                }
            });
        },


        compiler: function(tmpl) {
            return JSON.stringify(fs.readFileSync(tmpl, 'utf8'));
        }
    };

    Y.namespace('mojito.addons.viewEngines').mu = MuAdapter;

}, '0.1.0', {requires: []});
