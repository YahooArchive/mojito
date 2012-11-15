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

            // For performance reasons we don't want to support
            // this ondemand "use" in the server side since
            // all the requirements are already in place.
            if (command.context.runtime === 'server') {
                adapter.error(new Error('Invalid controller name [' +
                    instance.controller + '] for mojit [' +
                    instance.type + '].'));
                return;
            }

            // attach controller to Y ondemand
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
                        instance.controller + '] for mojit [' +
                        instance.type + '].'));
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
                controller = Y.mojito.controllers[command.instance.controller],
                perf = Y.mojito.perf.timeline('mojito', 'ac:ctor',
                    'create ControllerContext', command);

            // Note that creation of an ActionContext current causes
            // immediate invocation of the dispatch() call.
            try {
                ac = new Y.mojito.ActionContext({
                    command: command,
                    controller: Y.mojito.util.heir(controller),
                    dispatcher: this,         // NOTE passing dispatcher.
                    adapter: adapter,
                    store: this.store
                });
            } catch (e) {
                Y.log('Error from dispatch on instance \'' +
                    (command.instance.id || '@' + command.instance.type) +
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

                adapter.error(new Error('RPC tunnel is not available in the ' +
                    command.context.runtime + ' runtime.'));

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
                // forcing to dispatch command through RPC tunnel
                this.rpc(command, adapter);
                return;
            }

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

                    // We replace the given instance with the expanded instance.
                    command.instance = instance;

                    // if this controller does not exist yet, we should try
                    // to require it along with it depedencies.
                    if (!Y.mojito.controllers[instance.controller]) {
                        // requiring the controller and its dependencies
                        // before dispatching AC
                        my._useController(command, adapter);
                    } else {
                        // dispatching AC
                        my._createActionContext(command, adapter);
                    }

                });
        }

    };

}, '0.1.0', {requires: [
    'mojito-action-context',
    'mojito-util'
]});
