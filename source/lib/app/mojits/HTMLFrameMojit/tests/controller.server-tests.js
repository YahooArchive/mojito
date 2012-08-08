/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, node:true*/

YUI.add('HTMLFrameMojit-tests', function(Y, NAME) {

    var pathlib = require('path'),
        mojitoPath = pathlib.join(__dirname, '../..'),
        targetMojitoPath = mojitoPath,
        fwTestsRoot = pathlib.join(targetMojitoPath, 'tests'),
        YUITest = require('yuitest').YUITest,
        suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert;

    suite.add(new YUITest.TestCase({

        name: 'HTMLFrameMojit user tests',

        'test ctor()': function() {
            var controller = new Y.mojit.test.HTMLFrameMojit.controller(
                {
                    assetManager: {x: 'y'}
                }
            );
            A.isNotNull(controller);
            A.isFunction(controller.index);
            Y.mojit.test.areEqualRecursive({ assetManager: {x: 'y'} },
                controller._cfg);
            A.isInstanceOf(Y.mojito.AssetManager, controller._assetMgr);
            Y.mojit.test.areEqualRecursive({x: 'y'}, controller._assetMgr._cfg);

            controller = new Y.mojit.test.HTMLFrameMojit.controller({
                assets: [
                    'a',
                    {
                        type: 'blob',
                        location: 'top',
                        content: 'b'
                    },
                    'c'
                ]
            });
            A.areEqual("b\n", controller._assetMgr.getAssets('top'));
            A.areEqual("a\nc\n", controller._assetMgr.getAssets('bottom'));
        },

        'test index()': function() {

            var controller = new Y.mojit.test.HTMLFrameMojit.controller({
                child: 'child-1'
            }),
                dispatchCalled,
                doneCalled,
                ac = {
                    params: function() {
                        return { count: 5, size: 'small' };
                    },
                    dispatch: function(child, action, params, cbs) {
                        dispatchCalled = {
                            child: child,
                            action: action,
                            params: params,
                            cbs: Y.Object.keys(cbs)
                        };
                        // do what a child would:
                        cbs.addAsset('blob', 'top', 'a');
                        cbs.addAsset('blob', 'bottom', 'b');
                        cbs.done('orange', 'red');
                    },
                    done: function(data, viewMeta) {
                        doneCalled = {
                            data: data,
                            viewMeta: viewMeta
                        };
                    },
                    addAsset: function(type, location, content) {
                        A.fail("HTMLFrameMojit called it's ac.addAsset()");
                    }
                };

            controller.index(ac);
            Y.mojit.test.areEqualRecursive({
                child: 'child-1',
                action: 'index',
                params: { count: 5, size: 'small' },
                cbs: [ 'flush', 'done', 'addAsset' ]
            }, dispatchCalled);
            Y.mojit.test.areEqualRecursive({
                data: {
                    mojito_version: '0.1.0',
                    assets_top: "a\n",
                    assets_bottom: "b\n",
                    child: 'orange'
                },
                viewMeta: undefined
            }, doneCalled);
        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.1.0', {requires: ['mojito-test', 'HTMLFrameMojit']});
