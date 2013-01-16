/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true*/
/*global YUI*/

/**
 * The hook system provides a way for application or add on developers to access the inner working of mojito.
 * There are two steps to using an hook. First, an addon needs to register an interest in a hook by calling
 * registerHook with the name of the hook and a callback function. The second step involves enabling a hook
 * your addon to recieve hooks. You need to call the enableHookGroup with the name of your addon.
 *
 * List of hooks
 *
 * <ul>
 * <li>Y.mojito.hooks.hook('adapterBuffer', hook_ctx, 'start', this);
 * <li>Y.mojito.hooks.hook('adapterBuffer', this.__hook_ctx, 'end', this);
 * <li>Y.mojito.hooks.hook('addon', this.adapter.hook, 'start', self, cfg);
 * <li>Y.mojito.hooks.hook('addon', this.adapter.hook, 'end', self);
 * <li>Y.mojito.hooks.hook('hb', adapter.hook, 'start', tmpl);
 * <li>Y.mojito.hooks.hook('hb', adapter.hook, 'end');
 * <li>Y.mojito.hooks.hook('attachActionContext', adapter.hook, 'start', command);
 * <li>Y.mojito.hooks.hook('attachActionContext', adapter.hook, 'end');
 * <li>Y.mojito.hooks.hook('actionContext', opts.adapter.hook, 'start', my, opts);
 * <li>Y.mojito.hooks.hook('actionContext', opts.adapter.hook, 'end1', my, opts);
 * <li>Y.mojito.hooks.hook('actionContext', opts.adapter.hook, 'end2', my, opts);
 * <li>Y.mojito.hooks.hook('actionContextDone', adapter.hook, 'start', this);
 * <li>Y.mojito.hooks.hook('actionContextDone', adapter.hook, 'end1', this);
 * <li>Y.mojito.hooks.hook('actionContextDone', adapter.hook, 'end2', this);
 * <li>Y.mojito.hooks.hook('dispatchCreateAction', adapter.hook, 'start', command);
 * <li>Y.mojito.hooks.hook('dispatchCreateAction', adapter.hook, 'end');
 * <li>Y.mojito.hooks.hook('dispatch', adapter.hook, 'start', command);
 * <li>Y.mojito.hooks.hook('dispatch', adapter.hook, 'end');
 * <li>Y.mojito.hooks.hook('storeTypeDetails', instance.hook, 'start', spec);
 * <li>Y.mojito.hooks.hook('storeTypeDetails', instance.hook, 'end');
 * <li>Y.mojito.hooks.hook('mojitoClient', null, 'start', this);
 * <li>Y.mojito.hooks.hook('mojitoClient', null, 'end', this);
 * <li>Y.mojito.hooks.hook('mojitoClientBind', null, 'start', this);
 * <li>Y.mojito.hooks.hook('mojitoClientBind', null, 'resume', this);
 * <li>Y.mojito.hooks.hook('mojitoClientBind', null, 'end', this);
 * <li>Y.mojito.hooks.hook('mojitoClientBindComplete', null, 'start', this);
 * <li>Y.mojito.hooks.hook('mojitoClientBindComplete', null, 'end', this);
 * <li>Y.mojito.hooks.hook('AppDispatch', req.hook, req, res);
 * </ul>
 * @module MojitoHooks
 */


YUI.add('mojito-hooks', function(Y, NAME) {
    var map_hook_tool = {};

    Y.namespace('mojito.hooks');

    /**
     * Trigger a hook
     * @method hook
     * @param {String} hook_name
     * @param {Object} hook context (from req.hook, or adapter.hook)
     * @param {} hook specific data
     *
     * Example:
     * <pre>
     * Y.mojito.hooks.hook('test_hook', ctx, ...);
     * </pre>
     */
    Y.mojito.hooks.hook = function (hook) {
        Y.log("hooks disabled (" + hook + ")", 'debug', NAME);
    };

    Y.mojito.hooks.real_hook = function (hook, ctx) {
        Y.log("in hook handler: " + hook, 'debug', NAME);
        var tool,
            ds_args;

        if (!map_hook_tool[hook] || (!ctx && !Y.mojito.hooks.global_hooks_ctx)) {
            return;
        }
        ds_args = [].slice.apply(arguments).slice(2);
        for (tool in map_hook_tool[hook]) {
            if (map_hook_tool[hook].hasOwnProperty(tool)) {
                if (ctx && ctx[tool]) {
                    map_hook_tool[hook][tool].apply(ctx[tool], ds_args);
                }
                if (Y.mojito.hooks.global_hooks_ctx && Y.mojito.hooks.global_hooks_ctx[tool]) {
                    map_hook_tool[hook][tool].apply(Y.mojito.hooks.global_hooks_ctx[tool], ds_args);
                }
            }
        }
    };

    /**
     * A Mojito addon/tool can register an interest in a hook. The call context for all tools
     * will be the same for all hooks registered for a tool, and it will be new and unique for
     * each request. The params to the call back function are hook specific.
     *
     * @method registerhook
     * @param {String} tool tool name for this hook
     * @param {String} hook name of hook
     * @param {Function} cb call back function
     *
     * Example:
     * <pre>
     * Y.mojito.hooks.registerHook('test_tool, 'test_hook', function (reg, data) {});
     * </pre>
     */
    Y.mojito.hooks.registerHook = function (tool, hook, cb) {
        if (!map_hook_tool[hook]) {
            map_hook_tool[hook] = {};
        }
        map_hook_tool[hook][tool] = cb;

        Y.mojito.hooks.hook = Y.mojito.hooks.real_hook;

        Y.log("register tool: " + tool + ", hook: " + hook, 'debug', NAME);
    };

    /**
     * Enable a tool for a request.
     *
     * @method enableHookGroup
     * @param {Object} req Request object to enable hook on
     * @param {String} tool Name of tool to enable
     * @return {Object} this tools context used for its hook callbacks
     *
     * Example:
     * <pre>
     * Y.mojito.hooks.enableHookGroup(req, 'test_tool');
     * </pre>
     */
    Y.mojito.hooks.enableHookGroup = function (req, tool) {
        var ret = {};
        Y.log("enable tool: " + tool, 'debug', NAME);

        // if called in client, use single global context.
        if (!req) {
            if (!Y.mojito.hooks.global_hooks_ctx) {
                Y.mojito.hooks.global_hooks_ctx = {};
            }
            if (!Y.mojito.hooks.global_hooks_ctx[tool]) {
                Y.mojito.hooks.global_hooks_ctx[tool] = {};
            }
            ret = Y.mojito.hooks.global_hooks_ctx[tool];
        } else {
            if (!req.hook) {
                req.hook = {};
            }

            if (!req.hook[tool]) {
                req.hook[tool] = {};
            }
            ret = req.hook[tool];
        }

        return ret;
    };

}, '0.1.0', {requires: []});
