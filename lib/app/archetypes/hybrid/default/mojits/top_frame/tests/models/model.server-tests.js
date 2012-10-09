/*
 * Copyright (c) 2012 Yahoo! Inc. All rights reserved.
 */

YUI.add('top_frameModel-tests', function(Y) {
    
    var suite = new YUITest.TestSuite('top_frameModel-tests'),
        model = null,
        A = YUITest.Assert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'top_frame model user tests',
        
        setUp: function() {
            model = Y.mojito.models.top_frameModelFoo;
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
    
}, '0.0.1', {requires: ['mojito-test', 'top_frameModelFoo']});
