/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-partial-addon-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        path = require('path'),
        fixtures = path.join(__dirname, '../../../../fixtures/store'),
        Assert = YUITest.Assert,
        ObjectAssert = YUITest.ObjectAssert,
        Mock = YUITest.Mock,
        logger = { 
            log: function() {}
        };

    suite.add(new YUITest.TestCase({
    
        name: 'render() tests',
        
        'callback called with error when view is not found': function() {
            var ac = {},
                command = {
                    instance: {
                        views: {}
                    }
                };

            var mockCallback = Mock();
            Mock.expect(mockCallback, {
                method: 'callback',
                args: ['View "missingView" not found']
            });

            var addon = new Y.mojito.addons.ac.partial(command, null, ac);
            addon.render(null, 'missingView', mockCallback.callback);

            Mock.verify(mockCallback);
        },

        'correctly invokes named view engine': function() {
            var ac = {},
                data = { key: 'value' },
                command = {
                    instance: {
                        type: 'myInstanceType',
                        views: {
                            myView: {
                                engine: 'myViewEngine',
                                'content-path': 'myContentPath'
                            }
                        }
                    }
                };

            var addon = new Y.mojito.addons.ac.partial(command, null, ac);

            var mockRenderer = Mock();
            Mock.expect(mockRenderer, {
                method: 'render',
                args: [data, 'myInstanceType', 'myContentPath', Mock.Value.Object, Mock.Value.Object]
            });

            var mockYMojito = Mock();
            Mock.expect(mockYMojito, {
                method: 'ViewRenderer',
                args: ['myViewEngine'],
                returns: mockRenderer
            });

            var yMojito = Y.mojito;
            Y.mojito = mockYMojito;

            addon.render(data, 'myView', null);

            Y.mojito = yMojito;

            Mock.verify(mockYMojito);
            Mock.verify(mockRenderer);
        },

        'passes a valid adapter to the view engine': function() {
            var ac = {},
                command = {
                    instance: {
                        views: {
                            myView: {}
                        }
                    }
                };

            var mockCallback = Mock();
            Mock.expect(mockCallback, {
                method: 'callback',
                args: [null, 'flushdone']
            });

            var yMojitoViewRenderer = Y.mojito.ViewRenderer;
            Y.mojito.ViewRenderer = function() {
                this.render = function(a, b, c, adapter, d) {
                    adapter.flush('flush');
                    adapter.done('done');
                };
            };

            var addon = new Y.mojito.addons.ac.partial(command, null, ac);
            addon.render(null, 'myView', mockCallback.callback);

            Y.mojito.ViewRenderer = yMojitoViewRenderer;

            Mock.verify(mockCallback);
        }

    }));

    suite.add(new YUITest.TestCase({
    
        name: 'invoke() tests',

        'populates command object for dispatch': function() {
            var command = {
                    instance: {
                        base: 'myBase',
                        type: 'myType'
                    }
                },
                options = {
                    params: { key: 'value' }
                };

            var mockDispatch = Mock();
            Mock.expect(mockDispatch, {
                method: 'dispatch',
                args: [
                    Mock.Value(function(arg) {
                        Assert.areEqual(arg.instance.base, 'myBase', 'Expected instance.base of the command the addon was created with');
                        Assert.areEqual(arg.instance.type, 'myType', 'Expected instance.type of the command the addon was created with');
                        Assert.areEqual(arg.action, 'myAction', 'Expected the action passed to invoke()');
                        Assert.areEqual(arg.context, 'myContext', 'Expected the ac.context the addon was created with');
                        Assert.areSame(arg.params, options.params, 'Expected the options.params passed to invoke()');
                    }),
                    Mock.Value.Object
                ]
            });
            var ac = {
                command: command,
                context: 'myContext',
                _dispatch: mockDispatch.dispatch
            };

            var addon = new Y.mojito.addons.ac.partial(command, null, ac);
            addon.invoke('myAction', options, null);

            Mock.verify(mockDispatch);
        },

        'passes a valid adapter to dispatch': function() {
            var command = {
                    instance: {}
                };

            var mockCallback = Mock();
            Mock.expect(mockCallback, {
                method: 'callback',
                args: [null, 'flushdone', Mock.Value(function(arg) {
                    Assert.areEqual(arg.k1, 'flush', '');
                    Assert.areEqual(arg.k2, 'done', '');
                })]
            });

            var mockDispatch = Mock();
            Mock.expect(mockDispatch, {
                method: 'dispatch',
                args: [Mock.Value.Any, Mock.Value(function(arg) {
                    arg.flush('flush', { k1: 'flush', http: { headers: {} } });
                    arg.done('done', { k2: 'done', http: { headers: {} } });
                })]
            });

            var addon = new Y.mojito.addons.ac.partial(command, null, { _dispatch: mockDispatch.dispatch });
            addon.invoke(null, { params: {} }, mockCallback.callback);

            Mock.verify(mockDispatch);
            Mock.verify(mockCallback);
        },

        'ac.params.getAll() is used when options.params not passed': function() {
            var command = {
                    instance: {}
                };

            var mockParams = Mock();
            Mock.expect(mockParams, {
                method: 'getAll',
                returns: {}
            });

            var addon = new Y.mojito.addons.ac.partial(command, null, {
                _dispatch: function() {},
                params: mockParams
            });
            addon.invoke(null, /* expects function to indicate no params */ function() {});

            Mock.verify(mockParams);
        }

    }));
        

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: [
    'mojito-partial-addon'
]});
