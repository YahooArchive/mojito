/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

// NOTE the dependency on 'test' here, but not 'cli', since cli.js is NOT a YUI
// module...and most command files aren't either.
YUI().use('test', function(Y) {

    var suite = new Y.Test.Suite('cli tests'),
        A = Y.Assert,
        OA = Y.ObjectAssert,
        libpath = require('path');

    suite.add(new Y.Test.Case({

        name: 'cli tests',

        'load check': function() {
            var cli = require(libpath.join(__dirname,
                '../../../../lib/management/cli.js'));

            A.isNotNull(cli);
            A.isFunction(cli.run);
        }

    }));

    Y.Test.Runner.add(suite);
});
