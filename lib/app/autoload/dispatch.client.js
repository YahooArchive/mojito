/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, nomen:true*/
/*global YUI*/


/**
 * This object is responsible for running mojits.
 * @class MojitoDispatcher
 * @static
 * @public
 */
YUI.add('mojito-dispatcher', function (Y, NAME) {

    'use strict';

    // on the server side, controllers are stateless, but on
    // the client, things are different, we can cache them by
    // instanceId to re-use them when possible.
    var _cacheInstances = {},
        _cacheControllers = {};

    Y.namespace('mojito').Dispatcher = {

        /**
         * Initializes the dispatcher instance.
         * @method init
         * @public
         * @param {Y.mojito.ResourceStore} resourceStore the store to use.
         * @param {Y.mojito.TunnelClient} rpcTunnel optional tunnel client for RPC calls
         * @return {Y.mojito.Dispatcher}
         */
        init: function (resourceStore, rpcTunnel) {

            if (!resourceStore) {
                throw new Error(
                    'Mojito cannot instantiate without a resource store.'
                );
            }

            // Cache parameters as instance variables for the dispatch() call to
            // reference.
            this.store = resourceStore;
            this.tunnel = rpcTunnel;

            Y.log('Dispatcher created', 'debug', NAME);

            return this;
        },

        /**
         * Attaches requirements to dispatch the current mojit when
         * position. This is usually needed when running in the
         * client side and loading mojits on demand.
         * @method _useController
         * @protected
         * @param {object} command the command to dispatch
         * @param {OutputAdapter} adapter the output adapter
         */
        _useController: function (command, adapter) {
            var my = this,
                instance = command.instance,
                modules = [];

            // TODO: part of the optimization here can be to
            // avoid calling use when the controller already exists.

            // use controller's yui module name to attach
            // the controller to Y ondemand
            modules.push(instance.controller);

            // TODO: this is a hack to attach the correct engine, the problem
            // here is that we are assuming too many things, action might not
            // be defined, or engine might not even be needed.
            modules.push('mojito-' + ((instance.views && instance.views[command.action] &&
                instance.views[command.action].engine) || 'hb'));

            // use statement callback
            modules.push(function () {
                if (Y.mojito.controllers[command.instance.controller]) {
                    // continue with the workflow
                    my._createActionContext(command, adapter);
                } else {
                    // the controller was not found, we should halt
                    adapter.error(new Error('Invalid controller name [' +
                        command.instance.controller + '] for mojit [' +
                        command.instance.type + '].'));
                }
            });

            // TODO: view engine should not be attached here.
            Y.use.apply(Y, modules);
        },

        /**
         * Create AC object for a particular controller.
         * @method _createActionContext
         * @protected
         * @param {object} command the command to dispatch
         * @param {OutputAdapter} adapter the output adapter
         */
        _createActionContext: function (command, adapter) {
            var ac,
                perf = Y.mojito.perf.timeline('mojito', 'ac:ctor',
                    'create ControllerContext', command);

            // the controller is not stateless on the client, we
            // store it for re-use.
            // TODO: we need to find a way to clean this for apps
            // that attent to create and destroy mojits from the page
            // but maybe we can just wait for the YAF refactor.
            if (!_cacheControllers[command.instanceId]) {
                _cacheControllers[command.instanceId] =
                    Y.mojito.util.heir(Y.mojito.controllers[command.instance.controller]);
            }

            // Note that creation of an ActionContext current causes
            // immediate invocation of the dispatch() call.
            try {
                ac = new Y.mojito.ActionContext({
                    command: command,
                    controller: _cacheControllers[command.instanceId],
                    dispatcher: this,         // NOTE passing dispatcher.
                    adapter: adapter,
                    store: this.store
                });
            } catch (e) {
                Y.log('Error from dispatch on instance \'' +
                    (command.instance.base || '@' + command.instance.type) +
                    '\':', 'error', NAME);
                Y.log(e.message, 'error', NAME);
                Y.log(e.stack, 'error', NAME);
                adapter.error(e);
            }
            perf.done(); // closing the 'ac:ctor' timeline
        },

        /**
         * Executes a command in a remote runtime if possible.
         * @method rpc
         * @public
         * @param {object} command the command to dispatch
         * @param {OutputAdapter} adapter the output adapter
         */
        rpc: function (command, adapter) {
            if (this.tunnel) {

                Y.log('Dispatching instance "' + (command.instance.base || '@' +
                    command.instance.type) + '" through RPC tunnel.', 'info', NAME);
                this.tunnel.rpc(command, adapter);

            } else {

                adapter.error(new Error('RPC tunnel is not available in the [' +
                    command.context.runtime + '] runtime.'));

            }
        },

        /**
         * Dispatch a command in the current runtime, or fallback
         * to a remote runtime when posible.
         * @method dispatch
         * @public
         * @param {object} command the command to dispatch
         * @param {OutputAdapter} adapter the output adapter
         */
        dispatch: function (command, adapter) {

            var my = this,
                store = this.store,
                perf = Y.mojito.perf.timeline('mojito',
                    'dispatch:expandInstance',
                    'gather details about mojit', command);

            store.validateContext(command.context);

            if (command.rpc) {
                Y.log('Command with rpc flag, dispatching through RPC tunnel',
                    'info', NAME);
                this.rpc(command, adapter);
                return;
            }

            if (command.instanceId && _cacheInstances[command.instanceId]) {
                Y.log('Re-using instance with instanceId=' +
                    command.instanceId, 'info', NAME);
                command.instance = _cacheInstances[command.instanceId];
                this._useController(command, adapter);
                return;
            }

            // if no rpc flag and no instance cached, we try to
            // expand the instance before creating the ActionContext.
            store.expandInstance(command.instance, command.context,
                function (err, instance) {

                    perf.done(); // closing 'dispatch:expandInstance' timeline

                    if (err || !instance || !instance.controller) {

                        // error expanding the instance, potentially
                        // a remote instance that can't be expanded in the
                        // current runtime and should be dispatched through RPC
                        Y.log('Cannot expand instance "' + (command.instance.base || '@' +
                            command.instance.type) + '". Trying with the tunnel in case ' +
                            'it is a remote mojit.', 'info', NAME);

                        my.rpc(command, adapter);
                        return;

                    }

                    // the instance is not stateless on the client, we
                    // store it for re-use.
                    // TODO: we need to find a way to clean this for apps
                    // that attent to create and destroy mojits from the page
                    // but maybe we can just wait for the YAF refactor.
                    _cacheInstances[command.instanceId] = instance;

                    // We replace the given instance with the expanded instance.
                    command.instance = instance;

                    // requiring the controller and its dependencies
                    // before dispatching AC
                    my._useController(command, adapter);

                });
        }

    };

}, '0.1.0', {requires: [
    'mojito-action-context',
    'mojito-util'
]});
