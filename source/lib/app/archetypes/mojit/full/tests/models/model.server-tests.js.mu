/*
 * Copyright (c) 2012 Yahoo! Inc. All rights reserved.
 */

YUI.add('{{name}}Model-tests', function(Y) {
    
    var suite = new YUITest.TestSuite('{{name}}Model-tests'),
        model = null,
        A = YUITest.Assert;
    
    suite.add(new YUITest.TestCase({
        
        name: '{{name}} model user tests',
        
        setUp: function() {
            model = Y.mojito.models.{{name}}ModelFoo;
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
    
}, '0.0.1', {requires: ['mojito-test', '{{name}}ModelFoo']});
