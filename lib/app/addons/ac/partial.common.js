/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/


/**
 * @module ActionContextAddon
 */
YUI.add('mojito-partial-addon', function(Y, NAME) {

    function InvokeAdapter(callback) {
        this.data = '';
        this.callback = function () {
            if (callback) {
                callback.apply(this, arguments);
            }
            callback = function () {
                Y.log('ac.done/flush/error called multiple times in partial invoke',
                        'warn', NAME);
            };
        };
    }

    InvokeAdapter.prototype = {

        done: function (data, meta) {
            this.flush(data, meta);
            this.callback(null, this.data, this.meta);
        },

        flush: function (data, meta) {
            this.data += data;
            // this trick is to call metaMerge only after the first pass
            this.meta = (this.meta ? Y.mojito.util.metaMerge(this.meta, meta) : meta);
        },

        error: function (err) {
            Y.log("Error executing partial invoke", 'error',
                    NAME);
            if (err.message) {
                Y.log(err.message, 'error', NAME);
            } else {
                Y.log(err, 'error', NAME);
            }
            if (err.stack) {
                Y.log(err.stack, 'error', NAME);
            }

            this.callback(err);
        }

    };

    /**
    * <strong>Access point:</strong> <em>ac.partial.*</em>
    * Provides methods for working with "actions" and "views" on the current
    * Mojits.
    * @class Partial.common
    */
    function Addon(command, adapter, ac) {
        this._command = command;
        this._ac = ac;
        this._adapter = adapter;
        this._page = adapter.page;
    }

    Addon.prototype = {

        namespace: 'partial',

        /**
         * This method renders the "data" provided into the "view" specified.
         * The "view" must be the name of one of the files in the current
         * Mojits "views" folder. Returns via the callback.
         * @method render
         * @param {object} data The object to be rendered.
         * @param {string} view The view name to be used for rendering.
         * @param {function} cb callback signature is function(error, result).
         */
        render: function(data, view, cb) {
            var renderer,
                mojitView,
                instance = this._command.instance,
                meta = {view: {}};

            if (!instance.views[view]) {
                cb('View "' + view + '" not found');
                return;
            }

            mojitView = instance.views[view];
            data = data || {}; // default null data to empty view template
            renderer = new Y.mojito.ViewRenderer(mojitView.engine,
                this._page.staticAppConfig.viewEngine);

            Y.log('Rendering "' + view + '" view for "' + (instance.id || '@' +
                instance.type) + '"', 'debug', NAME);

            renderer.render(data, instance.type, mojitView, {
                buffer: '',

                flush: function(data) {
                    this.buffer += data;
                },

                done: function(data) {
                    this.buffer += data;
                    cb(null, this.buffer);
                }
            }, meta);
        },

        /**
         * This method calls the current mojit's controller with the "action"
         * given and returns its output via the callback.
         *
         * @method invoke
         * @param {string} action name of the action to invoke.
         * @param {object} options a literal object with the configuration
         *
         *      @param {boolean} propagateFailure whether or not errors
         *      invoke should affect the original action by calling adapter.error
         *      @param {object} params optional object to be passed as params in the
         *      invoke command. It defaults to the current action params.
         *
         *          @param {object} route Map of key/value pairs.
         *          @param {object} url Map of key/value pairs.
         *          @param {object} body Map of key/value pairs.
         *          @param {object} file Map of key/value pairs.
         *
         * @param {function} cb callback function to be called on completion.
         */
        invoke: function(action, options, cb) {
            var my = this,
                newCommand,
                newAdapter;

            // If there are no options use it as the callback
            if ('function' === typeof options) {
                cb = options;
                options = {};
            }

            // the new command baesd on the original command
            newCommand = {
                instance: {
                    base: this._command.instance.base,
                    type: this._command.instance.type
                },
                action: action,
                context: this._ac.context,
                params: options.params || this._ac.params.getAll()
            };

            // the new adapter that inherit from the original adapter
            newAdapter = new InvokeAdapter(function (err, data, meta) {

                // HookSystem::StartBlock
                Y.mojito.hooks.hook('adapterInvoke', my._adapter.hook, 'end', this);
                // HookSystem::EndBlock

                if (err && options.propagateFailure) {
                    my._adapter.error(err);
                    return;
                }

                if (meta) {
                    // Remove whatever "content-type" was set
                    meta.http.headers['content-type'] = undefined;
                    // Remove whatever "view" was set
                    meta.view = undefined;
                }

                cb(err, data, meta);

            });

            // HookSystem::StartBlock
            Y.mojito.hooks.hook('adapterInvoke', this._adapter.hook, 'start', newAdapter);
            // HookSystem::EndBlock

            newAdapter = Y.mix(newAdapter, this._adapter);

            this._ac._dispatch(newCommand, newAdapter);
        }
    };

    Y.namespace('mojito.addons.ac').partial = Addon;

}, '0.1.0', {requires: [
    'mojito-util',
    'mojito-hooks',
    'mojito-params-addon',
    'mojito-view-renderer'
]});
