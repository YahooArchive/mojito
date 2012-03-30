/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('LoaderBinderFoo-tests', function(Y, NAME) {
    
    var suite = new YUITest.TestSuite(NAME),
        binder,
        A = YUITest.Assert;

    suite.add(new YUITest.TestCase({
        
        name: 'Loader binder foo tests',
        
        setUp: function() {
            binder = Y.mojito.binders.LoaderBinderFoo;
        },
        tearDown: function() {
            binder = null;
        },
        
        'test update id': function() {
            var node = Y.Node.create("<div id='guid123'></div>");
            binder.init({
                _guid: 'guid123'
            });
            binder.bind(node);

            binder._updateId('hello');

            var content = node.one('p').getContent();
            Y.log(content);
            A.areSame(content, 'guid123 hello', 'the node was not updated');

        }
        
    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-test', 'node', 'LoaderBinderFoo']});
