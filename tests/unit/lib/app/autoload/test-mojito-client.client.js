/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true*/
/*global YUI*/


/*
 * Test suite for the mojito-client.client.js file functionality.
 */
YUI({useBrowserConsole: true}).use(
    'mojito-client',
    'test',
    function(Y) {

        var suite = new Y.Test.Suite("mojito-client.client tests"),
            A = Y.Assert,
            OA = Y.ObjectAssert;

        suite.add(new Y.Test.Case({

            setUp: function() {
                this.mojitoClient = new Y.mojito.Client();
            },

            "test constructor": function() {
                var client = this.mojitoClient;
                A.isObject(client);
            },

            'test decompressBinders with no config': function() {
                A.isFunction(this.mojitoClient.decompressBinders);
                var value = this.mojitoClient.decompressBinders();
                A.isNotUndefined(!value, 'value should be undefined');
            },
            'test decompressBinders with emtpy config': function() {
                A.isFunction(this.mojitoClient.decompressBinders);
                var arg = {},
                    value = this.mojitoClient.decompressBinders(arg);
                A.areEqual(arg, value, 'value should be an empty Object');
            },
            'test decompressBinders with missing or empty binderMap': function() {
                var config,
                    result;

                config = {
                    deployRuntimeClient: {
                        yuiConfigBase: 'XX',
                        optimized: { foo: 'bar'}
                    }
                };
                result = this.mojitoClient.decompressBinders(config);
                OA.areEqual(result, config, 'config mismatch');
                A.isNotUndefined(config.deployRuntimeClient, 'config was modified!');
            },
            'test decompressBinders with missing yuiConfigBase': function() {
                A.isFunction(this.mojitoClient.decompressBinders);
                var config,
                    result;
                config = {
                    deployRuntimeClient: {
                        optimized: {}
                    }
                };
                result = this.mojitoClient.decompressBinders(config);
                OA.areEqual(result, config, 'config mismatch');
                A.isNotUndefined(config.deployRuntimeClient, 'config was modified!');
            },
            'test decompressBinders with missing optimized': function() {
                A.isFunction(this.mojitoClient.decompressBinders);
                var config,
                    result;
                config = {
                    deployRuntimeClient: {
                        yuiConfigBase: 'XX'
                    }
                };
                result = this.mojitoClient.decompressBinders(config);
                OA.areEqual(result, config, 'config mismatch');
                A.isNotUndefined(config.deployRuntimeClient, 'config was modified!');
            },
            // mock the config that is passed to Y.mojito.Client() constructor
            mockConfig: function() {
                var config,
                    binderMap;

                config = {
                    appConfig: {
                        deployRuntimeClient: {
                            yuiConfigBase: 'http://yui.yahooapis.com/3.5.1/build/'
                        }
                    },
                    deployRuntimeClient: {
                        optimized: {
                            'yui-base': '$y_yui-base/yui-base-min.js',
                            'mojito-view-renderer': '$m_autoload/view-renderer.common.js',
                            'moduleOne': '/foo/bar/moduleOne.js',
                            'moduleTwo': '/foo/bar/moduleTwo.js'
                        }
                    }
                };
                binderMap = {
                    view1: {
                        needs: {
                            'yui-base': 'yui-base',
                            'mojito-view-renderer': 'mojito-view-renderer',
                            'moduleOne': 'moduleOne'
                        }
                    },
                    view2: {
                        needs: {
                            'moduleOne': 'moduleOne',
                            'moduleTwo': 'moduleTwo'
                        }
                    }
                };
                config.binderMap = binderMap;
                return config;
            },
            'test decompressBinders with valid config': function() {
                A.isFunction(this.mojitoClient.decompressBinders);
                var config = this.mockConfig(),
                    value = this.mojitoClient.decompressBinders(config);

                A.areEqual(config, value, 'config does not match returned value');
                A.areEqual('http://yui.yahooapis.com/3.5.1/build/yui-base/yui-base-min.js',
                           value.binderMap.view1.needs['yui-base'],
                           'module yui-base path does not match');
                A.areEqual('/static/mojito/autoload/view-renderer.common.js',
                           value.binderMap.view1.needs['mojito-view-renderer'],
                           'module mojito-view-renderer path does not match');
                A.areEqual('/foo/bar/moduleOne.js',
                           value.binderMap.view1.needs.moduleOne,
                           'module view1.moduleOne path does not match');
                A.areEqual('/foo/bar/moduleOne.js',
                           value.binderMap.view2.needs.moduleOne,
                           'module view2.moduleOne path does not match');
                A.areEqual('/foo/bar/moduleTwo.js',
                           value.binderMap.view2.needs.moduleTwo,
                           'module view2.moduleTwo path does not match');
                A.isUndefined(config.deployRuntimeClient, 'config.deployRuntimeClient should have been deleted!');
            },
            'test decompressBinders with user provided staticHandlingPrefix': function() {
                A.isFunction(this.mojitoClient.decompressBinders);

                var config,
                    result;

                config = this.mockConfig();
                config.appConfig.deployRuntimeClient.staticHandlingPrefix = '/XX/mojito/';
                result = this.mojitoClient.decompressBinders(config);
                A.areEqual('/XX/mojito/autoload/view-renderer.common.js',
                           result.binderMap.view1.needs['mojito-view-renderer'],
                           'module URL does not match expected value');

            },
            'test decompressBinders with user provided mojitoPrefix': function() {
                A.isFunction(this.mojitoClient.decompressBinders);
                var config,
                    result;
                config = {
                    appConfig: {
                        deployRuntimeClient: {
                            mojitoPrefix: 'MOJITO_PREFIX',
                            yuiConfigBase: 'http://somewhere/'
                        }
                    },
                    deployRuntimeClient: {
                        optimized: {
                            moduleOne: 'MOJITO_PREFIXview.common.js'
                        }
                    },
                    binderMap: {
                        view1: {
                            name: 'name',
                            needs: {
                                moduleOne: 'bla'
                            }
                        }
                    }
                };
                result = this.mojitoClient.decompressBinders(config);
                A.areEqual('/static/mojito/view.common.js',
                           config.binderMap.view1.needs.moduleOne,
                           'wrong moduleOne path');
            },
            'test decompressBinders with user provided yuiPrefix': function() {
                A.isFunction(this.mojitoClient.decompressBinders);
                var config,
                    result;
                config = {
                    appConfig: {
                        deployRuntimeClient: {
                            yuiPrefix: 'YUI_PREFIX',
                            yuiConfigBase: 'http://booba/'
                        }
                    },
                    deployRuntimeClient: {
                        optimized: {
                            moduleOne: 'YUI_PREFIXview.common.js'
                        }
                    },
                    binderMap: {
                        view1: {
                            name: 'name',
                            needs: {
                                moduleOne: 'bla'
                            }
                        }
                    }
                };
                result = this.mojitoClient.decompressBinders(config);
                A.areEqual('http://booba/view.common.js',
                           config.binderMap.view1.needs.moduleOne,
                           'wrong moduleOne path');
            }
        }));

        Y.Test.Runner.add(suite);
    }
);
