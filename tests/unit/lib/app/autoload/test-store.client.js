/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-client-store', 'test', 'querystring-stringify-simple', function (Y) {

    var suite = new Y.Test.Suite('mojito-client-store-tests'),
        A = Y.Assert,
        OA = Y.ObjectAssert;

    suite.add(new Y.Test.Case({

        setUp: function () {
            this.store = new Y.mojito.ResourceStore({
                appConfig: {
                    foo: 1
                },
                pathToRoot: '/root'
            });
        },

        tearDown: function () {

        },

        'test buildUrl': function () {
            var self = this,
                tests = [
                    {
                        input: '/test/',
                        expectation: '/root/test/'
                    },
                    {
                        input: 'test',
                        expectation: '/root/test'
                    },
                    {
                        context: {
                            env: 'dev'
                        },
                        input: 'test',
                        expectation: '/root/test?env=dev'
                    },
                    {
                        context: {
                            env: 'dev',
                            test: 'test'
                        },
                        input: 'test',
                        expectation: '/root/test?env=dev&test=test'
                    }
                ];

            Y.Array.each(tests, function (test) {
                var output = this.store._buildUrl(test.input, test.context);
                A.areEqual(test.expectation, output, 'buildUrl did not create the correct url');
            }, this);
        },

        'test app config value': function() {
            var config = this.store.getAppConfig();
            A.areEqual(1, config.foo);
        }

    }));

    Y.Test.Runner.add(suite);

});
