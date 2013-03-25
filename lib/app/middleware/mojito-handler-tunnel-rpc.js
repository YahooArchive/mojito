/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*global exports, module*/
/*jslint sloppy:true, nomen:true*/

/**
 * Exports a middleware factory that can handle RPC tunnel requests.
 *
 * @param {Object} config The configuration.
 * @return {Function} The handler.
 */
module.exports = function (config) {
    return function (req, res, next) {
        var rpcReq = req._tunnel && req._tunnel.rpcReq,
            command;

        if (!rpcReq) {
            return next();
        }

        command         = req.body;
        command.context = command.context || {};

        // When switching from the client context to the server context, we
        // have to override the runtime.
        command.context.runtime = 'server';

        // All we need to do is expand the instance given within the RPC call
        // and attach it within a "tunnelCommand", which will be handled by
        // Mojito instead of looking up a route for it.
        config.store.expandInstance(
            command.instance,
            command.context,
            function (err, instance) {
                if (err) {
                    next(err);
                }

                // Replace with the expanded instance.
                command.instance = instance;

                req.command = {
                    action: command.action,
                    instance: {
                        // Magic here to delegate to tunnelProxy.
                        base: 'tunnelProxy'
                    },
                    params: {
                        body: {
                            proxyCommand: command
                        }
                    },
                    context: command.context
                };

                return next();
            }
        );
    };
};
