/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-rest-lib-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        OA = YUITest.ObjectAssert;

    suite.add(new YUITest.TestCase({

        name: 'deferring methods',

        'GET call defers to main call function': function() {
            // arrange and mock
            var doRequest = Y.mojito.lib.REST._doRequest;
            var doRequestCalled = false;
            Y.mojito.lib.REST._doRequest = function(method, url, params, config, callback) {
                // assert
                A.areSame('GET', method, 'wrong method');
                A.areSame('url', url, 'wrong url');
                A.areSame('params', params, 'wrong params');
                A.areSame('config', config, 'wrong config');
                A.areSame('callback', callback, 'wrong callback');
                doRequestCalled = true;
            };

            // act
            Y.mojito.lib.REST.GET('url', 'params', 'config', 'callback');

            // assert
            A.isTrue(doRequestCalled, 'doRequest never called');

            // replace mocks
            Y.mojito.lib.REST._doRequest = doRequest;
        },

        'POST call defers to main call function': function() {
            // arrange and mock
            var doRequest = Y.mojito.lib.REST._doRequest;
            var doRequestCalled = false;
            Y.mojito.lib.REST._doRequest = function(method, url, params, config, callback) {
                // assert
                A.areSame('POST', method, 'wrong method');
                A.areSame('url', url, 'wrong url');
                A.areSame('params', params, 'wrong params');
                A.areSame('config', config, 'wrong config');
                A.areSame('callback', callback, 'wrong callback');
                doRequestCalled = true;
            };

            // act
            Y.mojito.lib.REST.POST('url', 'params', 'config', 'callback');

            // assert
            A.isTrue(doRequestCalled, 'doRequest never called');

            // replace mocks
            Y.mojito.lib.REST._doRequest = doRequest;
        },

        'PUT call defers to main call function': function() {
            // arrange and mock
            var doRequest = Y.mojito.lib.REST._doRequest;
            var doRequestCalled = false;
            Y.mojito.lib.REST._doRequest = function(method, url, params, config, callback) {
                // assert
                A.areSame('PUT', method, 'wrong method');
                A.areSame('url', url, 'wrong url');
                A.areSame('params', params, 'wrong params');
                A.areSame('config', config, 'wrong config');
                A.areSame('callback', callback, 'wrong callback');
                doRequestCalled = true;
            };

            // act
            Y.mojito.lib.REST.PUT('url', 'params', 'config', 'callback');

            // assert
            A.isTrue(doRequestCalled, 'doRequest never called');

            // replace mocks
            Y.mojito.lib.REST._doRequest = doRequest;
        },

        'DELETE call defers to main call function': function() {
            // arrange and mock
            var doRequest = Y.mojito.lib.REST._doRequest;
            var doRequestCalled = false;
            Y.mojito.lib.REST._doRequest = function(method, url, params, config, callback) {
                // assert
                A.areSame('DELETE', method, 'wrong method');
                A.areSame('url', url, 'wrong url');
                A.areSame('params', params, 'wrong params');
                A.areSame('config', config, 'wrong config');
                A.areSame('callback', callback, 'wrong callback');
                doRequestCalled = true;
            };

            // act
            Y.mojito.lib.REST.DELETE('url', 'params', 'config', 'callback');

            // assert
            A.isTrue(doRequestCalled, 'doRequest never called');

            // replace mocks
            Y.mojito.lib.REST._doRequest = doRequest;
        },

        'HEAD call defers to main call function': function() {
            // arrange and mock
            var doRequest = Y.mojito.lib.REST._doRequest;
            var doRequestCalled = false;
            Y.mojito.lib.REST._doRequest = function(method, url, params, config, callback) {
                // assert
                A.areSame('HEAD', method, 'wrong method');
                A.areSame('url', url, 'wrong url');
                A.areSame('params', params, 'wrong params');
                A.areSame('config', config, 'wrong config');
                A.areSame('callback', callback, 'wrong callback');
                doRequestCalled = true;
            };

            // act
            Y.mojito.lib.REST.HEAD('url', 'params', 'config', 'callback');

            // assert
            A.isTrue(doRequestCalled, 'doRequest never called');

            // replace mocks
            Y.mojito.lib.REST._doRequest = doRequest;
        }

    }));

    suite.add(new YUITest.TestCase({

        name: 'y.io',

        'doRequest defers to Y.io with proper method': function() {
            // arrange
            var io = Y.io;
            var ioCalled = false;
            Y.io = function(url, opts) {
                A.isObject(opts, 'io was not sent an options object');
                A.areSame('method', opts.method, 'bad http method to y.io');
                ioCalled = true;
            };

            // act
            Y.mojito.lib.REST._doRequest('method');

            // assert
            A.isTrue(ioCalled, 'io never called');

            // replace mocks
            Y.io = io;
        },

        'doRequest defers to Y.io with proper url': function() {
            // arrange
            var io = Y.io;
            var ioCalled = false;
            Y.io = function(url) {
                A.areSame('url', url, 'bad url to y.io');
                ioCalled = true;
            };

            // act
            Y.mojito.lib.REST._doRequest('', 'url');

            // assert
            A.isTrue(ioCalled, 'io never called');

            // replace mocks
            Y.io = io;
        },

        'doRequest defers to Y.io with proper params data': function() {
            // arrange
            var io = Y.io;
            var ioCalled = false;
            Y.io = function(url, opts) {
                A.areSame('/x/?params', url, 'params added to URL');
                ioCalled = true;
            };

            // act
            Y.mojito.lib.REST._doRequest('GET', '/x/', 'params');

            // assert
            A.isTrue(ioCalled, 'io never called');

            // replace mocks
            Y.io = io;
        },

        'doRequest defers to Y.io with proper config data': function() {
            // arrange
            var io = Y.io;
            var ioCalled = false;
            var headers = {headers:'yo'};
            Y.io = function(url, opts) {
                A.areSame(47, opts.timeout, 'bad timeout to y.io');
                OA.areEqual(headers, opts.headers);
                ioCalled = true;
            };

            // act
            Y.mojito.lib.REST._doRequest('', '', '', {
                timeout: 47,
                headers: headers,
                proxy: 'proxy'
            });

            // assert
            A.isTrue(ioCalled, 'io never called');

            // replace mocks
            Y.io = io;
        }

    }));

    suite.add(new YUITest.TestCase({

        name: 'callback',

        'callback is called without err on Y.io success': function() {
            // arrange
            var io = Y.io;
            var cbCalled = false;
            Y.io = function(url, opts) {
                opts.on.success();
            };

            // act
            Y.mojito.lib.REST._doRequest('', '', '', '', function(err) {
                A.isNull(err, 'err object within callback should be null on success');
                cbCalled = true;
            });

            // assert
            A.isTrue(cbCalled, 'success callback never called');

            // replace mocks
            Y.io = io;
        },

        'callback is called with proper response object on Y.io success': function() {
            // arrange
            var io = Y.io;
            var cbCalled = false;
            Y.io = function(url, opts) {
                opts.on.success(1234, {
                    status: 200,
                    statusText: 'Success',
                    getResponseHeader: function(key) {
                        A.areSame('hkey', key, 'bad header key');
                        return 'got one header';
                    },
                    getResponseHeaders: function() {
                        return 'got all headers';
                    },
                    getAllResponseHeaders: function() {
                        return 'got all headers';
                    },
                    responseText: 'the response body'
                });
            };

            // act
            Y.mojito.lib.REST._doRequest('', '', '', '', function(err, resp) {
                A.isFunction(resp.getStatusCode, 'response missing getStatusCode function');
                A.isFunction(resp.getStatusMessage, 'response missing getStatusMessage function');
                A.isFunction(resp.getHeader, 'response missing getHeader function');
                A.isFunction(resp.getHeaders, 'response missing getHeaders function');
                A.isFunction(resp.getBody, 'response missing getBody function');
                A.areSame(200, resp.getStatusCode(), 'bad status code');
                A.areSame('Success', resp.getStatusMessage(), 'bad status message');
                A.areSame('got one header', resp.getHeader('hkey'), 'bad response header value');
                A.areSame('got all headers', resp.getHeaders(), 'bad response headers value');
                A.areSame('the response body', resp.getBody(), 'bad response body');
                cbCalled = true;
            });

            // assert
            A.isTrue(cbCalled, 'success callback never called');

            // replace mocks
            Y.io = io;
        },

        'callback is called with err on Y.io failure with proper error status and message': function() {
            // arrange
            var io = Y.io;
            var cbCalled = false;
            var error = {status:503, statusText:'Wicked Error'};
            Y.io = function(url, opts) {
                opts.on.failure(1234 /* tx id */, error);
            };

            // act
            Y.mojito.lib.REST._doRequest('', '', '', '', function(err, data) {
                A.isObject(err, 'err object was not populated');
                OA.areEqual(error, err, 'wrong error object');
                cbCalled = true;
            });

            // assert
            A.isTrue(cbCalled, 'success callback never called');

            // replace mocks
            Y.io = io;
        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: ['mojito-rest-lib']});
