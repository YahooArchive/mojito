/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('MyServer-tests', function(Y) {
    
    var suite = new YUITest.TestSuite('MyServer-tests'),
        controller = null,
        A = YUITest.Assert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'MyServer user tests',
        
        setUp: function() {
            controller = new Y.mojit.test.MyServer.controller();
        },
        tearDown: function() {
            controller = null;
        },
        
        'test mojit': function() {
            var ac, results;
            A.isNotNull(controller);
            A.isFunction(controller.index);
            ac = {
                done: function(data) {
                    results = data;
                }
            };
            controller.index(ac);
            A.areSame('Mojito is working.', results);
        }
        
    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojit-test', 'MyServer']});
