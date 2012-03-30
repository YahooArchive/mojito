/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true nomen:true*/
/*global YUI*/

YUI.add('DaliProxy', function(Y, NAME) {


    function makeAdapter(ac, txId) {
        var oldAdapter = ac._adapter,
            newAdapter;

        newAdapter = Y.mix(oldAdapter, {

            rpc: {
                originalDone: oldAdapter.done,
                ac: ac,
                txId: txId,
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
                // Dali-specific keys here. If we change out for a different
                // client/server protocol this construction will need to be
                // abstracted into a builder/formatter of some form.
                out = {
                    resps: [{
                        txId: this.rpc.txId,
                        status: meta.http.code,
                        data: {
                            html: buffer.data,
                            // including the meta data for resolution on the
                            // client
                            meta: buffer.meta
                        }
                    }]
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


    Y.mojito.controllers[NAME] = {

        init: function(config) {
            this.config = config;
        },

        index: function(ac) {
            // This key is set by the TunnelServer in _handleRpc().
            var proxyCommand = ac.params.body('proxyCommand'),
                txId = ac.params.body('txId');

            if (!proxyCommand) {
                ac.error(
                    'Cannot execute DaliProxy mojit without a proxy command.'
                );
                return;
            }

            // can't use falsey cause txId might be 0
            if (txId === null || txId === undefined) {
                ac.error(
                    'Cannot execute DaliProxy mojit without a transaction ID.'
                );
                return;
            }

            // dispatch the command as the proxy
            ac._dispatch(proxyCommand, makeAdapter(ac, txId));
        }
    };

}, '0.1.0', {requires: [
    'mojito-http-addon',
    'mojito-util'
]});
