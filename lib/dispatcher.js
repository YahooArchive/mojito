/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE.txt file for terms.
 */

/*jslint nomen:true, node:true*/

/**

Given a `command`, dispatches it to the Mojito engine.

@module mojito
@submodule dispatcher
@uses *debug, output-handler.server
**/

"use strict";

var debug = require('debug')('mojito:dispatcher'),
    OutputHandler = require('./output-handler.server');

module.exports = {

    /**
    The `command` should be attached to the request.

    @public
    @method dispatch
    @param {http.ServerRequest} req
        @param {Object} req.command the mojito command to be executed
    @param {http.ServerResponse} res
    @param {Function} next
    **/
    dispatch: function (req, res, next) {

        var command = req.command || null,
            context = req.context,
            app = this._app, // the express app
            mojito = app.mojito,
            store = mojito.store,
            Y = mojito.Y,
            appConfig = store.getStaticAppConfig(),
            outputHandler;

        if (!command) {
            debug('no command found');
            return next();
        }

        outputHandler = new OutputHandler(req, res, next);

        outputHandler.setLogger({ log: Y.log });

        // storing the static app config as well as contextualized 
        // app config per request
        outputHandler.page.staticAppConfig = appConfig;
        outputHandler.page.appConfig = store.getAppConfig(context);

        // compute routes once per request
        outputHandler.page.routes = store.getRoutes();

        // HookSystem::StartBlock
        // enabling perf group
        if (appConfig.perf) {
            // in case another middleware has enabled hooks before
            outputHandler.hook = req.hook || {};
            Y.mojito.hooks.enableHookGroup(outputHandler.hook, 'mojito-perf');
        }
        // HookSystem::EndBlock

        // HookSystem::StartBlock
        // Y.mojito.hooks.hook('AppDispatch', outputHandler.hook, req, res);
        // HookSystem::EndBlock

        Y.mojito.Dispatcher.init(store).dispatch(command, outputHandler);
    }
};

