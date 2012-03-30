/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-analytics-addon-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        OA = YUITest.ObjectAssert,
        _Func = YUITest.Mock.Value.Function,
        _Obj = YUITest.Mock.Value.Object;
        _Str = YUITest.Mock.Value.String;

    suite.add(new YUITest.TestCase({
        
        name: 'analytics addon tests',
        
        'Test setMergeFunction function': function() {

            var analyticsValue1 = {'foo': 'bar'};
            var analyticsValue2 = {'foo': 'baz'};

            var testStore = {};

            var mockAc = {};

            //  First, we do a store/retrieve cycle using the standard
            //  merge function (which is preconfigured by the analytics
            //  addon to be Y.mojito.util.metaMerge). It will *NOT*
            //  overlay values.

            mockAc.meta = new Y.mojito.EasyMock();

            mockAc.meta.expect({
                method: 'store',
                args: [_Str, _Obj],
                callCount: 2,
                run: function(key, val) {
                    testStore[key] = val;
                }
            }, {
                method: 'retrieve',
                args: [_Func, undefined],
                run: function(cb) {
                    cb(testStore);
                }
            });

            var retrieved;
            var addon = new Y.mojito.addons.ac.analytics(null, null, mockAc);

            addon.store(analyticsValue1);
            addon.store(analyticsValue2);

            addon.retrieve(function(val) {
                retrieved = val;
            });

            mockAc.meta.verify();

            A.areEqual(retrieved['foo'], 'bar', 'got wrong value');

            //  ---------------

            //  Then, we do a store/retrieve cycle using a custom
            //  merge function. It will *ALWAYS* overlay values.

            //  Reset the store and the mock
            testStore = {};
            mockAc = {};

            mockAc.meta = new Y.mojito.EasyMock();

            mockAc.meta.expect({
                method: 'store',
                args: [_Str, _Obj],
                callCount: 2,
                run: function(key, val) {
                    testStore[key] = val;
                }
            }, {
                method: 'retrieve',
                args: [_Func, undefined],
                run: function(cb) {
                    cb(testStore);
                }
            });

            addon = new Y.mojito.addons.ac.analytics(null, null, mockAc);
            addon.setMergeFunction(
                    function(to, from, clobber) {
                        var k;
                        for (k in from) {
                            to[k] = from[k];
                        }
                        return to;
                    });

            addon.store(analyticsValue1);
            addon.store(analyticsValue2);

            addon.retrieve(function(val) {
                retrieved = val;
            });

            mockAc.meta.verify();

            A.areEqual(retrieved['foo'], 'baz', 'got wrong value');
        },

        'stored analytics defers to meta addon for store and retrieve': function() {
            var analyticsValue = {foo: 'bar'};
            var mockAc = {};
            mockAc.meta = new Y.mojito.EasyMock();

            mockAc.meta.expect({
                method: 'store',
                args: ['analytics', _Obj],
                run: function(key, val) {
                    OA.areEqual(analyticsValue, val, 'wrong value sent to meta.store');
                }
            }, {
                method: 'retrieve',
                args: [_Func, undefined],
                run: function(cb) {
                    cb({analytics: 'result'});
                }
            });

            var retrieved;
            var addon = new Y.mojito.addons.ac.analytics(null, null, mockAc);

            addon.store(analyticsValue);
            addon.retrieve(function(val) {
                retrieved = val;
            });

            mockAc.meta.verify();
            A.areEqual('result', retrieved, 'wrong retrieved meta value');
        }
        
    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-analytics-addon']});
