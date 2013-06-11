/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, nomen:true*/
/*global YUI*/

YUI.add('TunnelProxy', function(Y, NAME) {

    'use strict';

    Y.namespace('mojito.controllers')[NAME] = {

        __call: function(ac) {
            // This key is set by the TunnelServer in _handleRpc().
            var proxyCommand = ac.params.body('proxyCommand'),
                txId = ac.params.body('txId'),
                newAdapter;

            if (!proxyCommand) {
                ac.error(
                    'Cannot execute TunnelProxy mojit without a proxy command.'
                );
                return;
            }

            // the new adapter that inherit from the original adapter
            newAdapter = new Y.mojito.OutputBuffer(txId, function (err, data, meta) {

                // HookSystem::StartBlock
                Y.mojito.hooks.hook('adapterTunnel', ac._adapter.hook, 'end', this);
                // HookSystem::EndBlock

                if (err) {
                    ac.error(err);
                    return;
                }

                ac.done({
                    status: meta.http.code,
                    data: {
                        html: data,
                        // including the meta data for resolution on the client
                        meta: meta,
                        // including mojit data to be rehydrated on the client
                        data: proxyCommand.instance.data
                    }
                }, 'json');
            });

            // HookSystem::StartBlock
            Y.mojito.hooks.hook('adapterTunnel', ac._adapter.hook, 'start', newAdapter);
            // HookSystem::EndBlock

            newAdapter = Y.mix(newAdapter, ac._adapter);

            // dispatch the command as the proxy
            ac._dispatch(proxyCommand, newAdapter);
        }
    };

}, '0.1.0', {requires: [
    'mojito-params-addon',
    'mojito-output-buffer',
    'mojito-util'
]});
