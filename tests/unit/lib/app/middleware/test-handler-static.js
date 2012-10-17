/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-test-extra', 'test', function(Y) {
    var A = Y.Assert,
        OA = Y.ObjectAssert,
        cases = {},
        store,
        urlRess,
        factory = require(Y.MOJITO_DIR + 'lib/app/middleware/mojito-handler-static');

    urlRess = {
        "/compiled.css": {
            mime: {
                type: 'text/css',
                charset: 'UTF-8'
            }
        },
        "/favicon.ico": {
            mime: {
                type: 'image/vnc.microsoft.com'
            }
        },
        "/robots.txt": {
            mime: {
                type: 'text/plain',
                charset: 'UTF-8'
            }
        },
        "/crossdomain.xml": {
            mime: {
                type: 'text/xml',
                charset: 'UTF-8'
            }
        }
    };
    cases = {
        name: 'static handler tests',

        _handler: null,

        setUp: function() {
            store = {
                getAppConfig: function() { return { obj: 'appConfig' }; },
                getAllURLResources: function () {
                    return urlRess;
                },
                getResourceContent: function (args, callback) {
                    var content, stat;
                    content = new Buffer('1234567890');
                    stat = {
                        mtime: new Date(),
                        ctime: new Date(),
                        // this size is different from the data.length since it is suppose to be
                        // the original size of the compiled buffer
                        size: 5
                    };
                    callback(undefined, content, stat);
                },
                getStaticAppConfig: function() {
                    return {
                        staticHandling: {
                            cache: false,
                            maxAge: null
                        }
                    };
                },
                getResources: function(env, ctx, filter) {
                    return [{ filter: filter }];
                }
            };

            this._handler = factory({
                context: {},
                store:  store,
                logger: {
                    log: function() {}
                }
            });
        },


        tearDown: function() {
            this._handler = null;
        },


        'handler calls next() when HTTP method is not HEAD or GET': function() {
            var callCount = 0;
            this._handler({
                    url: '/foo',
                    method: 'PUT'
                }, null, function() {
                callCount++;
            });
            this._handler({
                    url: '/bar',
                    method: 'POST'
                }, null, function() {
                callCount++;
            });
            A.areEqual(2, callCount, 'next() handler should have been called');
        },


        'handler detects forbidden calls': function() {
            var callCount = 0,
                errorCode,
                end,
                req = {
                    url: '/foo/../bar.css',
                    method: 'GET'
                },
                res = {
                    writeHead: function (c) {
                        errorCode = c;
                    },
                    end: function () {
                        end = true;
                    }
                };

            this._handler(req, res, function() {
                callCount++;
            });
            A.areEqual(0, callCount, 'next() should not be called after a forbidden request.');
            A.areEqual(403, errorCode, 'invalid error code for forbidden request.');
            A.isTrue(end, 'res.end() should be called after a forbidden request.');
        },


        'handler calls next() when URL is not in RS hash': function() {
            var callCount = 0;
            this._handler({
                    url: '/foo',
                    method: 'GET'
                }, null, function() {
                callCount++;
            });
            A.areEqual(1, callCount, 'next() handler should have been called');
        },


        'ignore: handler uses cache when possible': function () {
        },


        'ignore: handler reads from disk when needed': function () {
        },


        'ignore: handler supports forceUpdate option to facilitate development': function () {
        },


        'handler supports compiled resources': function () {
            var req = {
                    url: '/compiled.css',
                    method: 'GET',
                    headers: {}
                },
                res = {
                    writeHead: function(code, header) {
                        resCode = code;
                        resHeader = header;
                    },
                    end: function() {
                        end = true;
                    }
                },
                resCode,
                resHeader,
                end,
                callCount = 0;

            this._handler(req, res, function() {
                callCount++;
            });

            A.areEqual(0, callCount, 'next() handler should have not been called');
            A.isTrue(end, 'res.end() should be called after serving a compiled response.');
            A.areEqual(10, resHeader['Content-Length'], 'the buffer header should dictate the content-length');
        },

        'handler detects well known files': function() {

            var req,
                res,
                handler,
                resourceContentCalled = false,
                urls,
                i,
                getResourceContentFn,
                callCount;


            getResourceContentFn = store.getResourceContent;
            urls = ['/robots.txt', '/crossdomain.xml', '/favicon.ico'];
            ress = [
                'asset-txt-robots',
                'asset-xml-crossdomain',
                'asset-ico-favicon'
            ];
            req = {
                url: '/robots.txt',
                method: 'GET',
                headers: {}
            };
            res = {
                writeHead: function(code, header) {
                },
                end: function() {
                }
            }


            for (i = 0; i < urls.length; i += 1) {
                callCount = 0;
                resourceContentCalled = false;
                req.url = urls[i];
                handler = factory({
                    context: {},
                    store:  store,
                    logger: {
                        log: function() {}
                    }
                });
                store.getResourceContent = function(resource, cb) {
                    OA.areEqual(urlRess[req.url], resource, 'wrong resource');
                    resourceContentCalled = true;
                };
                handler(req, res, function() {
                    callCount++;
                });
                A.isTrue(0 === callCount, 'next() handler should not have been called')
                A.isTrue(resourceContentCalled, 'getResourceContent was not called for url: ' + req.url);
            }

            store.getResourceContent = getResourceContentFn;
        },

        'handler deals with resources correctly': function() {
            var req,
                resp,
                getResourcesFn,
                getAllURLResourcesFn,
                getResourceContentFn,
                handler,
                mockResources;

            mockResources = {
                "/robots.txt": { 
                    mime: { type: 'text/html' }
                }
            };
            getResourceContentFn = store.getResourceContent;
            getAllURLResourcesFn = store.getAllURLResources;
            getResourcesFn = store.getResources;

            req = {
                url: '/robots.txt',
                method: 'GET',
                headers: {}
            };
            resp = {
                writeHeader: function() { },
                end: function() { }
            }

            // 
            // handle res of type obj
            store.getAllURLResources = function() {
                return mockResources;
            };
            store.getResources = function() {
                return [];
            };
            store.getResourceContent = function(res, cb) {
                OA.areEqual(mockResources["/robots.txt"], res, 'wrong resource');
            };

            handler = factory({
                store: store,
                context: {},
                logger: { log: function() {} }
            });

            handler(req, resp, function() {
                A.fail('next() handler 1 should not have been called');
            });

            //
            // handle res of type array
            store.getAllURLResources = function() {
                return {};
            };
            store.getResources = function() {
                return [mockResources["/robots.txt"]];
            };
            store.getResourceContent = function(res, cb) {
                OA.areEqual(mockResources["/robots.txt"], res, 'wrong resource');
            };

            handler = factory({
                store: store,
                context: {},
                logger: { log: function() {} }
            });

            handler(req, resp, function() {
                A.fail('next() handler 2 should not have been called');
            });

            store.getResources = getResourcesFn;
            store.getResourceContent = getResourceContentFn;
            store.getAllURLResources = getAllURLResourcesFn;
        }
    };

    Y.Test.Runner.add(new Y.Test.Case(cases));
});
