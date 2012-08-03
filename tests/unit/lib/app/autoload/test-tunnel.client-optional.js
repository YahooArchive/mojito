/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true*/
/*global YUI*/


/*
 * Test suite for the tunnel.client-optional.js file functionality.
 */
YUI({useBrowserConsole: true}).use(
    "mojito-tunnel-client",
    "test",
    function(Y) {

        var suite = new Y.Test.Suite("mojito-tunnel-client tests");

        suite.add(new Y.Test.Case({
            setUp: function () {
                this.appConfig = {};
                this.transport = Y.Mock();
                Y.Dali.beanRegistry.registerBean('transport', this.transport);
                this.tunnelClient = new Y.mojito.TunnelClient(this.appConfig);
            },

            "test constructor": function () {
                var tunnelClient = this.tunnelClient;

                Y.Assert.areEqual(this.appConfig, tunnelClient._appConfig);
                Y.Assert.isTrue(Y.Dali.beanRegistry.isInjected);
                Y.Assert.isObject(Y.Dali.beanRegistry.beans);
                Y.Assert.isObject(Y.Dali.beanRegistry.beans.errorReporter);
                Y.Assert.isObject(Y.Dali.beanRegistry.beans.configProvider);
                Y.Assert.areEqual(this.transport, tunnelClient._transport);
            },

            "test rpc success": function () {
                var tunnelClient = this.tunnelClient,
                    transport = this.transport,
                    adapter = Y.Mock(),
                    response = {
                        html: '<div></div>',
                        data: {
                            meta: {
                                http: {
                                    code: 200
                                }
                            }
                        }
                    };

                Y.Mock.expect(transport, {
                    method: 'makeRequest',
                    args: [Y.Mock.Value.Object, Y.Mock.Value.Object],
                    run: function (command, options) {
                        Y.Assert.isObject(command);
                        Y.Assert.isTrue(command.forcepost);
                        Y.Assert.isObject(options);
                        Y.Assert.isFunction(options.success);
                        Y.Assert.isFunction(options.failure);
                        options.success(response);
                    }
                });

                Y.Mock.expect(adapter, {
                    method: 'done',
                    args: [Y.Mock.Value.String, Y.Mock.Value.Object],
                    run: function (html, meta) {
                        Y.Assert.areEqual('<div></div>', html);
                        Y.Assert.areEqual(response.data.meta, meta);
                    }
                });
                tunnelClient.rpc({}, adapter);
                Y.Mock.verify(adapter);
                Y.Mock.verify(transport);
            },

            "test rpc failure": function () {
                var tunnelClient = this.tunnelClient,
                    transport = this.transport,
                    adapter = Y.Mock(),
                    response = {
                        html: '<div></div>',
                        data: {
                            meta: {
                                http: {
                                    code: 500
                                }
                            }
                        }
                    };

                Y.Mock.expect(transport, {
                    method: 'makeRequest',
                    args: [Y.Mock.Value.Object, Y.Mock.Value.Object],
                    run: function (command, options) {
                        Y.Assert.isObject(command);
                        Y.Assert.isTrue(command.forcepost);
                        Y.Assert.isObject(options);
                        Y.Assert.isFunction(options.success);
                        Y.Assert.isFunction(options.failure);
                        options.failure(response);
                    }
                });

                Y.Mock.expect(adapter, {
                    method: 'error',
                    args: [Y.Mock.Value.String],
                    run: function (html) {
                        Y.Assert.areEqual('<div></div>', html);
                    }
                });
                tunnelClient.rpc({}, adapter);
                Y.Mock.verify(adapter);
                Y.Mock.verify(transport);
            }
        }));

        Y.Test.Runner.add(suite);
    }
);
