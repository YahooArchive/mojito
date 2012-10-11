/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/


/**
 * This object is responsible for running mojits.
 * @class MojitoDispatcher
 * @constructor
 * @param {ServerStore} resourceStore the store to use.
 * @private
 */
YUI.add('mojito-dispatcher', function(Y, NAME) {

    Y.namespace('mojito').Dispatcher = {

        /**
         * Initializes the dispatcher instance.
         * @param {Y.mojito.ResourceStore} resourceStore
         * @return {Y.mojito.Dispatcher}
         */
        init: function(resourceStore) {

            if (!resourceStore) {
                throw new Error(
                    'Mojito cannot instantiate without a resource store.'
                );
            }

            // Cache parameters as instance variables for the dispatch() call to
            // reference.
            this.store = resourceStore;

            this.CACHE = {};

            this.debugID = 0;

            Y.log('Dispatcher created', 'debug', NAME);

            return this;
        },

        /* See docs for the dispatch function in action-context.common.js */
        dispatch: function(command, adapter) {

            var my = this,
                store = this.store,
                perf = Y.mojito.perf.timeline('mojito',
                    'dispatch:expandInstance',
                    'gather details about mojit', command);

            if (adapter.debug) {
                command.instance.debugID = this.debugID;
                this.debugID = this.debugID + 1;
                adapter.debug.profOpen("dispatch", command.instance.debugID, (command.instance.id || '@' + command.instance.type) + ':' + (command.action || (command.instance.action || 'index')));
            }

            store.validateContext(command.context);

            store.expandInstance(command.instance, command.context,
                function(err, instance) {
                    var controller,
                        ac;

                    if (err) {
                        throw new Error(err);
                    }

                    perf.done(); // closing 'dispatch:expandInstance' timeline

                    if (adapter.debug) {
                        adapter.debug.profClose("dispatch", command.instance.debugID,  'startup done');
                    }

                    // We replace the given instance with the expanded instance.
                    command.instance = instance;

                    Y.mojito.perf.mark('mojito', 'core_dispatch_start',
                        'dispatching an instance', command);

                    // Ensure there's a getController method we can call
                    // that will always return a viable controller. By
                    // wrapping in a function we allow tests and other code
                    // to provide mocks etc.
                    instance.getController = instance.getController ||
                        function() {
                            return Y.mojito.controllers[
                                this['controller-module']
                            ];
                        };
                    controller = instance.getController();

                    perf = Y.mojito.perf.timeline('mojito', 'ac:ctor',
                        'create ControllerContext', command);

                    // Note that creation of an ActionContext current causes
                    // immediate invocation of the dispatch() call.
                    ac = new Y.mojito.ActionContext({
                        command: command,
                        controller: controller,
                        dispatcher: my,         // NOTE passing dispatcher.
                        adapter: adapter,
                        store: store
                    });

                    perf.done(); // closing the 'ac:ctor' timeline

                    if (adapter.debug) {
                        adapter.debug.profClose("dispatch", command.instance.debugID,  'startup instance done');
                    }

                });

        }

    };

}, '0.1.0', {requires: [
    'mojito-action-context',
    'mojito-util',
    'mojito-resource-store-adapter'
]});
