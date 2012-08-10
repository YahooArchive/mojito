/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-client-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        rm,
        OA = YUITest.ObjectAssert,
        client;

    suite.add(new YUITest.TestCase({

        name: 'client tests',

        setUp: function() {

        },

        tearDown: function() {

        },

        'TODO Test pause function': function() {

            A.skip();
        },

        'TODO Test resume function': function() {

            A.skip();
        },

        // no deployRuntimeClient object attached to "config"
        'test decompressBinders with no config': function() {

            // var mockConfig = { foo: 'bar' };
            /*
            Y.mojito.Client.prototype.init = function(config) {
                A.areEqual(mockConfig, config, 'wrong config');
            };

            client = new Y.mojito.Client(mockConfig);
            */
        }

    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: ['mojito-client']});
