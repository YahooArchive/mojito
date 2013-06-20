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

var liburl = require('url'),
    debug = require('debug')('mojito:dispatcher'),
    OutputHandler = require('./output-handler.server');

module.exports = {


    /**

    Dispatch a mojit call.

    Example usage:

        app.get('/admin', mojito.dispatch('admin.index'));
        app.get('/Help', mojito.dispatch('@Admin.help'));

    @param {String} call the name of the mojit and action concatenated
    by a period (e.g. "admin.help" will execute mojit instance `admin` with
    action `help`.
    **/
    dispatch: function (call) {
        var my = this,
            matchCall = [];

        matchCall[0] = call.split('.');
        matchCall[1] = matchCall[0].pop();
        matchCall[0] = matchCall[0].join('.');

        return function (req, res, next) {
            var command = { instance: { } },
                mojito = (req.app && req.app.mojito) || null,
                url = req.url;

            if (!mojito) {
                return next(new Error('app.mojito does not exist.'));
            }

            if (matchCall[0][0] !== '@') {
                command.instance.base = matchCall[0];
            } else {
                command.instance.type = matchCall[0].slice(1);
            }
            command.action = matchCall[1];
            command.context = req.context;
            command.params = {
                route: (req.routeMatch && req.routeMatch.query) || {},
                url: req.query || {},
                body: req.body || {},
                file: {} // FUTURE: add multi-part file data here
            };

            req.command = command;

            debug('[%s] dispatch cmd for url: %s', call, url);

            my.handleRequest(req, res, next);
        };
    },

    /**
    The `command` should be attached to the request.

    @protected
    @method handleRequest 
    @param {http.ServerRequest} req
        @param {Object} req.command the mojito command to be executed
    @param {http.ServerResponse} res
    @param {Function} next
    **/
    handleRequest: function (req, res, next) {

        var command = req.command || null,
            context = req.context,
            app = req.app, // the express app
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
        // routes are not contextualized anymore
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

