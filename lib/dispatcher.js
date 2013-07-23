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
**/

"use strict";

var liburl = require('url'),
    debug = require('debug')('mojito:dispatcher'),
    OutputHandler = require('./output-handler.server');

/**
@class dispatcher
@static
**/
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
            matchCall = [],
            splits;

        splits = call.split('.');
        matchCall[1] = splits.pop();
        matchCall[0] = splits.join('.');

        // in the future we might want to support a more generic annotation
        // mechanism, walking all callbacks and producing an array of
        // annotations, for now looking at the last one is just fine.
        function extractAnnotations(route) {
            var fn = route && route.callbacks && route.callbacks.length &&
                        route.callbacks[route.callbacks.length - 1];
            return fn && fn.dispatch;
        }

        function fn(req, res, next) {
            var command = { instance: { } },
                mojito = req.app && req.app.mojito,
                url = req.url;

            if (!mojito) {
                return next(new Error('app.mojito does not exist.'));
            }

            if (!mojito.routes) {
                debug('building up route cache');
                mojito.routes = {};
                Object.keys(req.app.routes).forEach(function (method) {
                    var routes,
                        cache = [];

                    routes = req.app.routes[method];
                    if (routes && routes.length > 0) {
                        routes.forEach(function (route) {
                            var dispatch = extractAnnotations(route);

                            if (dispatch) {
                                cache.push({
                                    path: route.path,
                                    method: route.method,
                                    regexp: route.regexp,
                                    keys: route.keys,
                                    params: route.params,
                                    dispatch: dispatch
                                });
                            }
                        });
                        mojito.routes[method] = cache;
                    }
                });
            }

            if (matchCall[0][0] !== '@') {
                command.instance.base = matchCall[0];
            } else {
                command.instance.type = matchCall[0].slice(1);
            }
            command.action = matchCall[1];
            command.context = req.context;
            command.params = {
                route: req.params || {},
                url: req.query || {},
                body: req.body || {},
                file: {} // FUTURE: add multi-part file data here
            };

            req.command = command;

            debug('[%s] dispatch cmd for url: %s', call, url);

            my.handleRequest(req, res, next);
        }

        fn.dispatch = {
            call: call,
            params: { }, // for parametrized paths
            options: { } // compatibility with the yaf-dispatcher
        };

        return fn;
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

        var command = req.command,
            context = req.context,
            app = req.app, // the express app
            mojito = app.mojito,
            store = mojito.store,
            Y = mojito.Y,
            appConfig,
            outputHandler;

        if (!command) {
            debug('no command found');
            return next();
        }

        appConfig = store.getStaticAppConfig();

        outputHandler = new OutputHandler(req, res, next);

        outputHandler.setLogger({ log: Y.log });

        // storing the static app config as well as contextualized 
        // app config per request
        outputHandler.page.staticAppConfig = appConfig;
        outputHandler.page.appConfig = store.getAppConfig(context);
        // - routes are not contextualized anymore
        // - page.routes references the Express-like routes object
        //   for backward compatiblity, this should be converted back the 
        //   pre-next format.
        // TODO: in future, Mojito will simply return the Express-like
        // routes object.
        outputHandler.page.routes = mojito.routes;

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

