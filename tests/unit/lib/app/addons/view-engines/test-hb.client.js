/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true*/
/*global YUI*/


/*
 * Test suite for the hb.client.js file functionality.
 */
YUI({useBrowserConsole: true}).use(
    "mojito-hb",
    "test",
    "handlebars",
    function(Y) {

        var suite = new Y.Test.Suite("mojito-hb client tests"),
            TEMPLATES = {
                'oldObjNotation.hb.html': '<div>{{#tester}}{{test}}{{/tester}}</div>',
                'dotNotation.hb.html': '<div>{{tester.test}}</div>'
            };

        suite.add(new Y.Test.Case({
            setUp: function () {
                this.viewEngine = new Y.mojito.addons.viewEngines.hb();
                this.viewEngine._loadTemplate = function (tmpl, cb) {
                    var template = TEMPLATES[tmpl];
                    cb(null, template);
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
                    method: 'done',
                    args: [Y.Mock.Value.String, meta],
                    run: function (output, metaResult) {
                        Y.Assert.areEqual('<div>test</div>', output);
                    }
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
                    method: 'done',
                    args: [Y.Mock.Value.String, meta],
                    run: function (output, metaResult) {
                        Y.Assert.areEqual('<div>test</div>', output);
                    }
                });
                this.viewEngine.render(data, 'test', 'dotNotation.hb.html', adapter, meta);
            },

            'test render more': function () {
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
                this.viewEngine.render(data, 'test', 'dotNotation.hb.html', adapter, meta, true);
            },

            'test render cacheTemplate': function () {
                var data = {
                        tester: {
                            test: 'test'
                        }
                    },
                    adapter = Y.Mock(),
                    meta = {
                        view: {
                            cacheTemplates: true
                        }
                    };
                Y.Mock.expect(adapter, {
                    method: 'done',
                    args: [Y.Mock.Value.String, meta],
                    run: function (output, metaResult) {
                        Y.Assert.areEqual('<div>test</div>', output);
                    }
                });
                this.viewEngine.render(data, 'test', 'dotNotation.hb.html', adapter, meta);
            }
        }));

        Y.Test.Runner.add(suite);
    }
);
