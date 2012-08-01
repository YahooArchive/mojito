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
        },


        'support Y.Model': function() {
            var options,
                context;
            options = {
                Y: {
                    mojito: {
                        controller: {},
                        models: {
                            foo: function() {}
                        }
                    }
                },
                instance: {},
                dispatch: function() {},
                store: {
                    getAppConfig: function() { return {}; }
                }
            };
            context = new Y.mojito.ControllerContext(options);
            A.areSame(options.Y.mojito.models.foo, context.models.foo);
        }


    }));

    YUITest.TestRunner.add(suite);

}, '0.1.0', {requires: ['mojito-controller-context']});
