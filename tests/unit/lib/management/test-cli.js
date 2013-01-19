/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

// NOTE the dependency on 'test' here, but not 'cli', since cli.js is NOT a YUI
// module...and most command files aren't either.
YUI().use('test', function(Y) {

    var suite = new Y.Test.Suite('cli tests'),
        A = Y.Assert,
        OA = Y.ObjectAssert,
        AA = Y.ArrayAssert,
        libpath = require('path'),
        cli = require(libpath.join(__dirname,
            '../../../../lib/management/cli.js')),
        mockOptionMap = function(opts) {
            return {};
        },
        opts = [{"longName":"coverage","shortName":"c","hasValue":false},
            {"longName":"verbose","shortName":"v","hasValue":false},
            {"longName":"tmpdir","shortName":"t","hasValue":true}];

    suite.add(new Y.Test.Case({

        name: 'cli tests',

        'test require': function() {
            A.isNotNull(cli);
            A.isFunction(cli._makeOptionMap);
            A.isFunction(cli._parseArgs);

        },

        'test makeOptionMap': function() {
            var map,
                out;

            out = {"-c": opts[0], "--coverage": opts[0],
                "-v": opts[1], "--verbose": opts[1],
                "-t": opts[2], "--tmpdir": opts[2]}

            map = cli._makeOptionMap(opts);

            OA.areEqual(map, out);
        },

        'test parseArgs empty': function() {
            var out,
                result,
                orig;

            out = {"params": [],
                "options": {},
                "errors": []
            }

            orig = cli._makeOptionMap;
            cli._makeOptionMap = mockOptionMap;

            try {
                result = cli._parseArgs([], {});
                AA.itemsAreEqual(result.params, out.params);
                OA.areEqual(result.options, out.options);
                AA.itemsAreEqual(result.errors, out.errors);
            } finally {
                cli._makeOptionMap = orig;
            }
        },

        'test parseArgs with param arg': function() {
            var out,
                result,
                orig;

            out = {"params": ["foo"],
                "options": {},
                "errors": []
            }

            orig = cli._makeOptionMap;
            cli._makeOptionMap = mockOptionMap;

            try {
                result = cli._parseArgs(["foo"], {});
                AA.itemsAreEqual(result.params, out.params);
                OA.areEqual(result.options, out.options);
                AA.itemsAreEqual(result.errors, out.errors);
            } finally {
                cli._makeOptionMap = orig;
            }
        },

        'test parseArgs with option arg': function() {
            var out,
                result,
                orig;

            out = {"params": [],
                "options": {"verbose": true},
                "errors": []
            }

            result = cli._parseArgs(["-v"], opts);
            AA.itemsAreEqual(result.params, out.params);
            OA.areEqual(result.options, out.options);
            AA.itemsAreEqual(result.errors, out.errors);
        },

        'test parseArgs with invalid arg': function() {
            var out,
                result,
                orig;

            out = {"params": [],
                "options": {},
                "errors": ["Invalid option: -f"]
            }

            result = cli._parseArgs(["-f"], opts);

            AA.itemsAreEqual(result.params, out.params);
            OA.areEqual(result.options, out.options);
            AA.itemsAreEqual(result.errors, out.errors);
        },

        'test run': function() {
            A.isFunction(cli.run);
        }
    }));

    Y.Test.Runner.add(suite);
});
