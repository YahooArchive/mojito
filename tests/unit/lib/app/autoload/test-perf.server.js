/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('mojito-perf', 'test', function(Y) {

    var suite = new Y.Test.Suite('mojito-perf-server-tests'),
        A = Y.Assert,
        OA = Y.ObjectAssert;

    suite.add(new Y.Test.Case({

        setUp: function() {
        },

        tearDown: function() {
        },

        /*
        This is a low-level component, the only thing that is very important
        for us is to make sure that after including mojito-perf, the original
        facade is still in place without any change.
        */

        'test perf facade': function () {
            A.isObject(Y.mojito.perf);
            A.isFunction(Y.mojito.perf.mark);
            A.isFunction(Y.mojito.perf.timeline);
            A.isUndefined(Y.mojito.perf.instrumentMojitoRequest, 'the default facade should not enable this');
        },

        'test perf timeline facade': function () {
            var t = Y.mojito.perf.timeline('group', 'label', 'msg', 'id');
            A.isObject(t);
            A.isFunction(t.done);
        }

    }));

    Y.Test.Runner.add(suite);

});
