/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true, stupid:true*/
/*global YUI*/


/**
 * @Module ViewEngines
 */
YUI.add('mojito-mu', function(Y, NAME) {

    var mu = YUI.require(__dirname + '/../../libs/Mulib/Mu'),
        fs = require('fs');


    /**
     * Class text.
     * @class MuAdapterServer
     * @private
     */
    function MuAdapter(viewId, options) {
        this.viewId = viewId;
        this.options = options || {};
    }


    MuAdapter.prototype = {

        /**
         * Renders the mustache template using the data provided.
         * @method render
         * @param {object} data The data to render.
         * @param {string} mojitType The name of the mojit type.
         * @param {string} tmpl The name of the template to render.
         * @param {object} adapter The output adapter to use.
         * @param {object} meta Optional metadata.
         * @param {boolean} more Whether there will be more content later.
         */
        render: function(data, mojitType, tmpl, adapter, meta, more) {
            var me = this,
                buffer = '',
                bufferOutput = (this.options.mu && this.options.mu.bufferOutput) || false,
                handleRender = function(err, output) {
                    if (err) {
                        throw err;
                    }

                    output.addListener('data', function(c) {
                        if (!bufferOutput) {
                            adapter.flush(c, meta);
                        } else {
                            buffer += c;
                        }
                    });

                    output.addListener('end', function() {
                        if (!more) {
                            Y.log('render complete for view "' +
                                me.viewId + '"',
                                'mojito', 'qeperf');
                            if (!bufferOutput) {
                                buffer = '';
                            }
                            adapter.done(buffer, meta);
                        } else {
                            if (bufferOutput) {
                                adapter.flush(buffer, meta);
                            }
                        }
                    });
                };

            /*
             * We can't use pre-compiled Mu templates on the server :(
             */

            // If we don't have a compliled template, make one.
            Y.log('Rendering template "' + tmpl + '"', 'mojito', NAME);
            mu.render(tmpl, data, {cached: meta.view.cacheTemplates},
                handleRender);
        },


        compiler: function(tmpl, callback) {
            fs.readFile(tmpl, 'utf8', function (err, data) {
                callback(err, Y.JSON.stringify(data));
            });
        }
    };

    Y.namespace('mojito.addons.viewEngines').mu = MuAdapter;

}, '0.1.0', {requires: ['json-stringify']});
