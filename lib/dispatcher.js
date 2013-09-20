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

var libqs = require('querystring'),
    liburl = require('url'),
    libutil = require('./util'),
    debug = require('debug')('mojito:dispatcher'),
    OutputHandler = require('./output-handler.server'),
    CACHE = {};

/**
@class dispatcher
@static
**/
module.exports = {

    /**
    Provides a way to reset the internal routes configurations
    **/
    resetRoutesConfig: function () {
        CACHE = {};
    },

    /**
    Dispatch a mojit call.

    Example usage:

        app.get('/admin', mojito.dispatch('admin.index'));
        app.get('/Help', mojito.dispatch('@Admin.help'));

    @param {String} call the name of the mojit and action concatenated
    by a period (e.g. "admin.help" will execute mojit instance `admin` with
    action `help`.
    @param {Object} params optional routing parameters to attach to the
    request to mojito
    **/
    dispatch: function (call, params) {
        var my = this,
            matchCall = [],
            routeParams = params || {},
            splits;

        splits = call.split('.');
        matchCall[1] = splits.pop();
        matchCall[0] = splits.join('.');

        if (params && typeof params === 'string') {
            routeParams = libqs.parse(params);
        }

        // now looking at the last callback with the appropriate "annotations"
        function extractAnnotations(route) {
            var fn = route && route.callbacks && route.callbacks.length &&
                        route.callbacks[route.callbacks.length - 1];
            return fn && fn.dispatch;
        }

        function fn(req, res, next) {
            var app = req.app,
                appRoutes = req.app.routes,
                command = { instance: {} },
                mojito = req.app && req.app.mojito,
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
                route: libutil.extend({}, routeParams, req.params) || {},
                url: req.query || {},
                body: req.body || {},
                file: {} // FUTURE: add multi-part file data here
            };

            req.command = command;

            debug('[%s] dispatch cmd for url: %s', call, url);

            my.handleRequest(req, res, next);
        }

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
            app = req.app,
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
        if (!CACHE.routes) {
            CACHE.routes = app.getRouteMap();
        }

        outputHandler.page.routes = CACHE.routes;

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

