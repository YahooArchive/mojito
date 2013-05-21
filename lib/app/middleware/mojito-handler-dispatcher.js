/**
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint node:true, nomen:true */

/**
Mojito dispatcher middleware.

@module mojito-dispatcher
**/

'use strict';

var debug = require('debug')('mojito:middleware:dispatcher'),
    OutputHandler = require('../../output-handler.server');

/**
@param {Object} config
@return {Function} express middleware
**/
module.exports = function (config) {

    var app,
        appConfig,
        store,
        // NOTE: Eventually, Y will not be declared in this middleware.
        // Instead, only a handle to the dispacher will be needed
        // by using `modown-yui`
        Y;

    return function (req, res, next) {
        var command = req.command,
            outputHandler,
            context = req.context || {};

        if (!command) {
            next();
            return;
        }
        
        if (!store && req.app && req.app.mojito) {
            app = req.app;
            store = app.mojito.store;
            // TODO: eventually, this should be:
            //
            //     req.app.yui.use('mojito-dispatcher')
            //
            // to load and get access to the dispatcher
            Y = app.mojito.Y;
            appConfig = store.getStaticAppConfig();
        }

        outputHandler = new OutputHandler(req, res, next);
        outputHandler.setLogger({
            log: Y.log
        });

        // storing the static app config as well as contextualized 
        // app config per request
        outputHandler.page.staticAppConfig = appConfig;
        outputHandler.page.appConfig = store.getAppConfig(context);
        // compute routes once per request
        outputHandler.page.routes = store.getRoutes(context);

        // HookSystem::StartBlock
        // enabling perf group
        if (appConfig.perf) {
            // in case another middleware has enabled hooks before
            outputHandler.hook = req.hook || {};
            Y.mojito.hooks.enableHookGroup(outputHandler.hook, 'mojito-perf');
        }
        // HookSystem::EndBlock

        // HookSystem::StartBlock
        Y.mojito.hooks.hook('AppDispatch', outputHandler.hook, req, res);
        // HookSystem::EndBlock

        Y.mojito.Dispatcher.init(store).dispatch(command, outputHandler);
    };

};
