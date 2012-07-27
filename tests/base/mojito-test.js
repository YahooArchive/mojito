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

/*
 */
YUI.add('mojito', function(Y, NAME) {
    Y.namespace('mojito');
});

/*
 */
YUI.add('mojito-meta-addon', function(Y, NAME) {
    Y.namespace('mojito.addons.ac');
    return function() {};
});

/*
 */
YUI.add('mojito-composite-addon', function(Y, NAME) {
    Y.namespace('mojito.addons.ac');
    return function() {};
});

/*
 */
YUI.add('mojito-params-addon', function(Y, NAME) {
    Y.namespace('mojito.addons.ac');
    return function() {};
});

/*
 */
YUI.add('mojito-client-store', function(Y, NAME) {
    return function() {};
});

/*
 */
YUI.add('mojito-dispatcher', function(Y, NAME) {
    return function() {};
});

/*
 */
YUI.add('mojito-loader', function(Y, NAME) {
    return function() {};
});

/*
 */
YUI.add('mojito-logger', function(Y, NAME) {
    return function() {};
});

/*
 */
YUI.add('mojito-mojit-proxy', function(Y, NAME) {
    return function() {};
});

/*
 */
YUI.add('mojito-output-handler', function(Y, NAME) {
    return function() {};
});

/*
 */
YUI.add('mojito-resource-store-adapter', function(Y, NAME) {
    return function() {};
});

/*
 */
YUI.add('mojito-route-maker', function(Y, NAME) {
    return function() {};
});

/*
 */
YUI.add('mojito-tunnel-client', function(Y, NAME) {
    return function() {};
});


/******* DALI ********/

/*
 */
YUI.add('breg', function(Y, NAME) {
    Y.namespace('Dali').beanRegistry = {
        registerBean: function (name, obj) {
            if (!this.beans) {
                this.beans = {};
            }
            this.beans[name] = obj;
        },
        getBean: function (name) {
            return this.beans[name];
        },
        doInjection: function () {
            this.isInjected = true;
        }
    };
});

/*
 */
YUI.add('dali-transport-base', function(Y, NAME) {
    return function() {};
});

/*
 */
YUI.add('request-handler', function(Y, NAME) {
    return function() {};
});

/*
 */
YUI.add('simple-request-formatter', function(Y, NAME) {
    return function() {};
});

/*
 */
YUI.add('requestor', function(Y, NAME) {
    return function() {};
});

/*
 */
YUI.add('io-facade', function(Y, NAME) {
    return function() {};
});

/*
 */
YUI.add('response-formatter', function(Y, NAME) {
    return function() {};
});

/*
 */
YUI.add('response-processor', function(Y, NAME) {
    return function() {};
});

/******* END DALI ********/


/*
 */
YUI.add('mojito-util', function(Y, NAME) {
    Y.mojito.util = {
        // TODO: Do we want this to be a real copy operation? For mocking in
        // tests it's likely sufficient that it doesn't copy but side-effects
        // may be possible.
        copy: function(obj) {
            return obj;
        },

        // TODO: this is an extremely simplified version of the function, but meets
        // the demands of the current tests. If we find ourselves writing tests that require
        // more advanced use cases, we should make this function meet those needs.
        metaMerge: function (to, from) {
            return Y.merge(from, to);
        }
    };

    return Y.mojito.util;
});

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
