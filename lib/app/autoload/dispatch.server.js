/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
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
         * Create AC object for a particular controller.
         * @method _createActionContext
         * @protected
         * @param {object} command the command to dispatch
         * @param {OutputAdapter} adapter the output adapter
         */
        _createActionContext: function (command, adapter) {
            var ac,
                controller = Y.mojito.controllers[command.instance.controller];

            // HookSystem::StartBlock
            Y.mojito.hooks.hook('dispatchCreateAction', adapter.hook, 'start', command);
            // HookSystem::EndBlock

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
            // HookSystem::StartBlock
            Y.mojito.hooks.hook('dispatchCreateAction', adapter.hook, 'end', command);
            // HookSystem::EndBlock
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
                store = this.store;

            // HookSystem::StartBlock
            Y.mojito.hooks.hook('dispatch', adapter.hook, 'start', command);
            // HookSystem::EndBlock
            store.validateContext(command.context);

            if (command.rpc) {
                // forcing to dispatch command through RPC tunnel
                this.rpc(command, adapter);
                return;
            }

            store.expandInstance(command.instance, command.context,
                function (err, instance) {

                    // HookSystem::StartBlock
                    Y.mojito.hooks.hook('dispatch', adapter.hook, 'end', command);
                    // HookSystem::EndBlock

                    if (err || !instance || !instance.controller) {

                        adapter.error(new Error('Cannot expand instance [' + (command.instance.base || '@' +
                            command.instance.type) + '], or instance.controller is undefined'));
                        return;

                    }

                    // We replace the given instance with the expanded instance.
                    command.instance = instance;

                    if (!Y.mojito.controllers[instance.controller]) {
                        // the controller was not found, we should halt
                        adapter.error(new Error('Invalid controller name [' +
                            command.instance.controller + '] for mojit [' +
                            command.instance.type + '].'));
                    } else {
                        // dispatching AC
                        my._createActionContext(command, adapter);
                    }

                });
        }

    };

}, '0.1.0', {requires: [
    'mojito-action-context',
    'mojito-util',
    'mojito-hooks'
]});
