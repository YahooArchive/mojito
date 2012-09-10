/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true*/


function Debug(Y, store) {
    this.Y = Y;
    this._store = store;
    try {
        this.microtime = require('microtime');
    } catch (e) {
        Y.log('microtime not found. Recorded times will not have' +
            ' microsecond accuracy', 'warn', "debug");
    }
}

Debug.prototype = {
    handle: function() {
        var self = this,
            queryParam = null,
            debugPath = null,
            debugMojit = null,
            appConfig = self._store.getAppConfig(null);

        // see if debugger is turned on
        if (appConfig.debug) {
            queryParam = appConfig.debug.queryParam;
            debugPath = appConfig.debug.debugPath;
            debugMojit = appConfig.debug.debugMojit;
        }

        return function(req, res, next) {
            var debug = new self.Y.mojito.DebugAPI(self.Y, req, queryParam, self.microtime);

            req.debug = debug;

            if (!debugMojit || !queryParam || !debugPath) {
                next();
                return;
            }

            if (req.url.match(new RegExp("^" + debugPath + ".*$"))) {
                // debug is in route -> reroute to page not found.
                // This prevents the debug mojit from being called directly by the user.
                req.url = null;
                console.warn("Request attempting to access debugger route directly");
            } else if (req.url.match(new RegExp("^.*\?(.*&)?" + queryParam + "=.+$"))) {

                try {
                    libynet = require('ynetdblib');
                } catch (e1) {
                    console.error('ynetdblib is not available on this system');
                }

                try {
                    // Determine if request comes from Yahoo's internal network.
                    // If so, reroute to debug...
                    if ((req.headers.yahooremoteip && libynet.isYahooInternalAddress(req.headers.yahooremoteip)) || libynet.isYahooInternalAddress(req.connection.remoteAddress)) {
                        var liburl = require('url');
                        var call = [];
                        call[0] = debugMojit.split('.');
                        call[1] = call[0].pop();
                        call[0] = call[0].join('.');

                        req.url = debugPath + req.url;

                        req.command = {
                            instance: {
                            },
                            action: call[1],
                            context: req.context,
                            params: {
                               route: [],
                               url: liburl.parse(req.url, true).query || {},
                               body: req.body || {},
                               file: {}
                            }
                        };
                        if (call[0][0] === '@') {
                            req.command.instance.type = call[0].slice(1);
                        } else {
                            req.command.instance.base = call[0];
                        }
                    } else {
                        console.warn("Non internal address (" + (req.headers.yahooremoteip || req.connection.remoteAddress) + ") attempting to access debugger");
                    }
                } catch (e2) {
                    console.error('Unable to verify if request address is internal: ' + e2.message);
                }
            }
            next();
        };
    }
}

module.exports = function(config) {
    var debug = new Debug(config.Y, config.store);
    return debug.handle();
};
