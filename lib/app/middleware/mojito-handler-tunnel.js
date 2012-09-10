/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/


var liburl = require('url'),
    logger,
    RX_MULTI_SLASH_ALL = /\/+/g,
    Y = require('yui').YUI({useSync: true}).use('json-parse', 'json-stringify');

Y.applyConfig({useSync: false});


function trimSlash(str) {
    if ('/' === str.charAt(str.length - 1)) {
        return str.substring(0, str.length - 1);
    }
    return str;
}


function TunnelServer() {}

/*
* ResourceStoreAdapter will call expandInstance and the TunnelServer is what
* handles that. The header 'x-mojito-header' (read here and set in
* store.client.js) tells the server not to try to route the URL, it gets handled
* by this critter. The targeted URL _might actually exist_ but we need to make
* sure that it _does not_ if the mojito header is set to 'tunnel'.
*/
TunnelServer.prototype = {

    handle: function(store, globalLogger) {
        var self = this,
            config;
        logger = globalLogger;
        //console.log('creating handle');
        this._store = store;
        config = store.getAppConfig({});
        this.tunnelPrefix = (config && config.tunnelPrefix) ?
                config.tunnelPrefix :
                '/tunnel';
        this.staticPrefix = '/static';
        if (config && config.staticHandling &&
                config.staticHandling.hasOwnProperty('prefix')) {
            this.staticPrefix = (config.staticHandling.prefix ?
                    '/' + config.staticHandling.prefix :
                    '');
        }
        this.tunnelPrefix = trimSlash(this.tunnelPrefix);
        this.staticPrefix = trimSlash(this.staticPrefix);
        if (!this.tunnelPrefix) {
            // this makes the logic below a bit simpler
            this.tunnelPrefix = '/';
        }

        return function(req, res, next) {
            var url, parts;

            // If we are not in a tunnel get out of here fast
            if (req.url.indexOf(self.tunnelPrefix) !== 0 &&
                    req.headers['x-mojito-header'] !== 'tunnel') {
                return next();
            }

            url = req.url.replace(self.tunnelPrefix, '').replace(
                self.staticPrefix,
                ''
            );
            url = url.replace(RX_MULTI_SLASH_ALL, '/');
            url = url.split('?')[0];
            parts = url.split('/');

            if (parts.length === 4 && parts[2] === 'specs') {
                return self._handleSpec(req, res, next, parts[1], parts[3]);
            }
            if (parts.length === 3 && parts[2] === 'definition.json') {
                return self._handleType(req, res, next, parts[1]);
            }
            if (req.url === self.tunnelPrefix && 'POST' === req.method) {
                return self._handleRpc(req, res, next);
            }
            next();
        };
    },

    _handleSpec: function(req, res, next, type, basename) {

        var name,
            instance = {},
            that = this;

        name = basename.split('.').slice(0, -1).join('.') || null;

        if (!type || !name) {
            that._sendError(res, 'Not found: ' + req.url, 500);
            return;
        }

        instance.base = type;

        if (name !== 'default') {
            instance.base += ':' + name;
        }

        this._store.getSpec('client', instance.base, req.context,
            function(err, data) {
                if (err) {
                    that._sendError(res, 'Error opening: ' + req.url + '\n' +
                        err,
                        500
                        );
                    return;
                }
                that._sendData(res, data);
            });
    },

    _handleType: function(req, res, next, type) {

        var instance = {},
            that = this;

        if (!type) {
            that._sendError(res, 'Not found: ' + req.url, 500);
            return;
        }

        instance.type = type;

        this._store.getType('client', instance.type, req.context,
            function(err, data) {
                if (err) {
                    that._sendError(res, 'Error opening: ' + req.url + '\n' +
                        err,
                        'debug',
                        'Tunnel:specs'
                        );
                    return;
                }
                that._sendData(res, data);
            });
    },

    _handleRpc: function(req, res, next) {
        var data = req.body,
            command = data;


        // when taking in the client context on the server side, we have to
        // override the runtime, because the runtime switches from client to server
        if (!command.context) {
            command.context = {};
        }
        command.context.runtime = 'server';

        // all we need to do is expand the instance given within the RPC call
        // and attach it within a "tunnelCommand", which will be handled by
        // Mojito instead of looking up a route for it.
        this._store.expandInstance(command.instance, command.context,
            function(err, inst) {
                // replace with the expanded instance
                command.instance = inst;
                req.command = {
                    instance: {
                        // Magic here to delegate to tunnelProxy.
                        base: 'tunnelProxy'
                    },
                    params: {
                        body: {
                            proxyCommand: command
                        }
                    },
                    context: data.context
                };
                next();
            });
    },

    _sendError: function(res, msg, code) {
        this._sendData(res, {error: msg}, (code || 500));
    },

    _sendData: function(res, data, code) {
        res.writeHead((code || 200), {
            'content-type': 'application/json; charset="utf-8"'
        });
        res.end(Y.JSON.stringify(data, null, 4));
    }
};


/**
 * Export a function which can create the handler.
 * @param {Object} config Data to configure the handler.
 * @return {Object} The newly constructed handler.
 */
module.exports = function(config) {
    var tunnel = new TunnelServer();
    return tunnel.handle(config.store, config.logger);
};
