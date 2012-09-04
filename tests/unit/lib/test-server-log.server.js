/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI().use('test', function(Y) {

    var path = require('path'),
        suite = new Y.Test.Suite('mojito-server-log-tests'),
        serverLog = require(path.join(__dirname, '../../../lib/server-log'));

});
