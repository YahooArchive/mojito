/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true*/
/*global YUI*/


/*
 * Test suite for the tunnel.common.js file functionality.
 */
YUI({useBrowserConsole: true}).use(
    "mojito-tunnel-common",
    "test",
    "json-parse",
    function(Y) {

        var suite = new Y.Test.Suite("mojito-tunnel-common tests");

        suite.add(new Y.Test.Case({
            setUp: function () {
                this.appConfig = {
                    tunnelPrefix: '/tunnel',
                    tunnelTimeout: 10000
                };
                this.tunnelCommon = new Y.mojito.TunnelCommon(this.appConfig);
            },

            "test constructor": function () {
                var tunnelCommon = this.tunnelCommon;

                Y.Assert.areEqual(this.appConfig, tunnelCommon._appConfig);
            },

            "test rpc success": function () {
                var appConfig = this.appConfig,
                    tunnelCommon = this.tunnelCommon,
                    adapter = Y.Mock(),
                    command = {},
                    response = {
                        responseText: Y.JSON.stringify({
                            data: {
                                html: '<div></div>',
                                meta: {
                                    http: {
                                        code: 200
                                    }
                                }
                            }
                        })
                    };

                tunnelCommon._makeRequest = function (url, config) {
                    Y.Assert.isString(url);
                    Y.Assert.areEqual(appConfig.tunnelPrefix, url);
                    Y.Assert.isObject(config);
                    Y.Assert.areEqual('POST', config.method);
                    Y.Assert.areEqual(Y.JSON.stringify(command), config.data);
                    Y.Assert.isFunction(config.on.success);
                    Y.Assert.isFunction(config.on.failure);
                    Y.Assert.areEqual(config.on.scope, tunnelCommon);
                    Y.Assert.areEqual(tunnelCommon, config.context);
                    Y.Assert.areEqual(appConfig.tunnelTimeout, config.timeout);
                    Y.Assert.isObject(config.headers);
                    Y.Assert.areEqual('application/json', config.headers['Content-Type']);
                    config.on.success(null, response);
                };

                Y.Mock.expect(adapter, {
                    method: 'done',
                    args: [Y.Mock.Value.String, Y.Mock.Value.Object],
                    run: function (html, meta) {
                        Y.Assert.areEqual('<div></div>', html);
                        Y.Assert.areEqual(200, meta.http.code);
                    }
                });
                tunnelCommon.rpc(command, adapter);
                Y.Mock.verify(adapter);
            },

            "test rpc failure": function () {
                var appConfig = this.appConfig,
                    tunnelCommon = this.tunnelCommon,
                    adapter = Y.Mock(),
                    command = {},
                    response = {
                        responseText: Y.JSON.stringify({
                            data: {
                                html: '<div></div>',
                                meta: {
                                    http: {
                                        code: 500
                                    }
                                }
                            }
                        })
                    };

                tunnelCommon._makeRequest = function (url, config) {
                    Y.Assert.isString(url);
                    Y.Assert.areEqual(appConfig.tunnelPrefix, url);
                    Y.Assert.isObject(config);
                    Y.Assert.areEqual('POST', config.method);
                    Y.Assert.areEqual(Y.JSON.stringify(command), config.data);
                    Y.Assert.isFunction(config.on.success);
                    Y.Assert.isFunction(config.on.failure);
                    Y.Assert.areEqual(config.on.scope, tunnelCommon);
                    Y.Assert.areEqual(tunnelCommon, config.context);
                    Y.Assert.areEqual(appConfig.tunnelTimeout, config.timeout);
                    Y.Assert.isObject(config.headers);
                    Y.Assert.areEqual('application/json', config.headers['Content-Type']);
                    config.on.failure(null, response);
                };

                Y.Mock.expect(adapter, {
                    method: 'error',
                    args: [Y.Mock.Value.String],
                    run: function (html) {
                        Y.Assert.areEqual('<div></div>', html);
                    }
                });
                tunnelCommon.rpc({}, adapter);
                Y.Mock.verify(adapter);
            }
        }));

        Y.Test.Runner.add(suite);
    }
);
