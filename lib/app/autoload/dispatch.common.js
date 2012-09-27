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
         * @param {Array.<string>} coreMojitoYuiModules An array of module names
         *     which should be added to all addons.
         * @param {YUI.Logger} globalLogger The logger shared by all of Mojito.
         *     Note that the dispatcher must receive the global logger up front,
         *     because it is loaded within a Y instance that has the original
         *     Y.log function, so in order to have consistent logging, the
         *     Mojito logger is passed in and we use it.
         * @param {YUI.Loader} globalLoader The loader shared by all of Mojito.
         * @return {Y.mojito.Dispatcher}
         */
        init: function(resourceStore, coreMojitoYuiModules, globalLogger,
                globalLoader) {

            if (!resourceStore) {
                throw new Error(
                    'Mojito cannot instantiate without a resource store.'
                );
            }

            var appConfigStatic,
                appShareYUIInstance,
                calcs;

            // Cache parameters as instance variables for the dispatch() call to
            // reference.
            this.store = resourceStore;
            this.coreYuiModules = coreMojitoYuiModules ?
                    coreMojitoYuiModules.slice(0) :
                    [];
            this.loader = globalLoader;
            this.logger = globalLogger;

            this.CACHE = { YUI: {} };

            // Determine if we're set up to share YUI instances.
            appConfigStatic = this.store.getAppConfig({});
            appShareYUIInstance = (true === appConfigStatic.shareYUIInstance);

            calcs = appConfigStatic.yui.dependencyCalculations;

            // Determine the model of dependency computation we should use.
            this.usePrecomputed = appConfigStatic.yui && (-1 !==
                calcs.indexOf('precomputed'));

            if (!this.usePrecomputed) {
                this.useOnDemand = true;
            } else {
                this.useOnDemand = appConfigStatic.yui && (-1 !==
                    calcs.indexOf('ondemand'));
            }

            if (this.useOnDemand) {
                this.coreYuiModules.push('loader');
            }

            this.logger.log('Dispatcher created', 'debug', NAME);

            return this;
        },

        /* See docs for the dispatch function in action-context.common.js */
        dispatch: function(command, adapter) {

            var my = this,
                perf = Y.mojito.perf.timeline('mojito',
                    'dispatch:expandInstance',
                    'gather details about mojit', command);

            this.store.validateContext(command.context);

            this.store.expandInstance(command.instance, command.context,
                function(err, instance) {

                    var yuiObj,
                        yuiConfig,
                        groups = {},
                        yuiModules = [];

                    perf.done(); // closing 'dispatch:expandInstance' timeline

                    yuiConfig = {
                        bootstrap: true,
                        lang: command.context.langs,
                        core: my.coreYuiModules,        // NOTE outer reference.
                        modules: instance.yui.config.modules
                    };

                    command.yuiCacheKey =
                        Y.mojito.util.createCacheKey(command.context);

                    // We replace the given instance with the expanded instance.
                    command.instance = instance;

                    // One YUI instance per context.
                    yuiObj = my.CACHE.YUI[command.yuiCacheKey];
                    if (undefined === yuiObj) {
                        yuiObj = YUI();
                        my.CACHE.YUI[command.yuiCacheKey] = yuiObj;
                    }
                    yuiObj.applyConfig(yuiConfig);

                    // Copy the module list or it pollutes the client runtime.
                    yuiModules = Y.mojito.util.copy(instance.yui.sorted);

                    perf = Y.mojito.perf.timeline('mojito', 'dispatch:Y.use',
                        'time to load and attach modules', command);

                    // Create the function that will be called in YUI().use()
                    yuiModules.push(function (MOJIT_Y) {

                        var controller,
                            ac;

                        perf.done(); // closing the 'dispatch:Y.use' timeline

                        // Ensure there's a getController method we can call
                        // that will always return a viable controller. By
                        // wrapping in a function we allow tests and other code
                        // to provide mocks etc.
                        instance.getController = instance.getController ||
                            function() {
                                return MOJIT_Y.mojito.controllers[
                                    this['controller-module']
                                ];
                            };
                        controller = instance.getController();

                        perf = Y.mojito.perf.timeline('mojito', 'ac:ctor',
                            'create ControllerContext', command);

                        // Note that creation of an ActionContext current causes
                        // immediate invocation of the dispatch() call.
                        ac = new MOJIT_Y.mojito.ActionContext({
                            command: command,
                            controller: controller,
                            dispatcher: my,         // NOTE passing dispatcher.
                            adapter: adapter,
                            store: my.store
                        });

                        perf.done(); // closing the 'ac:ctor' timeline
                    });

                    Y.mojito.perf.mark('mojito', 'core_dispatch_start',
                        'dispatching an instance', command);

                    // Trigger loading of the module list using the YUI object
                    // specific to our context.
                    yuiObj.use.apply(yuiObj, yuiModules);
                });
        },

        uncacheContext: function(instanceId) {
            var msg = 'rm controller context cache for ' + instanceId;

            if (this.CACHE.controllerContexts &&
                    this.CACHE.controllerContexts[instanceId]) {
                delete this.CACHE.controllerContexts[instanceId];
            } else {
                msg += ' failed';
            }
            this.logger.log(msg, 'mojito', NAME);
        },

        getCache: function() {
            return this.CACHE;
        }

    };

}, '0.1.0', {requires: [
    'mojito-action-context',
    'mojito-util',
    'mojito-resource-store-adapter'
]});
