/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true nomen:true*/
/*global YUI*/

YUI.add('TunnelProxy', function(Y, NAME) {


    function makeAdapter(ac) {
        var oldAdapter = ac._adapter,
            newAdapter;

        newAdapter = Y.mix(oldAdapter, {

            rpc: {
                originalDone: oldAdapter.done,
                ac: ac,
                buffer: {
                    data: '',
                    meta: {}
                }
            },

            _updateBuffer: function(data, meta) {
                var buff = this.rpc.buffer;
                buff.data = buff.data + data;
                buff.meta = Y.mojito.util.metaMerge(buff.meta, meta);
                // metaMerge will strip off the view info, but we need that for
                // RPC calls, so we put it back
                if (meta.view) {
                    if (buff.meta.view) {
                        buff.meta.view = Y.mojito.util.metaMerge(
                            buff.meta.view,
                            meta.view
                        );
                    } else {
                        buff.meta.view = meta.view;
                    }
                }
            },

            flush: function(data, meta) {
                this._updateBuffer(data, meta);
            },

            done: function(data, meta) {
                var out,
                    buffer = this.rpc.buffer;
                this._updateBuffer(data, meta);
                out = {
                    status: meta.http.code,
                    data: {
                        html: buffer.data,
                        // including the meta data for resolution on the
                        // client
                        meta: buffer.meta
                    }
                };
                // We need to do this so that the original done method will
                // (eventually) be called.  If we don't, we'll loop back to
                // this method, recursing forever.
                this.done = this.rpc.originalDone;
                this.rpc.ac.done(out, 'json');
            }

        }, true);

        return newAdapter;
    }


    Y.namespace('mojito.controllers')[NAME] = {

        init: function(config) {
            this.config = config;
        },

        index: function(ac) {
            // This key is set by the TunnelServer in _handleRpc().
            var proxyCommand = ac.params.body('proxyCommand'),
                txId = ac.params.body('txId');

            if (!proxyCommand) {
                ac.error(
                    'Cannot execute TunnelProxy mojit without a proxy command.'
                );
                return;
            }

            // dispatch the command as the proxy
            ac._dispatch(proxyCommand, makeAdapter(ac));
        }
    };

}, '0.1.0', {requires: [
    'mojito-http-addon',
    'mojito-util'
]});
