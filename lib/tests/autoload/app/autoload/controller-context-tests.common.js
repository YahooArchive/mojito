/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-controller-context-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        OA = YUITest.ObjectAssert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'instantiation',

        setUp: function() {

        },

        tearDown: function() {

        },

        'TODO: controller context caches controller instance between actions': function() {
//            var mockInstance = {};
//            var mockYUIInst = Y.mojito.EasyMock();
//            var mockCommand = {
//                action: 'consumePeanuts'
//            };
//
//            var cc = new Y.mojito.ControllerContext({
//                instance: mockInstance,
//                Y: mockYUIInst
//            });
//
//            cc.invoke(mockCommand);
//
//            mockYUIInst.verify();
            A.skip();
        }

    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.1.0', {requires: ['mojito-controller-context']});
