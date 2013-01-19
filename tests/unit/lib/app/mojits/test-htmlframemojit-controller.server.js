/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, node:true*/

YUI().use('HTMLFrameMojit', 'test', function(Y, NAME) {

    'use strict';

    var suite = new Y.Test.Suite(NAME),
        A = Y.Test.Assert;

    suite.add(new Y.Test.Case({

        name: 'HTMLFrameMojit user tests',

        'test _renderChild': function() {
            var composite = Y.Mock();

            Y.Mock.expect(composite, {
                method: 'execute',
                args: [Y.Mock.Value.Object, Y.Mock.Value.Function],
                run: function (cfg, cb) {
                    A.isObject(cfg);
                    A.areEqual('foo', cfg.children.child, 'children structure incomplete');
                    cb(); // calling back as usually
                }
            });

            var ac = {
                config: {
                    get: function (name) {
                        return {
                            child: "foo",
                            assets: {}
                        }[name];
                    }
                },
                composite: composite
            };
            Y.mojito.controllers.HTMLFrameMojit._renderChild(ac, function () {});

            Y.Mock.verify(composite);
        },

        'test index()': function() {
            var composite = Y.Mock();

            Y.Mock.expect(composite, {
                method: 'execute',
                args: [Y.Mock.Value.Object, Y.Mock.Value.Function],
                run: function (cfg, cb) {
                    A.isObject(cfg);
                    A.areEqual('foo', cfg.children.child, 'children structure incomplete');
                    // cb(); TODO: if we call back, there are another bunch of stuff to mock
                }
            });

            var ac = {
                config: {
                    get: function (name) {
                        return {
                            child: "foo",
                            assets: {}
                        }[name];
                    }
                },
                composite: composite
            };
            Y.mojito.controllers.HTMLFrameMojit.index(ac);

            Y.Mock.verify(composite);
        }

    }));

    Y.Test.Runner.add(suite);

});
