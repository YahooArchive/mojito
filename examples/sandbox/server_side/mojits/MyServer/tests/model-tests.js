/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('MyServerModel-tests', function(Y) {
    
    var suite = new YUITest.TestSuite('MyServerModel-tests'),
        model = null,
        A = YUITest.Assert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'MyServer model user tests',
        
        setUp: function() {
            model = new Y.mojit.test.MyServer.model();
        },
        tearDown: function() {
            model = null;
        },
        
        'test mojit model': function() {
            A.isNotNull(model);
            A.isFunction(model.getData);
        }
        
    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojit-test', 'MyServerModel']});
