/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito', 'test', function(Y) {

    var suite = new Y.Test.Suite('mojito-tests'),
        A = Y.Assert,
        OA = Y.ObjectAssert;

    suite.add(new Y.Test.Case({

        setUp: function() {

        },

        tearDown: function() {

        }

    }));

    Y.Test.Runner.add(suite);

});
