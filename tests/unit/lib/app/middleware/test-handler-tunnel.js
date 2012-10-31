/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-test-extra', 'test', function(Y) {
    var A = Y.Assert,
        AA = Y.ArrayAssert,
        OA = Y.ObjectAssert,
        cases = {},

        factory = require(Y.MOJITO_DIR + 'lib/app/middleware/mojito-handler-tunnel'),
        expandedContext;

    cases = {
        name: 'tunnel handler tests',

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
                    },
                    expandInstanceForEnv: function(env, instance, context, callback) {
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

            A.areEqual(1, callCount, 'next() handler should have been called');
        },

        'test trailing slashes get removed from tunnels uris': function() {
            var store = {
                    getAppConfig: function() {
                        return {
                            obj: 'appConfig',
                            tunnelPrefix: '/mytunnelprefix/'
                        };
                    },
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
                    },
                    expandInstanceForEnv: function(env, instance, context, callback) {
                        expandedContext = context;
                        callback(null, instance);
                    }
                },
                globalLogger = null,
                callCount = 0,
                req = {
                    url: '/notunnel',
                    headers: {}
                };

            this._handler = factory({
                context: {},
                store:  store,
                logger: globalLogger
            });

            this._handler(req, null, function() {
                callCount++;
            });

            A.areEqual(1, callCount, 'next() handler should have been called');
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

            A.isObject(expandedContext, 'Expanded context should be an object');
            A.areEqual('myValue', expandedContext.myKey, 'custom context property should have been preserved');
            A.areEqual('server', expandedContext.runtime, 'context.runtime should have been set to "server"');

            A.areEqual(1, nextCalls, 'next() handler should have been called');
            A.areEqual(0, writeCalls, 'res.writeHead() should have been called');
            A.areEqual(0, endCalls, 'res.end() should have been called');
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

            A.isObject(expandedContext, 'Expanded context should be an object');
            A.areEqual('server', expandedContext.runtime, 'context.runtime should have been set to "server"');

            A.areEqual(1, nextCalls, 'next() handler should have been called');
            A.areEqual(0, writeCalls, 'res.writeHead() should have been called');
            A.areEqual(0, endCalls, 'res.end() should have been called');
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
                        A.areEqual('200', code, 'should have gotten 200');
                        A.areEqual('application/json; charset="utf-8"', headers['content-type'], 'should have gotten application/json, utf-8');
                    },
                    end: function(data) {
                        var expected = {
                            "base": "MojitA:orange"
                        };
                        endCalls++;
                        A.areEqual(Y.JSON.stringify(expected,null,4), data, 'should have gotten spec');
                    }

                };

            this._handler(req, res, function() {
                nextCalls++;
            });

            A.areEqual(0, nextCalls, 'next() handler should not have been called');
            A.areEqual(1, writeCalls, 'res.writeHead() should have been called');
            A.areEqual(1, endCalls, 'res.end() should have been called');
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
                        A.areEqual('200', code, 'should have gotten 200');
                        A.areEqual('application/json; charset="utf-8"', headers['content-type'], 'should have gotten application/json, utf-8');
                    },
                    end: function(data) {
                        var expected = {
                            "base": "MojitA:orange"
                        };
                        endCalls++;
                        A.areEqual(Y.JSON.stringify(expected,null,4), data, 'should have gotten spec');
                    }

                };

            this._handler(req, res, function() {
                nextCalls++;
            });

            A.areEqual(0, nextCalls, 'next() handler should not have been called');
            A.areEqual(1, writeCalls, 'res.writeHead() should have been called');
            A.areEqual(1, endCalls, 'res.end() should have been called');
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
                        A.areEqual('200', code, 'should have gotten 200');
                        A.areEqual('application/json; charset="utf-8"', headers['content-type'], 'should have gotten application/json, utf-8');
                    },
                    end: function(data) {
                        var expected = {
                            "type": "MojitA"
                        };
                        endCalls++;
                        A.areEqual(Y.JSON.stringify(expected,null,4), data, 'should have gotten spec');
                    }

                };

            this._handler(req, res, function() {
                nextCalls++;
            });

            A.areEqual(0, nextCalls, 'next() handler should not have been called');
            A.areEqual(1, writeCalls, 'res.writeHead() should have been called');
            A.areEqual(1, endCalls, 'res.end() should have been called');
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
                        A.areEqual('200', code, 'should have gotten 200');
                        A.areEqual('application/json; charset="utf-8"', headers['content-type'], 'should have gotten application/json, utf-8');
                    },
                    end: function(data) {
                        var expected = {
                            "type": "MojitA"
                        };
                        endCalls++;
                        A.areEqual(Y.JSON.stringify(expected,null,4), data, 'should have gotten spec');
                    }

                };

            this._handler(req, res, function() {
                nextCalls++;
            });

            A.areEqual(0, nextCalls, 'next() handler should not have been called');
            A.areEqual(1, writeCalls, 'res.writeHead() should have been called');
            A.areEqual(1, endCalls, 'res.end() should have been called');
        },

        'ignore:': function () {

        }
    };

    Y.Test.Runner.add(new Y.Test.Case(cases));
});
