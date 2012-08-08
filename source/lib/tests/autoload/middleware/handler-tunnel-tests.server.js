/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-middleware-handler-tunnel-tests', function(Y, NAME) {

    var Assert = YUITest.Assert,
        suite = new YUITest.TestSuite(NAME),
        path = require('path'),
        factory = require(path.join(__dirname, '../../../app/middleware/mojito-handler-tunnel')),
        expandedContext;

    suite.add(new YUITest.TestCase({

        name: 'handler tests',

        _handler: null,

        setUp: function() {
            var store = {
                    getAppConfig: function() { return { obj: 'appConfig' }; },
                    getSpec: function(env, id, ctx, cb) {
                        cb(null, {
                            env: env,
                            id: id,
                            ctx: ctx
                        });
                    },
                    getType: function(env, type, ctx, cb) {
                        cb(null, {
                            env: env,
                            type: type,
                            ctx: ctx
                        });
                    },
                    expandInstance: function(instance, context, callback) {
                        expandedContext = context;
                        callback(null, instance);
                    }
                },
                globalLogger = null;

            this._handler = factory({
                context: {},
                store:  store, 
                logger: globalLogger
            });

        },

        tearDown: function() {
            this._handler = null;
            expandedContext = null;
        },

        'handler calls next() when tunnel url or HTTP header not present': function() {
            var callCount = 0,
                req = {
                    url: '/notunnel',
                    headers: {}
                };

            this._handler(req, null, function() {
                callCount++;
            });

            Assert.areEqual(1, callCount, 'next() handler should have been called');
        },

        'handler should override execution context to server (with /tunnel prefix)': function() {
            var nextCalls = 0, writeCalls = 0, endCalls = 0,
                req = {
                    'url': '/tunnel',
                    'method': 'POST',
                    'body': {
                        'context': {
                            'runtime': 'client',
                            'myKey': 'myValue'
                        }
                    }
                },
                res = {
                };

            this._handler(req, res, function() {
                nextCalls++;
            });

            Assert.isObject(expandedContext, 'Expanded context should be an object');
            Assert.areEqual('myValue', expandedContext.myKey, 'custom context property should have been preserved');
            Assert.areEqual('server', expandedContext.runtime, 'context.runtime should have been set to "server"');

            Assert.areEqual(1, nextCalls, 'next() handler should have been called');
            Assert.areEqual(0, writeCalls, 'res.writeHead() should have been called');
            Assert.areEqual(0, endCalls, 'res.end() should have been called');
        },

        'handler should set execution context to server (with /tunnel prefix)': function() {
            var nextCalls = 0, writeCalls = 0, endCalls = 0,
                req = { 
                    'url': '/tunnel',
                    'method': 'POST',
                    'body': {
                        'reqs': [{
                            'data': {}
                        }]
                    }
                },
                res = {
                };

            this._handler(req, res, function() {
                nextCalls++;
            });

            Assert.isObject(expandedContext, 'Expanded context should be an object');
            Assert.areEqual('server', expandedContext.runtime, 'context.runtime should have been set to "server"');

            Assert.areEqual(1, nextCalls, 'next() handler should have been called');
            Assert.areEqual(0, writeCalls, 'res.writeHead() should have been called');
            Assert.areEqual(0, endCalls, 'res.end() should have been called');
        },

        'handles specs (with /tunnel prefix)': function() {
            var nextCalls = 0, writeCalls = 0, endCalls = 0;
                req = {
                    url: '/tunnel/static/MojitA/specs/orange.json',
                    headers: { 'x-mojito-header': 'tunnel' }
                },
                res = {
                    writeHead: function(code, headers) {
                        writeCalls++;
                        Assert.areEqual('200', code, 'should have gotten 200');
                        Assert.areEqual('application/json; charset="utf-8"', headers['content-type'], 'should have gotten application/json, utf-8');
                    },
                    end: function(data) {
                        var expected = {
                            "env": "client",
                            "id": "MojitA:orange"
                        };
                        endCalls++;
                        Assert.areEqual(Y.JSON.stringify(expected,null,4), data, 'should have gotten spec');
                    }

                };

            this._handler(req, res, function() {
                nextCalls++;
            });

            Assert.areEqual(0, nextCalls, 'next() handler should not have been called');
            Assert.areEqual(1, writeCalls, 'res.writeHead() should have been called');
            Assert.areEqual(1, endCalls, 'res.end() should have been called');
        },

        'handles specs (no /tunnel prefix)': function() {
            var nextCalls = 0, writeCalls = 0, endCalls = 0;
                req = {
                    url: '/static/MojitA/specs/orange.json',
                    headers: { 'x-mojito-header': 'tunnel' }
                },
                res = {
                    writeHead: function(code, headers) {
                        writeCalls++;
                        Assert.areEqual('200', code, 'should have gotten 200');
                        Assert.areEqual('application/json; charset="utf-8"', headers['content-type'], 'should have gotten application/json, utf-8');
                    },
                    end: function(data) {
                        var expected = {
                            "env": "client",
                            "id": "MojitA:orange"
                        };
                        endCalls++;
                        Assert.areEqual(Y.JSON.stringify(expected,null,4), data, 'should have gotten spec');
                    }

                };

            this._handler(req, res, function() {
                nextCalls++;
            });

            Assert.areEqual(0, nextCalls, 'next() handler should not have been called');
            Assert.areEqual(1, writeCalls, 'res.writeHead() should have been called');
            Assert.areEqual(1, endCalls, 'res.end() should have been called');
        },

        'handles type (with /tunnel prefix)': function() {
            var nextCalls = 0, writeCalls = 0, endCalls = 0;
                req = {
                    url: '/tunnel/static/MojitA/definition.json?x=y',
                    headers: { 'x-mojito-header': 'tunnel' }
                },
                res = {
                    writeHead: function(code, headers) {
                        writeCalls++;
                        Assert.areEqual('200', code, 'should have gotten 200');
                        Assert.areEqual('application/json; charset="utf-8"', headers['content-type'], 'should have gotten application/json, utf-8');
                    },
                    end: function(data) {
                        var expected = {
                            "env": "client",
                            "type": "MojitA"
                        };
                        endCalls++;
                        Assert.areEqual(Y.JSON.stringify(expected,null,4), data, 'should have gotten spec');
                    }

                };

            this._handler(req, res, function() {
                nextCalls++;
            });

            Assert.areEqual(0, nextCalls, 'next() handler should not have been called');
            Assert.areEqual(1, writeCalls, 'res.writeHead() should have been called');
            Assert.areEqual(1, endCalls, 'res.end() should have been called');
        },

        'handles type (no /tunnel prefix)': function() {
            var nextCalls = 0, writeCalls = 0, endCalls = 0;
                req = {
                    url: '/static/MojitA/definition.json',
                    headers: { 'x-mojito-header': 'tunnel' }
                },
                res = {
                    writeHead: function(code, headers) {
                        writeCalls++;
                        Assert.areEqual('200', code, 'should have gotten 200');
                        Assert.areEqual('application/json; charset="utf-8"', headers['content-type'], 'should have gotten application/json, utf-8');
                    },
                    end: function(data) {
                        var expected = {
                            "env": "client",
                            "type": "MojitA"
                        };
                        endCalls++;
                        Assert.areEqual(Y.JSON.stringify(expected,null,4), data, 'should have gotten spec');
                    }

                };

            this._handler(req, res, function() {
                nextCalls++;
            });

            Assert.areEqual(0, nextCalls, 'next() handler should not have been called');
            Assert.areEqual(1, writeCalls, 'res.writeHead() should have been called');
            Assert.areEqual(1, endCalls, 'res.end() should have been called');
        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1');
