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
     * Mustache Adapter for the server runtime.
     * @class MuAdapterServer
     * @constructor
     * @param {object} options View engine configuration.
     * @private
     */
    function MuAdapter(options) {
        this.options = options || {};
    }


    MuAdapter.prototype = {

        /**
         * Renders the mustache template using the data provided.
         * @method render
         * @param {object} data The data to render.
         * @param {object} instance The expanded mojit instance.
         * @param {object} template The view object from RS to render with format:
         * {'content-path': 'path to view', content: 'cached string'}.
         * @param {object} adapter The output adapter to use.
         * @param {object} meta Optional metadata.
         * @param {boolean} more Whether there will be more content later.
         */
        render: function(data, instance, template, adapter, meta, more) {
            var cacheTemplates = (this.options.cacheTemplates === false ? false : true),
                me = this,
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
                },
                tmpl;

            // support for legacy url instead of a view object
            if (Y.Lang.isString(template)) {
                Y.log('[view] argument in [render] method should be an object', 'warn', NAME);
                template = {
                    'content-path': template
                };
            }
            tmpl = template['content-path'];
            /*
             * We can't use pre-compiled Mu templates on the server :(
             */

            // If we don't have a compliled template, make one.
            Y.log('Rendering template "' + tmpl + '"', 'mojito', NAME);
            mu.render(tmpl, data, {cached: cacheTemplates},
                handleRender);
        },


        compiler: function(tmpl, callback) {
            fs.readFile(tmpl, 'utf8', function (err, data) {
                callback(err, JSON.stringify(data));
            });
        }
    };

    Y.namespace('mojito.addons.viewEngines').mu = MuAdapter;

}, '0.1.0', {requires: []});
