/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */


/*jslint anon:true, sloppy:true, nomen:true, node:true*/
/*global YUI*/


/*
 * Baseline Mojito client testing harness.
 */
YUI.add('mojito', function(Y, NAME) {
    Y.namespace('mojito');
    Y.namespace('mojito.addons.ac');
});

/* AC ADDONS */
YUI.add('mojito-analytics-addon', function(Y, NAME) {});
YUI.add('mojito-assets-addon', function(Y, NAME) {});
YUI.add('mojito-carrier-addon', function(Y, NAME) {});
YUI.add('mojito-composite-addon', function(Y, NAME) {});
YUI.add('mojito-config-addon', function(Y, NAME) {});
YUI.add('mojito-cookie-addon', function(Y, NAME) {});
YUI.add('mojito-deploy-addon', function(Y, NAME) {});
YUI.add('mojito-device-addon', function(Y, NAME) {});
YUI.add('mojito-http-addon', function(Y, NAME) {});
YUI.add('mojito-i13n-addon', function(Y, NAME) {});
YUI.add('mojito-intl-addon', function(Y, NAME) {});
YUI.add('mojito-meta-addon', function(Y, NAME) {});
YUI.add('mojito-output-adapter-addon', function(Y, NAME) {});
YUI.add('mojito-params-addon', function(Y, NAME) {});
YUI.add('mojito-partial-addon', function(Y, NAME) {});
YUI.add('mojito-url-addon', function(Y, NAME) {});

/* RS ADDONS */
YUI.add('addon-rs-config', function(Y, NAME) {});
YUI.add('addon-rs-selector', function(Y, NAME) {});
YUI.add('addon-rs-url', function(Y, NAME) {});
YUI.add('addon-rs-yui', function(Y, NAME) {});

/* VIEW ENGINE ADDONS */
YUI.add('mojito-hb', function(Y, NAME) {});
YUI.add('mojito-mu', function(Y, NAME) {});

/* AUTOLOAD */
YUI.add('mojito-action-context', function(Y, NAME) {});
YUI.add('mojito-controller-context', function(Y, NAME) {});
YUI.add('mojito-dispatcher', function(Y, NAME) {});
YUI.add('mojito-loader', function(Y, NAME) {});
YUI.add('mojito-logger', function(Y, NAME) {});
YUI.add('mojito-mojit-proxy', function(Y, NAME) {});
YUI.add('mojito-output-handler', function(Y, NAME) {});
YUI.add('mojito-perf', function(Y, NAME) {
    Y.namespace('mojito').perf = {
        mark: function () {}
    };
});
YUI.add('mojito-resource-store', function(Y, NAME) {});
YUI.add('mojito-resource-store-adapter', function(Y, NAME) {});
YUI.add('mojito-rest-lib', function(Y, NAME) {});
YUI.add('mojito-route-maker', function(Y, NAME) {});
YUI.add('mojito-client-store', function(Y, NAME) {});
// Don't add mojito-tunnel-client.  It's optional, so adding always will
// confuse our test that makes sure it's not loaded sometimes :)
YUI.add('mojito-util', function(Y, NAME) {});
YUI.add('mojito-view-renderer', function(Y, NAME) {});

/*
 * Add a mojito-test module containing the mocking support we want for other
 * Mojito components.
 */
YUI.add('mojito-test', function(Y, NAME) {

    function EasyMock() {

        var mock = Y.Test.Mock();

        mock.expect = function() {
            Y.Array.each(arguments, function(expectation) {
                Y.Test.Mock.expect(mock, expectation);
            });
            return mock;
        };

        mock.verify = function() {
            Y.Test.Mock.verify(mock);
        };

        return mock;
    }


    function createMockAddon(source, name) {
        source._addons.push(name);
        source[name] = new EasyMock();
    }


    function createMockModel(source, name) {
        source.models[name] = new EasyMock();
    }


    function createMockExtra(source, ns, name) {
        var mock = new EasyMock();

        if (!source[ns]) {
            source[ns] = {};
        }
        if (!source._extras[ns]) {
            source._extras[ns] = {};
        }
        source._extras[ns][name] = mock;
        source[ns][name] = mock;
    }


    function MockActionContext(opts) {
        var mock = Y.Test.Mock();

        opts = opts || {};
        mock._addons = [];
        mock.models = {};
        mock._extras = {};

        if (opts.addons) {
            Y.Array.each(opts.addons, function(addon) {
                createMockAddon(mock, addon);
            });
        }
        if (opts.models) {
            Y.Array.each(opts.models, function(model) {
                createMockModel(mock, model);
            });
        }
        if (opts.extras) {
            Y.Object.each(opts.extras, function(extras, namespace) {
                if (Y.Lang.isArray(extras)) {
                    Y.Array.each(extras, function(extra) {
                        createMockExtra(mock, namespace, extra);
                    });
                } else {
                    createMockExtra(mock, namespace, extras);
                }
            });
        }

        mock.expect = function() {
            Y.Array.each(arguments, function(expectation) {
                Y.Test.Mock.expect(mock, expectation);
            });
            return mock;
        };
        mock.verify = function() {
            var i,
                j,
                mockAddon;

            Y.Test.Mock.verify(mock);
            for (i = 0; i < mock._addons.length; i += 1) {
                mockAddon = mock[mock._addons[i]];
                mockAddon.verify();
            }
            for (i in mock.models) {
                if (mock.models.hasOwnProperty(i)) {
                    mock.models[i].verify();
                }
            }
            for (i in mock._extras) {
                if (mock._extras.hasOwnProperty(i)) {
                    for (j in mock._extras[i]) {
                        if (mock._extras[i].hasOwnProperty(j)) {
                            mock._extras[i][j].verify();
                        }
                    }
                }
            }
        };
        return mock;
    }

    Y.mojito.MockActionContext = MockActionContext;
    Y.mojito.EasyMock = EasyMock;

}, '0.1.0', {requires: [
    'event',
    "node",
    "node-event-simulate"
]});
