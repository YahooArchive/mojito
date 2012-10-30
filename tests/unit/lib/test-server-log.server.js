/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('test', function(Y) {

    var path = require('path'),
        suite = new Y.Test.Suite('mojito-server-log-tests'),
        serverLog = require(path.join(__dirname, '../../../lib/server-log')),
        suite = new Y.Test.Suite('server-log-tests');

    suite.add(new Y.Test.Case({

    	name: 'server-log.server tests',

    	'test serverLog not undefined': function() {
    		Y.Test.Assert.isNotUndefined(serverLog, 'serverLog was not required correctly!');
    	}
    }));

    Y.Test.Runner.add(suite);

});
