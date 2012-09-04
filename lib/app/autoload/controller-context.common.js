/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/
/*global YUI*/


YUI.add('mojito-controller-context', function(Y, NAME) {

    function ControllerContext(opts) {
        this.instance = opts.instance;
        this.dispatch = opts.dispatch;
        this.store = opts.store;
        this.Y = opts.Y;
        this.shareYUIInstance = Y.mojito.util.shouldShareYUIInstance(opts.appShareYUIInstance, this.instance);
        this.init();
    }


    ControllerContext.prototype = {

        init: function() {
            var error,
                // Not really an instance...more like constructor options...see
                // controller.init() call below.
                instance = this.instance,
                controller,
                models,
                actions = this.Y.mojito.actions || [],
                ControllerClass,
                shareYUIInstance = this.shareYUIInstance,

                // do a shallow merge of app-level and mojit-level configs
                // mojit config properties take precedence
                configApp = this.store.getAppConfig({}).config,
                configCombo = Y.merge(configApp, instance.config),

                controllerName = instance['controller-module'],
                // Y.mojito.controller for legacy, multi-instance.
                // Y.mojito.controllers for shared instance
                originalController = this.Y.mojito.controller ||
                                     this.Y.mojito.controllers[controllerName];

            // If sharing YUI and controller clobbers, log an error.
            if (shareYUIInstance && this.Y.mojito.controller) {
                this.Y.log(controllerName + ' mojit' +
                    ' clobbers Y.mojito.controller namespace. Please use' +
                    ' `Y.namespace(\'mojito.controllers\')[NAME]` when ' +
                    ' declaring controllers.', 'error', NAME);
            }

            // expanding models so we can pass the references into the
            // initialization process.
            models = this._expandModels(configCombo);

            // using configCombo->models as a mapping to pass some models
            // instances as attributes through the configuration into the
            // controller. This will facilitate the access to global models.
            Y.Object.each((configCombo.models || {}), function(modelName, attrName) {
                configCombo[attrName] = models[modelName];
            });

            if (Y.Lang.isFunction(originalController)) {

                // Using the original function as a synthetic controller class
                // to mix in few other stuff
                if (originalController._yuibuild) {

                    // TODO: what if the class extends Y.Base but was not built
                    //       using Y.Base.create?

                    this.Y.log('Mix in actions and Y.EventTarget into a controller' +
                        ' created with Y.Base.create', 'debug', NAME);

                    // the original controller was build with Y.Base.create
                    // we just need to mix few more things, including actions
                    // in which case they need to be extensions.
                    ControllerClass = Y.Base.create(controllerName, originalController,
                                        Y.Object.values(actions), {}, {});

                    // Make controller an EventTarget, we want to keep this very
                    // light-weight and obscure for now.
                    // TODO: how can we know if EventTarget is really needed
                    //       it might be part of the original class already.
                    Y.mix(ControllerClass, Y.EventTarget, false, null, 1);

                } else {

                    // the original controller seems to be a regular class
                    // let's just augment it to ger EventTarget support

                    this.Y.log('Mix in actions and Y.EventTarget into a class' +
                        ' controller', 'debug', NAME);

                    // TODO: how can I preserve the original class definition?
                    ControllerClass = originalController;

                    // TODO: should we use augment?

                    // Make controller an EventTarget, we want to keep this very
                    // light-weight and obscure for now.
                    Y.augment(ControllerClass, Y.EventTarget, true, null, {
                        emitFacade: true
                    });

                    // mix in any (new) actions (the actions namespace here would be
                    // populated by the resource store...but currently unused? Could
                    // this be replaced by light inheritance to the controllers here).
                    // TODO: should we keep supporting this? or should we just mix
                    //       common + server or common + client controllers now that we
                    //       have support for events?
                    Y.Object.each(actions, function(action, actionName) {
                        this.Y.log('mixing action \'' + actionName +
                            '\' into controller...', 'debug', NAME);
                        ControllerClass[actionName] = action;
                    });
                }

            } else if (Y.Lang.isObject(originalController)) {

                // Creating a synthetic controller class to mix in few other stuff
                ControllerClass = function() {};
                ControllerClass.prototype = originalController;

                // TODO: should we use augment?

                this.Y.log('Mix in actions and Y.EventTarget into an object' +
                        ' controller', 'debug', NAME);

                // Make controller an EventTarget, we want to keep this very
                // light-weight and obscure for now.
                Y.augment(ControllerClass, Y.EventTarget, true, null, {
                    emitFacade: true
                });

                // mix in any (new) actions (the actions namespace here would be
                // populated by the resource store...but currently unused? Could
                // this be replaced by light inheritance to the controllers here).
                // TODO: should we keep supporting this? or should we just mix
                //       common + server or common + client controllers now that we
                //       have support for events?
                Y.Object.each(this.Y.mojito.actions, function(action, actionName) {
                    this.Y.log('mixing action \'' + actionName +
                        '\' into controller...', 'debug', NAME);
                    ControllerClass[actionName] = action;
                });

            } else {
                error = new Error('Mojit controller prototype is not an' +
                    ' object or a function! (mojit id: \'' + instance.id + '\')');

                error.code = 500;
                throw error;
            }

            // we make a controller instance by using the controller class, this
            // gives us proper function scope within the controller actions and
            // add EventTarget capabilities into the controller instance.
            // TODO: expand configCombo->models to plug app level models
            controller = this.controller = new ControllerClass(configCombo);

            // explicitly checking the original controller, otherwise
            // we should not try to deal with "init" since the Y.BaseCore
            // life-cycle will handle that.
            if (Y.Lang.isFunction(originalController.init)) {
                // Use the instance data which isn't really an instance to
                // provide construction parameters for the controller init().
                controller.init(configCombo);
            }

            // stash the models this controller has available to be later
            // attached to the ActionContext
            // TODO: this is for BC for those folks who are using
            //       ac.models.foo to get a model reference
            this.models = models;
        },


        invoke: function(command, adapter) {

            this.Y.log('controller context invoke() for ' +
                this.instance.instanceId, 'mojito', 'qeperf');

            var instance = this.instance,
                config = command.instance.config,
                // this is the action that will be executed
                action = command.action,
                ac;

            // replace the non-expanded command instance with the proper
            // instance, that was already expanded when the controller context
            // was created

            // TODO: This may not be necessary...we did this in dispatch().
            command.instance = instance;

            // however! we want to use the most recent config, not the cached
            // config, because that can change between action executions!
            command.instance.config = config;

            // if there is no action, make 'index' the default
            // TODO: This may not be necessary...we did this in dispatch().
            if (!command.action) {
                // use instance config for default action or 'index'
                command.action = instance.action || 'index';
            }

            try {
                // Note: ac var is here to appease jslint.
                ac = new this.Y.mojito.ActionContext({
                    command: command,
                    controller: this.controller,
                    models: this.models,
                    dispatch: this.dispatch,
                    adapter: adapter,
                    store: this.store
                });

                // TODO: uncomment once above issue is repaired.
                // ac.invoke(command, adapter);  // do it this way ;)
            } catch (err) {
                if (adapter.error) {
                    adapter.error(err);
                } else {
                    this.Y.log('WARNING!! Uncaught error from dispatch on' +
                        ' instance \'' + (instance.id || '@' + instance.type) +
                        '\'', 'error', NAME);
                    this.Y.log(err.message, 'error', NAME);
                    this.Y.log(err.stack, 'error', NAME);
                }
                // TODO: should we be rethrowing the error here? We log but we
                // don't ensure callers know...but then again dispatch() may
                // need this level of isolation.
            }

            this.Y.mojito.perf.mark('mojito', 'core_dispatch_end[' +
                (instance.id || '@' + instance.type) + ':' + action + ']');
        },


        _expandModels: function (mojitConfig) {
            var error,
                instance = this.instance,
                models = {},
                shareYUIInstance = this.shareYUIInstance,

                // global models that inherit from Y.Model can
                // be defined on application.json
                globalModels = this.store.getAppConfig({}).models || {};


            // TODO: for now, we have a hack to instantiate global models
            //       per mojit instance, but in the future, these models
            //       should be sandboxed as part of the "frame" mojit, and
            //       a reference should be hand over to the mojit that is
            //       trying to use it, so, part of the complexity of this
            //       method will be removed.

            // BC for mojito models, so devs can get a reference to it
            // from ac.models.<modelName>
            Y.Object.each(this.Y.mojito.models, function(originalModel, modelName) {
                var modelInstance,
                    ModelClass,
                    // in case a global model definition is passing some custom
                    // configurations, in which case they have precedence. Also,
                    // models might change it, better to preserve the mojitConfig.
                    modelConfig = Y.merge(mojitConfig, (globalModels[modelName] || {}));

                // TODO: why? why do we need to worry about instance.models
                if (!shareYUIInstance || (instance.models &&
                        instance.models[modelName])) {


                    if (Y.Lang.isFunction(originalModel)) {

                        // TODO: should we do something with the function? or should
                        //       we just assume it extends Y.Model?
                        ModelClass = originalModel;

                    } else if (Y.Lang.isObject(originalModel)) {

                        // Creating a synthetic model class
                        ModelClass = function() {};
                        ModelClass.prototype = originalModel;

                    }


                    // we make a controller instance by using the controller class, this
                    // gives us proper function scope within the controller actions and
                    // add EventTarget capabilities into the controller instance.
                    // TODO: expand configCombo->models to plug app level models
                    modelInstance = new ModelClass(modelConfig);


                    // explicitly checking the original model, otherwise
                    // we should not try to deal with "init" since the Y.BaseCore
                    // life-cycle will handle that.
                    if (Y.Lang.isFunction(originalModel.init)) {
                        // NOTE that we use the same config here that we use to
                        // config the controller
                        modelInstance.init(modelConfig);
                    }
                    models[modelName] = modelInstance;
                }

            }, this);

            return models;
        }

    };

    Y.namespace('mojito').ControllerContext = ControllerContext;

}, '0.1.0', {requires: [
    'mojito-action-context',
    'mojito-util',
    'event-custom',
    'base-build'
]});
