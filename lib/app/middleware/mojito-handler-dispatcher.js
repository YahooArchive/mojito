/**
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint node:true, nomen: true */

/**
Mojito dispatcher middleware.

@module mojito-dispatcher
**/

'use strict';

var debug = require('debug')('middleware:dispatcher'),
    OutputHandler = require('../../output-handler.server');

/**
 * @param {Object} config
 * @return {Function} express middleware
 */
module.exports = function (config) {

    var appConfig,
        store,
        Y;

    return function (req, res, next) {
        var command = req.command,
            outputHandler;

        if (!command) {
            next();
            return;
        }
        
        if (!store && req.app && req.app.mojito) {
            store = req.app.get('mojito.store');
            Y = req.app.get('mojito.Y');
            // TODO: fix perf configuration in static app config
            // appConfig requires some massaging for `perf` configuration
            appConfig = store.getStaticAppConfig();
        }

        outputHandler = new OutputHandler(req, res, next);
        outputHandler.setLogger({
            log: Y.log
        });

        outputHandler.page.staticAppConfig = Y.mojito.util.copy(appConfig);

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
