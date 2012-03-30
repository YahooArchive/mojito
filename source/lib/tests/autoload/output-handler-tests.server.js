/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-output-handler-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        path = require('path'),
        OutputHandler = require(path.join(__dirname, '../../output-handler.server')),
        A = YUITest.Assert,
        OA = YUITest.ObjectAssert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'Server output handling tests',

        'flush call': function() {
            var readMetaCall, writeHeadersCall, writeCalled;
            var oh = new OutputHandler(null, {
                write: function(data) {
                    writeCalled = true;
                    A.isTrue(writeHeadersCall, 'response should not be written until after headers are processed');
                    A.areSame('data', data);
                },
                end: function() {
                    A.fail('flush should never call end()');
                }
            }, null);
            oh._readMeta = function(meta) {
                readMetaCall = true;
                A.areSame('meta', meta);
            };
            oh._writeHeaders = function() {
                writeHeadersCall = true;
                A.isTrue(readMetaCall, 'headers should not be written until after meta is processed');
            };

            oh.flush('data', 'meta');

            A.isTrue(writeCalled, 'write never called');

        },

        'done call': function() {
            var readMetaCall, writeHeadersCall, writeCalled;
            var oh = new OutputHandler(null, {
                write: function() {
                    A.fail('done should call end(), not write()');
                },
                end: function(data) {
                    writeCalled = true;
                    A.isTrue(writeHeadersCall, 'response should not be written until after headers are processed');
                    A.areSame('data', data);
                }
            }, null);
            oh._readMeta = function(meta) {
                readMetaCall = true;
                A.areSame('meta', meta);
            };
            oh._writeHeaders = function() {
                writeHeadersCall = true;
                A.isTrue(readMetaCall, 'headers should not be written until after meta is processed');
            };
            oh.setLogger({log: function() {}});
            
            oh.done('data', 'meta');

            A.isTrue(writeCalled, 'write never called');
        },

        'TODO: error call': function() {
            // TODO: [Issue 99] this is deferred until we get build environments working
            A.skip();
//            var headWritten = false;
//            var writeCalled = false;
//            var nextCalled = false;
//            var oh = new OutputHandler(null, {
//                writeHead: function(code, headers) {
//                    headWritten = true;
//                    A.areSame(500, code, 'bad status code');
//                    OA.areEqual({'content-type':'text/html'}, headers, 'bad headers');
//                },
//                end: function(data) {
//                    writeCalled = true;
//                    A.areSame('<html><body><h1>Error: 500</h1><p>Oh shit!</p></body></html>', data);
//                }
//            }, function() {
//                nextCalled = true;
//            });
//            oh.setLogger({log: function() {}});
//
//            var err = new Error('Oh shit!');
//            err.code = 500;
//
//            oh.error(err);
//
//            A.isTrue(headWritten, 'headers never written');
//            A.isTrue(writeCalled, 'write never called');
//            A.isFalse(nextCalled, 'next() should not be called on error()');
        },

        'TODO: error can be called with nothing': function() {
            // TODO: [Issue 99] this is deferred until we get build environments working
            A.skip();
//            var headWritten = false;
//            var writeCalled = false;
//            var nextCalled = false;
//            var oh = new OutputHandler(null, {
//                writeHead: function(code, headers) {
//                    headWritten = true;
//                    A.areSame(500, code, 'bad status code');
//                    OA.areEqual({'content-type':'text/html'}, headers, 'bad headers');
//                },
//                end: function(data) {
//                    writeCalled = true;
//                    A.areSame('<html><body><h1>Error: 500</h1><p>Unknown error occurred</p></body></html>', data);
//                }
//            }, function() {
//                nextCalled = true;
//            });
//            oh.setLogger({log: function() {}});
//
//            oh.error();
//
//            A.isTrue(headWritten, 'headers never written');
//            A.isTrue(writeCalled, 'write never called');
//            A.isFalse(nextCalled, 'next() should not be called on error()');
        },


        'meta data handling': function() {
            var oh = new OutputHandler(null, null, null);

            oh._readMeta({
                http: {
                    code: 200,
                    headers: {
                        k1: ['1','2','3'],
                        k2: ['hello']
                    }
                }
            });

            A.areSame(200, oh.statusCode, 'bad status code after meta read');
            OA.areEqual(['1','2','3'], oh.headers.k1, 'bad k1 header after meta read');
            OA.areEqual(['hello'], oh.headers.k2, 'bad k1 header after meta read');
        },

        'headers are written when headersSent is false': function() {
            var headWritten;
            var oh = new OutputHandler(null, {
                writeHead: function(code, headers) {
                    headWritten = true;
                    A.areSame(201, code, 'bad status code');
                    A.areSame('headers', headers, 'bad headers');
                }
            }, null);
            oh.statusCode = 201;
            oh.headers = 'headers';

            oh._writeHeaders();

            A.isTrue(headWritten, 'headers never written');
        },

        'headers are written with default status code of 200': function() {
            var headWritten;
            var oh = new OutputHandler(null, {
                writeHead: function(code, headers) {
                    headWritten = true;
                    A.areSame(200, code, 'bad status code');
                    A.areSame('headers', headers, 'bad headers');
                }
            }, null);
            oh.headers = 'headers';

            oh._writeHeaders();

            A.isTrue(headWritten, 'headers never written');
        },

        'headers are not written when headers have already been sent': function() {
            var headWritten = false;
            var oh = new OutputHandler(null, {
                writeHead: function(code, headers) {
                    headWritten = false;
                    A.areSame(201, code, 'bad status code');
                    A.areSame('headers', headers, 'bad headers');
                }
            }, null);
            oh.headersSent = true;
            oh.statusCode = 201;
            oh.headers = 'headers';

            oh._writeHeaders();

            A.isFalse(headWritten, 'headers should not be written');
        }

    }));

    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: []});
