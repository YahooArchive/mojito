/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/** WARNING: [Issue 98] THIS TEST IS NEVER RUN IN OUR CURRENT SYSTEM **/

YUI.add('mojito-mojit-proxy-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        _Obj = YUITest.Mock.Value.Object;

    function fakeProxyOptions(o) {
        var strings = ['base', 'viewId', 'instanceId', 'views', 'assetsRoot'],
            objs = ['views', 'client', 'config', 'context'],
            out = {};
        Y.Array.each(strings, function(s) {
            out[s] = o[s] || strings[s];
        });
        Y.Object.each(objs, function(v, k) {
            out[k] = o[k] || v;
        });
        return out;
    }

    suite.add(new YUITest.TestCase({

        name: 'mojit proxy tests',

        'broadcast sends to all listeners': function() {
            var mockClient = new Y.mojito.EasyMock();
            mockClient.expect({
                method: 'doBroadcast',
                args: ['mojit:foo', 'viewId', 'payload']
            });
            var mp = new Y.mojito.MojitProxy(fakeProxyOptions({
                client: mockClient
            }));

            mp.broadcast('foo', 'payload');

            mockClient.verify();
        },

        'Test listen function': function() {

            var mockClient = new Y.mojito.EasyMock();
            mockClient.expect({
                method: 'doListen',
                args: ['mojit:foo', 'event', 'callback']
            });
            var mp = new Y.mojito.MojitProxy(fakeProxyOptions({
                client: mockClient
            }));

            mp.listen('foo', function () {});

            mockClient.verify();
        },

        'Test unlisten function': function() {

            var mockClient = new Y.mojito.EasyMock();
            mockClient.expect({
                method: 'doUnlisten',
                args: ['mojit:foo', 'event', 'callback']
            });
            var mp = new Y.mojito.MojitProxy(fakeProxyOptions({
                client: mockClient
            }));

            mp.unlisten('foo');

            mockClient.verify();
        },

        'Test invoke function': function() {

            var mockClient = new Y.mojito.EasyMock();
            mockClient.expect({
                method: 'executeAction',
                args: ['command', 'id', 'callback']
            });
            var mp = new Y.mojito.MojitProxy(fakeProxyOptions({
                client: mockClient
            }));

            mp.invoke('foo', {}, function () {});

            mockClient.verify();
        },

        'Test refreshView function': function() {

            var mockClient = new Y.mojito.EasyMock();
            mockClient.expect({
                method: 'refreshMojitView',
                args: ['mojit', 'opts', 'callback']
            });
            var mp = new Y.mojito.MojitProxy(fakeProxyOptions({
                client: mockClient
            }));

            mp.refreshView({}, function () {});

            mockClient.verify();
        },

        'Test getFromUrl function': function() {

            var mockClient = new Y.mojito.EasyMock();
            var mp = new Y.mojito.MojitProxy(fakeProxyOptions({
                client: mockClient
            }));

            //  TODO: Need a way to set the window's URL for this test.
            //  Assume 'http://localhost:8666/query?foo=bar'
 
            A.isSame(mp.getFromUrl('foo'), 'bar', 'URL value isn\'t correct');
        },

        'Test destroyChild function': function() {

            var mockClient = new Y.mojito.EasyMock();
            mockClient.expect({
                method: 'destroyMojitProxy',
                args: ['id', 'shouldRetain']
            });
            var mp = new Y.mojito.MojitProxy(fakeProxyOptions({
                client: mockClient
            }));
            mp._viewId = 'foo';

            mockClient._mojits['foo'].children =
                                         {'fooChild' :
                                             {'viewId' : 'iamfoochild'}
                                         };

            mp.destroyChild('iamfoochild', false);

            mockClient.verify();
        },

        'Test destroySelf function': function() {

            var mockClient = new Y.mojito.EasyMock();
            mockClient.expect({
                method: 'destroyMojitProxy',
                args: ['id', 'shouldRetain']
            });
            var mp = new Y.mojito.MojitProxy(fakeProxyOptions({
                client: mockClient
            }));

            mp.destroySelf({}, function () {});

            mockClient.verify();
        }
    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: ['mojito-mojit-proxy']});
