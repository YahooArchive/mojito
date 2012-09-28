/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, nomen:true*/
/*global YUI*/


/**
 * The Action Context is a key part of the Mojito framework. The <em>ac</em>,
 * for short, gives you access to the frameworks features from within a
 * controller function. The ac is an abstraction that allows you to execute
 * mojit actions within either a server or client context.
 * @module ActionContext
 */
YUI.add('mojito-action-context', function(Y, NAME) {

    'use strict';

    // -------------------------------------------------------------------------
    // Comments below are so generated comments for flush, done, etc. are found
    // on ActionContext even though they're not really done here.
    // -------------------------------------------------------------------------

    /**
     * Returns data in the request and allows you to carry on execution.
     * @method flush
     * @param {object|string} data The data you want return by the request.
     * @param {object} meta Any meta-data required to service the request.
     */

    /**
     * Returns data and closes the request.
     * @method done
     * @param {object|string} data The data you want return by the request.
     * @param {object} meta Any meta-data required to service the request.
     */

    /**
     * Programatically report an error to Mojito, which will handle it
     * gracefully.
     * @method error
     * @param {Error} err A normal JavaScript Error object is expected, but you
     *     may add a "code" property to the error if you want the framework to
     *     report a certain HTTP status code for the error. For example, if the
     *     status code is 404, Mojito will generate a 404 page. Additionally you
     *     might provide a reasonPhrase property, to override the default human
     *     readable description for this status code with one specific to your
     *     application. For example for the status code 404 you could provide
     *     "This does not exist in my app".
     */

    /**
     * This dispatch function is called one time per Mojito execution. It
     * creates a contextualized Y instance for all further internal dispatches
     * to use. It also creates the ActionContext for the mojit.
     *
     * The command has three main parts:  the "instance", the "context", and the
     * "params".
     * <pre>
     *  command: {
     *      instance: ...see below...
     *      context: ...see below...
     *      params: ...see below...
     *  }
     * </pre>
     *
     * The "instance" is a partial instance with details of the mojit instance.
     * See `ServerStore.expandInstance()` for details of the structure and which
     * fields are required.
     *
     * The "context" is the request context.  It is built by the
     * "contextualizer" middleware.
     *
     * The "params" is a structured set of parameters to pass to the mojit.
     * <pre>
     *  params: {
     *      route: {},
     *      url: {},
     *      body: {},
     *      file: {},
     *      ...
     *  }
     * </pre>
     *
     * <pre>
     * adapter: {
     *      flush: function(data, meta){},
     *      done: function(data, meta){},
     *      error: function(err){}
     * }
     * </pre>
     * @method dispatch
     * @param {map} command the "command" describing how to dispatch the mojit.
     *     See above.
     * @param {object} adapter the output adapter to pass to the mojit. See
     *     above.
     * @deprecated Use 'ac._dispatch()' instead. See https://github.com/yahoo/mojito/blob/develop/DEPRECATIONS.md
     * for details.
     */
     /**
     * This _dispatch function is called one time per Mojito execution. It
     * creates a contextualized Y instance for all further internal dispatches
     * to use. It also creates the ActionContext for the mojit.
     *
     * The command has three main parts:  the "instance", the "context", and the
     * "params".
     * <pre>
     *  command: {
     *      instance: ...see below...
     *      context: ...see below...
     *      params: ...see below...
     *  }
     * </pre>
     *
     * The "instance" is a partial instance with details of the mojit instance.
     * See `ServerStore.expandInstance()` for details of the structure and which
     * fields are required.
     *
     * The "context" is the request context.  It is built by the
     * "contextualizer" middleware.
     *
     * The "params" is a structured set of parameters to pass to the mojit.
     * <pre>
     *  params: {
     *      route: {},
     *      url: {},
     *      body: {},
     *      file: {},
     *      ...
     *  }
     * </pre>
     *
     * <pre>
     * adapter: {
     *      flush: function(data, meta){},
     *      done: function(data, meta){},
     *      error: function(err){}
     * }
     * </pre>
     * @method _dispatch
     * @param {map} command the "command" describing how to dispatch the mojit.
     *     See above.
     * @param {object} adapter the output adapter to pass to the mojit. See
     *     above.
     */

    /**
     * Mixes all the Action Context addons into the Action Context
     * @private
     * @method attachActionContextAddons
     * @param {Array} addons The action context addons.
     * @param {object} command The command object.
     * @param {object} adapter The output adapter.
     * @param {Y.mojito.ActionContext} ac The action context.
     * @param {ResourceStore} store the resource store
     */
    function attachActionContextAddons(addons, command, adapter, ac, store) {

        var i,
            addon,
            addonName,
            acAddons = command.instance.acAddons || [];

        // adding 'core' addon at the begining (from output-adapter)
        // as the default addon support ac.done/error/flush)
        // TODO: we might merge AC and output-adapter since it
        //       looks like a hack.
        acAddons.unshift('core');

        for (i = 0; i < acAddons.length; i += 1) {
            addonName = acAddons[i];
            if (addons[addonName]) {
                addon = new addons[addonName](command, adapter, ac);
                if (addon.namespace) {
                    ac[addon.namespace] = addon;
                    // TODO: this is a big hack to pass the store reference
                    // into the addon without changing the signature of ctor,
                    // instead we should pass an object with all the stuff that
                    // an addon will need as part of the ctor.
                    if (Y.Lang.isFunction(addon.setStore)) {
                        addon.setStore(store);
                    }
                }
            } else {
                Y.log('[' + addonName + '] addon was not found for mojit ' + command.instance.type,
                    'warn', NAME);
            }
        }
    }


    /**
     * The main point of entry for all mojits into Mojito. The Action Context is
     * passed to every mojit action during execution, either on the client or
     * server. This object is the API into Mojito, can can have many plugins
     * attached the provide extra functionality.
     * @class ActionContext
     */
    function ActionContext(opts) {

        var controller = opts.controller,
            command = opts.command,
            actionFunction = command.action,
            perf = Y.mojito.perf.timeline('mojito', 'ac:init', 'set up AC object', command),
            error,
            my;

        my = this;

        this.action = command.action;
        this.type = command.instance.type;
        this.context = command.context;
        this.dispatcher = opts.dispatcher;

        // These should not be on the ac object
        this.command = command;
        this.instance = command.instance;
        this._adapter = opts.adapter;

        // TODO: this computation should not be executed here
        // instead mojito-config-addon provides a way to
        // access it. For now, it is needed on output-adapter
        this.app = {
            config: opts.store.getAppConfig(this.context),
            routes: opts.store.getRoutes(this.context)
        };

        // Create a function which will properly delegate to the dispatcher to
        // perform the actual processing.
        this._dispatch = function(command, adapter) {
            return my.dispatcher.dispatch(command, adapter);
        };

        attachActionContextAddons(Y.mojito.addons.ac, command, opts.adapter, this, opts.store);

        // Check if the controller has the requested action
        if (!Y.Lang.isFunction(controller[actionFunction])) {
            // If the action is not found try the '__call' function
            if (Y.Lang.isFunction(controller.__call)) {
                actionFunction = '__call';
            } else {
                // If there is still no joy then die
                error = new Error("No method '" + command.action + "' on controller type '" + command.instance.type + "'");
                error.code = 404;
                throw error;
            }
        }

        perf.done(); // closing the 'ac:init' timeline

        Y.mojito.perf.mark('mojito', 'action:start', 'before the action', command);

        perf = Y.mojito.perf.timeline('mojito', 'action:call',
            'the initial syncronous part of the action', command);

        controller[actionFunction](this);

        perf.done(); // closing the 'action:call' timeline

    }

    Y.namespace('mojito').ActionContext = ActionContext;

}, '0.1.0', {requires: [
    'mojito-output-adapter-addon'
]});
