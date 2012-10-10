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

            store.validateContext(command.context);

            store.expandInstance(command.instance, command.context,
                function(err, instance) {
                    var controller,
                        ac;

                    if (err) {
                        throw new Error(err);
                    }

                    perf.done(); // closing 'dispatch:expandInstance' timeline

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
                    try {
                        ac = new Y.mojito.ActionContext({
                            command: command,
                            controller: controller,
                            dispatcher: my,         // NOTE passing dispatcher.
                            adapter: adapter,
                            store: store
                        });
                    } catch (e) {
                        Y.log('Error from dispatch on instance \'' +
                            (instance.id || '@' + instance.type) +
                            '\':', 'error', NAME);
                        Y.log(e.message, 'error', NAME);
                        Y.log(e.stack, 'error', NAME);
                        if (adapter.error) {
                            adapter.error(e);
                        } else {
                            // TODO: should we be rethrowing the error here? We log but we
                            // don't ensure callers know...but then again dispatch() may
                            // need this level of isolation.
                            adapter.done('ERROR');
                        }
                    }

                    perf.done(); // closing the 'ac:ctor' timeline

                });

        }

    };

}, '0.1.0', {requires: [
    'mojito-action-context',
    'mojito-util',
    'mojito-resource-store-adapter'
]});
