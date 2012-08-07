/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-composite-addon-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        OA = YUITest.ObjectAssert;
    
    suite.add(new YUITest.TestCase({
    
        name: 'composite tests',

        'no-arg done calls execute with children': function() {
            var command = {
                    instance: {
                        config: {
                            children: {
                                kid_a: { id: 'kid_a', type: 'kida' }
                            }
                        }
                    }
                },
                datamock = {data: 'mock'},
                metamock = {meta: 'mock'},
                adapter = null,
                ac = {
                    done: function(data, meta) {
                        doneCalled = true;
                        OA.areEqual(datamock, data, "wrong data value");
                        OA.areEqual(metamock, meta, "wrong meta value");
                    }, _notify: function() {}
                },
                c = new Y.mojito.addons.ac.composite(command, adapter, ac),
                doneCalled = false;
            c.execute = function(cfg, cb, scope) {
                OA.areEqual(command.instance.config, cfg);
                cb.call(scope, datamock, metamock);
            };

            c.done();

            A.isTrue(doneCalled, "ac done function never called");
        },

        'done throws error when no children in config': function() {
            var command = {instance: {config: {}}},
                adapter = null,
                ac = {_notify: function() {}},
                c = new Y.mojito.addons.ac.composite(command, adapter, ac);
            try {
                c.done();
                A.fail("composite done should fail without children");
            } catch (err) {
                A.areSame("Cannot run composite mojit children because there are " +
                        "no children defined in the composite mojit spec.", err.message);
            }
        },
        
        'done throws error when children is an empty object': function() {
            var command = {instance: {config: {children: {}}}},
                c = new Y.mojito.addons.ac.composite(command, null, {});
            try {
                c.done();
                A.fail("composite done should fail when children key exists and is an empty object");
            } catch (err) {
                A.areSame("Cannot run composite mojit children because there are " +
                        "no children defined in the composite mojit spec.", err.message);
            }
        },

        'execute dispatches each child': function() {
            var command = {instance: {}},
                adapter = null,
                ac = {
                    _dispatch: function(command, adapter) {
                        A.isObject(command, "bad command object to dispatch");
                        A.isNotUndefined(adapter, "bad adapter for dispatch");
                        var id = command.instance.id;
                        var meta = {};
                        meta[id] = id + '__meta';
                        adapter.done(id + '__data', meta);
                    }, _notify: function() {}
                },
                c = new Y.mojito.addons.ac.composite(command, adapter, ac),
                config = {
                    children: {
                        kid_a: { id: 'kid_a', type: 'kida' },
                        kid_b: { id: 'kid_b', type: 'kidb' }
                    }
                },
                exeCbCalled = false;

            c.execute(config, function(data, meta) {
                exeCbCalled = true;
                A.isString(data.kid_a, "missing kid_a data");
                A.isString(data.kid_b, "missing kid_b data");
                A.areSame('kid_a__data', data.kid_a, "wrong kid_a data");
                A.areSame('kid_b__data', data.kid_b, "wrong kid_b data");
                A.isString(meta.kid_a, "missing kid_a meta");
                A.isString(meta.kid_b, "missing kid_b meta");
                A.areSame('kid_a__meta', meta.kid_a, "wrong kid_a meta");
                A.areSame('kid_b__meta', meta.kid_b, "wrong kid_b meta");
            });

            A.isTrue(exeCbCalled, "execute callback never called");

        },
        
        'run extra template data can be passed with no child or params': function() {

            var command = {
                    instance: {
                        config: {
                            children: {
                                kid_a: { id: 'kid_a', type: 'kida' },
                                kid_b: { id: 'kid_b', type: 'kidb' }
                            }
                        }
                    }
                },
                adapter = null,
                ac = {
                    done: function(data, meta) {
                        doneCalled = true;
                        A.isString(data.foo);
                        A.areSame('fooval', data.foo, "template data didn't transfer");
                        A.areSame('kid_a__data', data.kid_a, "Missing core child data");
                        A.areSame('kid_b__data', data.kid_b, "Missing core child data");
                    },
                    _dispatch: function(command, adapter) {
                        var id = command.instance.id;
                        var meta = {};
                        meta[id] = id + '__meta';
                        adapter.done(id + '__data', meta);
                    }, _notify: function() {}
                },
                c = new Y.mojito.addons.ac.composite(command, adapter, ac),
                doneCalled = false;

            c.done({
                template: {
                    foo: 'fooval'
                }
            });

            A.isTrue(doneCalled, "ac done function never called");

        },

        'error is thrown when children is an array': function() {
            var command = {instance: {}},
                adapter = null,
                ac = {},
                c = new Y.mojito.addons.ac.composite(command, adapter, ac),
                config = {
                    children: [
                        { id: 'kid_a', type: 'kida' },
                        { id: 'kid_b', type: 'kidb' }
                    ]
                };

            try {
                c.execute(config);
                A.fail('Execution should have failed because of children array');
            } catch (err) {
                A.areSame("Cannot process children in the format of an array. 'children' must be an object.", err.message, 'wrong error message');
            }

        },

        'proxied mojits are processed properly': function() {
            var command = {instance: {}},
                adapter = null,
                ac = {
                    _dispatch: function(command, adapter) {
                        A.isObject(command, "bad command object to dispatch");
                        A.isNotUndefined(adapter, "bad adapter for dispatch");
                        var id = command.instance.id;
                        var meta = {};
                        if (! id) {
                            id = command.instance.config.proxied.id;
                            A.areSame('ProxyHandler', command.instance.type, 'Wrong proxy type');
                        }
                        meta[id] = id + '__meta';
                        adapter.done(id + '__data', meta);
                    }, _notify: function() {}
                },
                c = new Y.mojito.addons.ac.composite(command, adapter, ac),
                config = {
                    children: {
                        kid_a: { id: 'kid_a', type: 'kida' , proxy: { type: 'ProxyHandler'}},
                        kid_b: { id: 'kid_b', type: 'kidb' }
                    }
                },
                exeCbCalled = false;

            c.execute(config, function(data, meta) {
                exeCbCalled = true;
                A.isString(data.kid_a, "missing kid_a data");
                A.isString(data.kid_b, "missing kid_b data");
                A.areSame('kid_a__data', data.kid_a, "wrong kid_a data: " + data.kid_a);
                A.areSame('kid_b__data', data.kid_b, "wrong kid_b data");
                A.isString(meta.kid_a, "missing kid_a meta");
                A.isString(meta.kid_b, "missing kid_b meta");
                A.areSame('kid_a__meta', meta.kid_a, "wrong kid_a meta");
                A.areSame('kid_b__meta', meta.kid_b, "wrong kid_b meta");
            });

            A.isTrue(exeCbCalled, "execute callback never called");
        },
        
        'defered mojits are processed properly': function() {
            var command = {instance: {}},
                adapter = null,
                ac = {
                    _dispatch: function(command, adapter) {
                        A.isObject(command, "bad command object to dispatch");
                        A.isNotUndefined(adapter, "bad adapter for dispatch");
                        var id = command.instance.id;
                        var meta = {};
                        if (! id) {
                            id = command.instance.config.proxied.id;
                            A.areSame('LazyLoad', command.instance.type, 'Wrong proxy type');
                        }
                        meta[id] = id + '__meta';
                        adapter.done(id + '__data', meta);
                    }, _notify: function() {}
                },
                c = new Y.mojito.addons.ac.composite(command, adapter, ac),
                config = {
                    children: {
                        kid_a: { id: 'kid_a', type: 'kida' , defer: true},
                        kid_b: { id: 'kid_b', type: 'kidb' }
                    }
                },
                exeCbCalled = false;

            c.execute(config, function(data, meta) {
                exeCbCalled = true;
                A.isString(data.kid_a, "missing kid_a data");
                A.isString(data.kid_b, "missing kid_b data");
                A.areSame('kid_a__data', data.kid_a, "wrong kid_a data: " + data.kid_a);
                A.areSame('kid_b__data', data.kid_b, "wrong kid_b data");
                A.isString(meta.kid_a, "missing kid_a meta");
                A.isString(meta.kid_b, "missing kid_b meta");
                A.areSame('kid_a__meta', meta.kid_a, "wrong kid_a meta");
                A.areSame('kid_b__meta', meta.kid_b, "wrong kid_b meta");
            });

            A.isTrue(exeCbCalled, "execute callback never called");
        },

        'null or undefined child should be discarded': function() {
            var command = {instance: {}},
                adapter = null,
                ac = {
                    _dispatch: function(command, adapter) {
                        A.isObject(command, "bad command object to dispatch");
                        A.isNotUndefined(adapter, "bad adapter for dispatch");
                        var id = command.instance.id;
                        var meta = {};
                        meta[id] = id + '__meta';
                        adapter.done(id + '__data', meta);
                    }, _notify: function() {}
                },
                c = new Y.mojito.addons.ac.composite(command, adapter, ac),
                config = {
                    children: {
                        kid_a: null,
                        kid_b: { id: 'kid_b', type: 'kidb' }
                    }
                },
                exeCbCalled = false;

            c.execute(config, function(data, meta) {
                exeCbCalled = true;
                A.isUndefined(data.kid_a, "unexpected kid_a data for null child");
                A.isString(data.kid_b, "missing kid_b data");
                A.areSame('kid_b__data', data.kid_b, "wrong kid_b data");
                A.isUndefined(meta.kid_a, "unexpected kid_a meta for null child");
                A.isString(meta.kid_b, "missing kid_b meta");
                A.areSame('kid_b__meta', meta.kid_b, "wrong kid_b meta");
            });

            A.isTrue(exeCbCalled, "execute callback never called");
        }

    }));
    
    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: [
    'mojito',
    'mojito-composite-addon'
]});
