/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true*/
/*global YUI*/


/*
 * Test suite for the hb.server.js file functionality.
 */
YUI({useBrowserConsole: true}).use(
    "mojito-hb",
    "test",
    function(Y) {

        var suite = new Y.Test.Suite("mojito-hb server tests"),
            TEMPLATES = {
                'oldObjNotation.hb.html': '<div>{{#tester}}{{test}}{{/tester}}</div>',
                'dotNotation.hb.html': '<div>{{tester.test}}</div>',
                'helperMethod.hb.html': '<div>{{helper}}</div>'
            };

        suite.add(new Y.Test.Case({
            setUp: function () {
                this.viewEngine = new Y.mojito.addons.viewEngines.hb();
                this.viewEngine._loadTemplate = function (tmpl, cb) {
                    cb(null, TEMPLATES[tmpl]);
                };
            },

            'test render old object notation': function () {
                var data = {
                        tester: {
                            test: 'test'
                        }
                    },
                    adapter = Y.Mock(),
                    meta = {
                        view: {}
                    };
                Y.Mock.expect(adapter, {
                    method: 'flush',
                    args: [Y.Mock.Value.String, meta],
                    run: function (output, metaResult) {
                        Y.Assert.areEqual('<div>test</div>', output);
                    }
                });
                Y.Mock.expect(adapter, {
                    method: 'done',
                    args: ['<div>test</div>', meta]
                });
                this.viewEngine.render(data, 'test', 'oldObjNotation.hb.html', adapter, meta);
            },

            'test render dot notation': function () {
                var data = {
                        tester: {
                            test: 'test'
                        }
                    },
                    adapter = Y.Mock(),
                    meta = {
                        view: {}
                    };
                Y.Mock.expect(adapter, {
                    method: 'flush',
                    args: [Y.Mock.Value.String, meta],
                    run: function (output, metaResult) {
                        Y.Assert.areEqual('<div>test</div>', output);
                    }
                });
                Y.Mock.expect(adapter, {
                    method: 'done',
                    args: ['<div>test</div>', meta]
                });
                this.viewEngine.render(data, 'test', 'dotNotation.hb.html', adapter, meta);
            },

            'test register helper method': function () {
                var adapter = Y.Mock(),
                    meta = {
                        view: {}
                    };
                Y.mojito.addons.viewEngines.hb.register('helper', function (options) {
                    return 'helperTest';
                });
                Y.Mock.expect(adapter, {
                    method: 'flush',
                    args: [Y.Mock.Value.String, meta],
                    run: function (output, metaResult) {
                        Y.Assert.areEqual('<div>helperTest</div>', output);
                    }
                });
                Y.Mock.expect(adapter, {
                    method: 'done',
                    args: ['<div>helperTest</div>', meta]
                });
                this.viewEngine.render({}, 'test', 'helperMethod.hb.html', adapter, meta);
            }
        }));

        Y.Test.Runner.add(suite);
    }
);
