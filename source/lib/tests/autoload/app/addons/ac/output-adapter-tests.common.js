/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-output-adapter-addon-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        OA = YUITest.ObjectAssert;

    suite.add(new YUITest.TestCase({
        
        name: 'general tests',

        'flush calls done with "more"': function() {
            var doneCalled;
            var ac = {};
            new Y.mojito.addons.ac.core({}, null, ac);

            ac.done = function(data, meta, more) {
                A.areSame('data', data, 'bad data for done');
                A.areSame('meta', meta, 'bad meta for done');
                A.isTrue(more, "flush should've send 'more' = true to done");
                doneCalled = true;
            };

            ac.flush('data', 'meta');

            A.isTrue(doneCalled, 'flush never called done');
        },

        'when called with string data, done renders a string without templating': function() {
            var ac = {};
            var doneCalled;
            ac._adapter = {
                done: function(data, meta) {
                    var ct = meta.http.headers['content-type'];
                    doneCalled = true;
                    A.areSame('hi',data, 'bad string to done');
                    A.areSame(1, ct.length, "should be only one content-type header");
                    A.areSame('text/plain; charset=utf-8', ct[0]);
                }
            };
            var instance = {views: {}};
            ac.command = {instance: instance};
            new Y.mojito.addons.ac.core(null, null, ac);

            ac.done('hi');

            A.isTrue(doneCalled, 'done never called');

        },

        'when called with string data and Content-Type header set, done respects the type': function() {
            var ac = {};
            var doneCalled;
            ac._adapter = {
                done: function(data, meta) {
                    var ct = meta.http.headers['content-type'];
                    doneCalled = true;
                    A.areSame('hi',data, 'bad string to done');
                    A.areSame(1, ct.length, "should be only one content-type header");
                    A.areSame('my favorite type', ct[0]);
                }
            };
            ac.command = {instance: {views: {}}};
            new Y.mojito.addons.ac.core(null, null, ac);

            ac.done('hi', {
                http: {
                    headers: {
                        'content-type': ['my favorite type']
                    }
                }
            });


            A.isTrue(doneCalled, 'done never called');

        },

        'when called with "json" meta string, done renders a string with json content type': function() {
            var ac = {};
            var doneCalled;
            var json = {hi:'there'};
            ac._adapter = {
                done: function(data, meta) {
                    var ct = meta.http.headers['content-type'];
                    doneCalled = true;
                    A.areSame(Y.JSON.stringify(json), data, 'bad string to done');
                    A.areSame(1, ct.length, "should be only one content-type header");
                    A.areSame('application/json; charset=utf-8', ct[0]);
                }
            };
            ac.command = {instance: {views: {}}};
            new Y.mojito.addons.ac.core(null, null, ac);

            ac.done(json, 'json');

            A.isTrue(doneCalled, 'done never called');

        },

        'when called with "xml" meta string, done renders a string with xml content type': function() {
            var ac = {};
            var doneCalled;
            var json = {hi:'there'};
            ac._adapter = {
                done: function(data, meta) {
                    var ct = meta.http.headers['content-type'];
                    doneCalled = true;
                    A.areSame('<xml><hi>there</hi></xml>', data, 'bad string to done');
                    A.areSame(1, ct.length, "should be only one content-type header");
                    A.areSame('application/xml; charset=utf-8', ct[0]);
                }
            };
            ac.command = {instance: {views: {}}};
            new Y.mojito.addons.ac.core(null, null, ac);

            ac.done(json, 'xml');

            A.isTrue(doneCalled, 'done never called');

        },

        'when there is no view meta, adapter is called directly': function() {
            var ac = {};
            var doneCalled;
            var data = 'data';
            var meta = {};
            ac._adapter = {
                done: function(d, m) {
                    doneCalled = true;
                    A.areSame(data, d, 'bad data to done');
                    A.areSame(meta, m, 'bad meta to done');
                }
            };
            ac.command = {instance: {views: {}}};
            new Y.mojito.addons.ac.core(null, null, ac);

            ac.done(data, meta);

            A.isTrue(doneCalled, 'done never called');

        },

        'device-specific view is used for render': function() {
            var vrRendered;
            // mock view renderer
            var VR = Y.mojito.ViewRenderer;
            Y.mojito.ViewRenderer = function(engine) {
                A.areSame('engine', engine, 'bad view engine');
                return {
                    render: function(d, type, v, a, m, more) {
                        vrRendered = true;
                        A.areSame(data, d, 'bad data to view');
                        A.areSame('t', type, 'bad mojitType to view');
                        A.areSame(meta, m, 'bad meta to view');
                        A.areSame('path', v, 'bad view content path to view engine');
                        A.areSame(ac._adapter, a, 'bad adapter to view');
                        A.isFalse(more);
                    }
                };
            };
            var ac = { app: { config: {} } };
            var data = {};
            var meta = { view: {name: 'viewName'} };
            ac._adapter = {
                done: function() {
                    A.fail('done should not be called, the view renderer should be calling it');
                }
            };
            ac.command = {
                    instance: {
                        type: 't',
                        views: {
                            viewName: {
                                engine: 'engine',
                                'content-path': 'path'
                            }
                        }
                    }
                };
            new Y.mojito.addons.ac.core(null, null, ac);

            ac.done(data, meta, false);

            A.isTrue(vrRendered, 'view render never called');

            // replace mock
            Y.mojito.ViewRenderer = VR;

        },

        'config children params are stripped': function() {
            var doneCalled;
            var children = {
                foo: {
                    params: 'params'
                }
            };
            var ac = {
                app: { config: {} },
                command: {
                    instance: {
                        config: {
                            children: children
                        },
                        views: {
                            mockView: {
                            }
                        }
                    }
                }
            };
            ac._adapter = {
                done: function(data, meta) {
                    doneCalled = true;
                    A.isObject(meta.binders.binderid, 'no binder id');
                    A.isUndefined(meta.binders.binderid.config.children.params, 'config.children.params should be undefined');
                    A.isUndefined(meta.binders.binderid.children.params, 'children.params should be undefined');
                }
            };
            // mock view renderer
            var VR = Y.mojito.ViewRenderer;
            Y.mojito.ViewRenderer = function(engine) {
                return {
                    render: function(d, type, v, a, m, more) {
                        a.done('html', m);
                    }
                };
            };
            new Y.mojito.addons.ac.core({}, null, ac);

            var yguid = Y.guid;
            Y.guid = function() {
                return 'binderid';
            };
            ac.done({data: 'data'}, { view: {name: 'mockView'}, children: children});

            A.isTrue(doneCalled, 'never called done');

            // replace
            Y.guid = yguid;
            Y.mojito.ViewRenderer = VR;
        },

        'TODO: view template can be specified in meta data': function() {
            A.skip();
        }
        
    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-output-adapter-addon']});
