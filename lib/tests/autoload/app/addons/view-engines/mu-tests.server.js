/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-mu-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        addon,
        A = YUITest.Assert,
        AA = YUITest.ArrayAssert,
        OA = YUITest.ObjectAssert;

    suite.add(new YUITest.TestCase({

        name: 'mojito-mu server tests',

        setUp: function() {
            addon = new Y.mojito.addons.templateEngines.mu();
        },

        tearDown: function() {
            addon = null;
        },

        'test constructor with no argument': function() {
            var addon = new Y.mojito.addons.templateEngines.mu();
            A.isFunction(addon.render);
            A.isFunction(addon.compiler);
        },
        'test constructor with templateId only': function() {
            var addon = new Y.mojito.addons.templateEngines.mu('yui_1234');
            A.areEqual('yui_1234', addon.templateId, 'wrong templateId');
        },
        'test constructor with templateId and options': function() {
            var options,
                addon;

            options = { mu: { bufferOutput: true } };
            addon = new Y.mojito.addons.templateEngines.mu('yui_1234', options);
            A.areEqual('yui_1234', addon.templateId, 'wrong templateId');
            A.areSame(options, addon.options, 'wrong options');
        },
        // use case with bufferOutput disabled is already tested elsewhere
        'test render with bufferOutput enabled': function() {
            var addon,
                VR,
                mockOptions,
                renderCalled = false,
                flushCalled = false,
                data = { name: 'XXXX' },
                meta = { template: { name: 'templateName'} },
                ac;

            mockOptions = { mu: { bufferOutput: true } };
            ac = { app: { config: { } } };
            ac._adapter = {
                done: function(data, meta) {},
                flush: function(data, meta) {}
            };
            ac.command = {
                instance: {
                    appConfig: {
                        templateEngine: mockOptions
                    },
                    type: 't',
                    templates: {
                        templateName: {
                            engine: 'mu',
                            'content-path': '/dev/null/templateName.html'
                        }
                    }
                }
            };
            VR = Y.mojito.TemplateRenderer;
            Y.mojito.TemplateRenderer = function(engine, templateId, options) {
                A.areSame(mockOptions, options, 'wrong options');
                return {
                    render: function(d, type, v, a, m, more) {
                        renderCalled = true;
                        A.areEqual('t', type, 'wrong type');
                        A.isNotUndefined(options.mu, 'options.mu undefined');
                        A.isNotUndefined(options.mu.bufferOutput, 'options.mu.bufferOutput undefined');
                    }
                };
            };

            new Y.mojito.addons.ac.core(null, null, ac);
            ac.flush(data, meta);

            Y.mojito.TemplateRenderer = VR;
        },
        // test case:
        'test render with bufferOutput=true': function() {
            var self = this,
                muAdapter,
                templateId,
                options,
                data,
                mojitoType,
                tmpl,
                adapter,
                meta,
                flushCount = 0.
                doneCount = 0,
                buffer = '';

            templateId = 'ABC';
            options = {
                mu: {
                    bufferOutput: true
                }
            };
            data = { foo: 'bar' };
            mojitType = 'FooMojit';
            tmpl = process.cwd() + "/lib/tests/autoload/app/addons/template-engines/mu-tests.server.template.html";
            tmpl = __dirname + "/mu-tests.server.template.html";
            // tmpl = "./mu-tests.server.template.html";
            adapter = {
                flush: function(d, m) {
                    flushCount += 1;
                    buffer += d;
                },
                done: function(d, m) {
                    doneCount += 1;
                    buffer += d;
                    A.isTrue(2 === flushCount, 'wrong flushCount: ' + flushCount);
                    A.isTrue(1 === doneCount, 'wrong doneCount: ' + doneCount);
                    A.areEqual("<div>bar</div><div>bar</div><div>bar</div>",
                                buffer,
                                'wrong buffer');
                    self.resume();
                }
            };
            meta = { template: { cacheTemplates: false } };


            muAdapter = new Y.mojito.addons.templateEngines.mu(templateId, options);
            A.isObject(muAdapter, 'wrong myAdapter');
            muAdapter.render(data, mojitType, tmpl, adapter, meta, true);
            muAdapter.render(data, mojitType, tmpl, adapter, meta, true);
            muAdapter.render(data, mojitType, tmpl, adapter, meta);

            function waitFn() {
               self.wait(waitFn, 1000); 
            }
            waitFn();
        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: ['mojito-mu', 'mojito-output-adapter-addon']});
